/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

import type { UserRole } from '../domain/models';

export interface UserResponseDTO {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  entity_id: string | null;
  department_id: string | null;
  is_external: boolean;
}

export interface AuthResponseDTO {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponseDTO;
}

export interface TokenResponseDTO {
  access_token: string;
  token_type: string;
  expires_in: number;
}
