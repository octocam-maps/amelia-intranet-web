import type { UpdateMyProfileInput, UserProfile } from './models';

export interface ProfileRepository {
  getMyProfile(): Promise<UserProfile>;
  updateMyProfile(input: UpdateMyProfileInput): Promise<UserProfile>;
}
