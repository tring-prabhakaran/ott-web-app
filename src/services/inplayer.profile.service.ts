import { injectable } from 'inversify';
import InPlayer from '@inplayer-org/inplayer.js';

import type { CreateProfile, DeleteProfile, EnterProfile, GetProfileDetails, ListProfiles, UpdateProfile } from '#types/account';
import type { ProfileService } from '#src/services/profile.service';

@injectable()
export default class InplayerProfileService implements ProfileService {
  listProfiles: ListProfiles = async () => {
    try {
      const response = await InPlayer.Account.getProfiles();
      return {
        responseData: {
          canManageProfiles: true,
          collection: response.data,
        },
        errors: [],
      };
    } catch {
      console.error('Unable to list profiles.');
      return {
        responseData: {
          canManageProfiles: false,
          collection: [],
        },
        errors: ['Unable to list profiles.'],
      };
    }
  };

  createProfile: CreateProfile = async (payload) => {
    try {
      const response = await InPlayer.Account.createProfile(payload.name, payload.adult, payload.avatar_url, payload.pin);
      return {
        responseData: response.data,
        errors: [],
      };
    } catch {
      throw new Error('Unable to create profile.');
    }
  };

  updateProfile: UpdateProfile = async (payload) => {
    try {
      if (!payload.id) {
        throw new Error('Profile id is required.');
      }
      const response = await InPlayer.Account.updateProfile(payload.id, payload.name, payload.avatar_url, payload.adult);
      return {
        responseData: response.data,
        errors: [],
      };
    } catch {
      throw new Error('Unable to update profile.');
    }
  };

  enterProfile: EnterProfile = async ({ id, pin }) => {
    try {
      const response = await InPlayer.Account.enterProfile(id, pin);
      return {
        responseData: response.data,
        errors: [],
      };
    } catch {
      throw new Error('Unable to enter profile.');
    }
  };

  getProfileDetails: GetProfileDetails = async ({ id }) => {
    try {
      const response = await InPlayer.Account.getProfileDetails(id);
      return {
        responseData: response.data,
        errors: [],
      };
    } catch {
      throw new Error('Unable to get profile details.');
    }
  };

  deleteProfile: DeleteProfile = async ({ id }) => {
    try {
      await InPlayer.Account.deleteProfile(id);
      return {
        responseData: {
          message: 'Profile deleted successfully',
          code: 200,
        },
        errors: [],
      };
    } catch {
      throw new Error('Unable to delete profile.');
    }
  };
}
