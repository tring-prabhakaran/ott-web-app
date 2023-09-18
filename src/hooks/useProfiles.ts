import type { ProfilesData } from '@inplayer-org/inplayer.js';
import { UseMutationOptions, UseQueryOptions, useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router';

import { useFavoritesStore } from '#src/stores/FavoritesStore';
import type ProfileController from '#src/stores/ProfileController';
import { useProfileStore } from '#src/stores/ProfileStore';
import { useWatchHistoryStore } from '#src/stores/WatchHistoryStore';
import * as persist from '#src/utils/persist';
import type { CommonAccountResponse, ListProfilesResponse, ProfileDetailsPayload, ProfilePayload } from '#types/account';
import { useAccountStore } from '#src/stores/AccountStore';
import { getController } from '#src/ioc/container';
import { CONTROLLERS } from '#src/ioc/types';
import type AccountController from '#src/stores/AccountController';

const PERSIST_PROFILE = 'profile';

export const unpersistProfile = () => {
  persist.removeItem(PERSIST_PROFILE);
};

export const useSelectProfile = () => {
  const navigate = useNavigate();
  const accountController = getController<AccountController>(CONTROLLERS.Account);
  const profileController = getController<ProfileController>(CONTROLLERS.Profile);

  return useMutation((vars: { id: string; pin?: number; avatarUrl: string }) => profileController?.enterProfile({ id: vars.id, pin: vars.pin }), {
    onMutate: ({ avatarUrl }) => {
      useProfileStore.setState({ selectingProfileAvatar: avatarUrl });
    },
    onSuccess: async (response) => {
      const profile = response?.responseData;
      if (profile?.credentials?.access_token) {
        persist.setItem(PERSIST_PROFILE, profile);
        persist.setItemStorage('inplayer_token', {
          expires: profile.credentials.expires,
          token: profile.credentials.access_token,
          refreshToken: '',
        });
        useFavoritesStore.setState({ favorites: [] });
        useWatchHistoryStore.setState({ watchHistory: [] });
        useProfileStore.setState({ profile });
        await accountController.initializeAccount().finally(() => {
          useProfileStore.setState({ selectingProfileAvatar: null });
          navigate('/');
        });
      }
    },
    onError: () => {
      useProfileStore.setState({ selectingProfileAvatar: null });
      throw new Error('Unable to enter profile.');
    },
  });
};

export const useCreateProfile = (options?: UseMutationOptions<ServiceResponse<ProfilesData> | undefined, unknown, ProfilePayload, unknown>) => {
  const listProfiles = useProfiles();
  const navigate = useNavigate();
  const profileController = getController<ProfileController>(CONTROLLERS.Profile);

  return useMutation<ServiceResponse<ProfilesData> | undefined, unknown, ProfilePayload, unknown>(profileController.createProfile, {
    onSuccess: (res) => {
      const profile = res?.responseData;
      if (profile?.id) {
        listProfiles.refetch();
        navigate('/u/profiles');
      }
    },
    ...options,
  });
};

export const useUpdateProfile = (options?: UseMutationOptions<ServiceResponse<ProfilesData> | undefined, unknown, ProfilePayload, unknown>) => {
  const listProfiles = useProfiles();
  const navigate = useNavigate();
  const profileController = getController<ProfileController>(CONTROLLERS.Profile);

  return useMutation(profileController.updateProfile, {
    onError: () => {
      throw new Error('Unable to update profile.');
    },
    onSuccess: () => {
      navigate('/u/profiles');
    },
    onSettled: () => {
      listProfiles.refetch();
    },
    ...options,
  });
};

export const useDeleteProfile = (options?: UseMutationOptions<ServiceResponse<CommonAccountResponse> | undefined, unknown, ProfileDetailsPayload, unknown>) => {
  const listProfiles = useProfiles();
  const navigate = useNavigate();
  const profileController = getController<ProfileController>(CONTROLLERS.Profile);

  return useMutation<ServiceResponse<CommonAccountResponse> | undefined, unknown, ProfileDetailsPayload, unknown>(profileController.deleteProfile, {
    onSuccess: () => {
      listProfiles.refetch();
      navigate('/u/profiles');
    },
    ...options,
  });
};

export const useProfiles = (
  options?: UseQueryOptions<ServiceResponse<ListProfilesResponse> | undefined, unknown, ServiceResponse<ListProfilesResponse> | undefined, string[]>,
) => {
  const { user, canManageProfiles } = useAccountStore();
  const profileController = canManageProfiles ? getController<ProfileController>(CONTROLLERS.Profile) : undefined;

  const query = useQuery(['listProfiles'], () => profileController?.listProfiles(), { ...options, enabled: !!user && canManageProfiles });

  return { ...query, profilesEnabled: query.data?.responseData.canManageProfiles && canManageProfiles };
};
