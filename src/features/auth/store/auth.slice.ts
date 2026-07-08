import type { StateCreator } from 'zustand';
import type { AmeliaUser, LoginResponse, RefreshResponse } from '../domain/models';

export interface AuthSlice {
  accessToken: string | null;
  expiresAt: number | null;
  user: AmeliaUser | null;
  /**
   * False hasta que el intento de silent refresh (al cargar la app) haya
   * terminado. Mientras tanto, `ProtectedRoute` no debe decidir nada — el
   * access token vive SOLO en memoria (nunca en localStorage), así que tras
   * un F5 hay que preguntarle al backend (cookie HttpOnly) si hay sesión.
   */
  authSessionReady: boolean;

  setSessionFromLogin: (response: LoginResponse) => void;
  setSessionFromRefresh: (response: RefreshResponse) => void;
  setUser: (user: AmeliaUser) => void;
  clearSession: () => void;
  markAuthSessionReady: () => void;

  isAuthenticated: () => boolean;
  getAccessToken: () => string | null;
}

export const createAuthSlice: StateCreator<
  AuthSlice,
  [['zustand/immer', never]],
  [],
  AuthSlice
> = (set, get) => ({
  accessToken: null,
  expiresAt: null,
  user: null,
  authSessionReady: false,

  setSessionFromLogin: (response) => {
    set((state) => {
      state.accessToken = response.accessToken;
      state.expiresAt = Date.now() + response.expiresIn * 1000;
      state.user = response.user;
    });
  },

  setSessionFromRefresh: (response) => {
    set((state) => {
      state.accessToken = response.accessToken;
      state.expiresAt = Date.now() + response.expiresIn * 1000;
    });
  },

  setUser: (user) => {
    set((state) => {
      state.user = user;
    });
  },

  clearSession: () => {
    set((state) => {
      state.accessToken = null;
      state.expiresAt = null;
      state.user = null;
    });
  },

  markAuthSessionReady: () => {
    set((state) => {
      state.authSessionReady = true;
    });
  },

  isAuthenticated: () => {
    const { accessToken, expiresAt } = get();
    return !!accessToken && !!expiresAt && expiresAt > Date.now();
  },

  getAccessToken: () => {
    const { accessToken, expiresAt } = get();
    if (!accessToken || !expiresAt || expiresAt <= Date.now()) return null;
    return accessToken;
  },
});
