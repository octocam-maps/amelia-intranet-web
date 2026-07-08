import type { AmeliaUser, LoginResponse, RefreshResponse } from '../domain/models';
import type { AuthResponseDTO, TokenResponseDTO, UserResponseDTO } from './dtos';

export function userFromDTO(dto: UserResponseDTO): AmeliaUser {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.full_name,
    avatarUrl: dto.avatar_url,
    role: dto.role,
    entityId: dto.entity_id,
    departmentId: dto.department_id,
    isExternal: dto.is_external,
  };
}

export function loginResponseFromDTO(dto: AuthResponseDTO): LoginResponse {
  return {
    accessToken: dto.access_token,
    expiresIn: dto.expires_in,
    user: userFromDTO(dto.user),
  };
}

export function refreshResponseFromDTO(dto: TokenResponseDTO): RefreshResponse {
  return { accessToken: dto.access_token, expiresIn: dto.expires_in };
}
