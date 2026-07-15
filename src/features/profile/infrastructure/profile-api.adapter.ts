import { apiClient } from '@/lib/http/api-client';
import type { UserProfile } from '../domain/models';
import type { ProfileRepository } from '../domain/ports';
import type { UserProfileDTO } from './dtos';
import { profileFromDTO } from './mappers';

export const profileApiAdapter: ProfileRepository = {
  async getMyProfile(): Promise<UserProfile> {
    const dto = await apiClient<UserProfileDTO>('/profile/me');
    return profileFromDTO(dto);
  },
};
