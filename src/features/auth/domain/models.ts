export type UserRole = 'administrador' | 'empleado' | 'externo_invitado';

export interface AmeliaUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  entityId: string | null;
  departmentId: string | null;
  isExternal: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AmeliaUser;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
