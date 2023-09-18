import type { CreateProfile, DeleteProfile, EnterProfile, GetProfileDetails, ListProfiles, UpdateProfile } from '#types/account';

export interface ProfileService {
  listProfiles: ListProfiles;
  createProfile: CreateProfile;
  updateProfile: UpdateProfile;
  enterProfile: EnterProfile;
  getProfileDetails: GetProfileDetails;
  deleteProfile: DeleteProfile;
}
