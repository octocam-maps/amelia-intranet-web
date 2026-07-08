import type { AmeliaUser, LoginResponse, RefreshResponse } from './models';

export interface AuthRepository {
  /** Intercambia el id_token de Google Identity Services por sesión interna. */
  loginWithGoogle(idToken: string): Promise<LoginResponse>;
  /** Renueva el access token a partir de la cookie HttpOnly de refresh. */
  refresh(): Promise<RefreshResponse>;
  logout(): Promise<void>;
  me(): Promise<AmeliaUser>;
}
