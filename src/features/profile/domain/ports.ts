import type { UserProfile } from './models';

export interface ProfileRepository {
  getMyProfile(): Promise<UserProfile>;
}
