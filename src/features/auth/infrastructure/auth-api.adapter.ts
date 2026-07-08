import { apiClient } from '@/lib/http/api-client';
import type { AmeliaUser, LoginResponse, RefreshResponse } from '../domain/models';
import type { AuthRepository } from '../domain/ports';
import type { AuthResponseDTO, TokenResponseDTO, UserResponseDTO } from './dtos';
import { loginResponseFromDTO, refreshResponseFromDTO, userFromDTO } from './mappers';

export const authApiAdapter: AuthRepository = {
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    const dto = await apiClient<AuthResponseDTO>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ id_token: idToken }),
    });
    return loginResponseFromDTO(dto);
  },

  async refresh(): Promise<RefreshResponse> {
    const dto = await apiClient<TokenResponseDTO>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    return refreshResponseFromDTO(dto);
  },

  async logout(): Promise<void> {
    await apiClient<null>('/auth/logout', { method: 'POST' });
  },

  async me(): Promise<AmeliaUser> {
    const dto = await apiClient<UserResponseDTO>('/auth/me');
    return userFromDTO(dto);
  },
};
