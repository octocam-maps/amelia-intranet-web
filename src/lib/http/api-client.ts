import { useStore } from '@/store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function parseErrorPayload(payload: unknown, status: number): { message: string; code?: string } {
  // El backend devuelve {"detail": {"code": ..., "message": ...}} o {"detail": "..."}.
  if (isRecord(payload) && isRecord(payload.detail)) {
    const detail = payload.detail;
    return {
      message: typeof detail.message === 'string' ? detail.message : `Error ${status}`,
      code: typeof detail.code === 'string' ? detail.code : undefined,
    };
  }
  if (isRecord(payload) && typeof payload.detail === 'string') {
    return { message: payload.detail };
  }
  return { message: `Error ${status}` };
}

interface RequestOptions extends RequestInit {
  /** Si es `true`, no adjunta `Authorization` (login, refresh). */
  skipAuth?: boolean;
  /** Interno: marca el reintento tras un refresh para no reintentar en bucle. */
  _retriedAfterRefresh?: boolean;
}

/**
 * Cliente HTTP único de la app. `credentials: 'include'` es obligatorio: es
 * lo que manda la cookie HttpOnly del refresh token en cada request.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, _retriedAfterRefresh, headers, ...init } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  const accessToken = useStore.getState().getAccessToken();
  if (accessToken && !skipAuth) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { ...requestHeaders, ...headers },
  });

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => ({}));
    const parsed = parseErrorPayload(errorBody, response.status);

    // Un 401 suele ser solo el access token expirado (vive ~15 min, en
    // memoria). Antes de cerrar la sesión de golpe, intentamos UNA renovación
    // con la cookie HttpOnly de refresh y reintentamos la petición original;
    // solo si el refresh falla asumimos que la sesión murió de verdad.
    // `_retriedAfterRefresh` corta el bucle si el reintento vuelve a dar 401.
    if (response.status === 401 && !skipAuth && !_retriedAfterRefresh) {
      try {
        // Import dinámico: rompe el ciclo api-client → refresh → adapter → api-client.
        const { refreshSessionSingleFlight } = await import(
          '@/features/auth/infrastructure/refresh-single-flight'
        );
        const refreshed = await refreshSessionSingleFlight();
        useStore.getState().setSessionFromRefresh(refreshed);
        return apiClient<T>(endpoint, { ...options, _retriedAfterRefresh: true });
      } catch {
        // El refresh también falló: ahora sí, la sesión terminó.
        useStore.getState().clearSession();
      }
    }

    throw new ApiError(parsed.message, response.status, parsed.code);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
