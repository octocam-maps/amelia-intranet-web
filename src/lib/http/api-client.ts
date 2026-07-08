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
}

/**
 * Cliente HTTP único de la app. `credentials: 'include'` es obligatorio: es
 * lo que manda la cookie HttpOnly del refresh token en cada request.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers, ...init } = options;
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

    if (response.status === 401 && !skipAuth) {
      useStore.getState().clearSession();
    }

    throw new ApiError(parsed.message, response.status, parsed.code);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
