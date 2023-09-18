import { inject, injectable } from 'inversify';

import type { ProfilePayload, EnterProfilePayload, ProfileDetailsPayload } from '#types/account';
import type { ProfileService } from '#src/services/profile.service';
import { useConfigStore } from '#src/stores/ConfigStore';
import { SERVICES } from '#src/ioc/types';

@injectable()
export default class ProfileController {
  private readonly profileService: ProfileService;

  constructor(@inject(SERVICES.Profile) profileService: ProfileService) {
    this.profileService = profileService;
  }

  listProfiles = () => {
    return this.profileService?.listProfiles(undefined, this.getSandbox());
  };

  createProfile = ({ name, adult, avatar_url, pin }: ProfilePayload) => {
    return this.profileService?.createProfile({ name, adult, avatar_url, pin }, this.getSandbox());
  };

  updateProfile = ({ id, name, adult, avatar_url, pin }: ProfilePayload) => {
    return this.profileService?.updateProfile({ id, name, adult, avatar_url, pin }, this.getSandbox());
  };

  enterProfile = ({ id, pin }: EnterProfilePayload) => {
    return this.profileService?.enterProfile({ id, pin }, this.getSandbox());
  };

  deleteProfile = ({ id }: ProfileDetailsPayload) => {
    return this.profileService?.deleteProfile({ id }, this.getSandbox());
  };

  getProfileDetails = async ({ id }: ProfileDetailsPayload) => {
    return this.profileService?.getProfileDetails({ id }, this.getSandbox());
  };

  private getSandbox = () => {
    const { getSandbox } = useConfigStore.getState();

    return getSandbox() ?? true;
  };
}
