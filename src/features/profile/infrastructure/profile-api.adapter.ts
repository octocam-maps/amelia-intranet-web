import { apiClient } from '@/lib/http/api-client';
import type { UpdateMyProfileInput, UserProfile } from '../domain/models';
import type { ProfileRepository } from '../domain/ports';
import type { UserProfileDTO } from './dtos';
import { profileFromDTO, updateMyProfileInputToDTO } from './mappers';

export const profileApiAdapter: ProfileRepository = {
  async getMyProfile(): Promise<UserProfile> {
    const dto = await apiClient<UserProfileDTO>('/profile/me');
    return profileFromDTO(dto);
  },

  async updateMyProfile(input: UpdateMyProfileInput): Promise<UserProfile> {
    const dto = await apiClient<UserProfileDTO>('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(updateMyProfileInputToDTO(input)),
    });
    return profileFromDTO(dto);
  },
};
