import { useStore } from '@/store';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Solo se rellena cuando el 422 viene del validador NATIVO de Pydantic
   * (`RequestValidationError.errors()`, forma `{"detail": [{loc, msg,
   * type}, ...]}`) — los errores de dominio (`BaseError` -> `error_handler`)
   * ya llegan como un único `message` y no necesitan este mapa. Clave:
   * último segmento de `loc` (nombre del campo del DTO); valor: `msg` del
   * backend. Permite que un formulario haga `setError(field, {message})`
   * por campo en vez de un único error genérico. */
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

interface ParsedError {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

/** `loc` típico: `["body", "department_id"]` o `["body", "birth_date"]` —
 * se descarta `"body"`/`"query"`/índices numéricos y se queda con el último
 * segmento con nombre, que coincide con el campo del DTO/formulario. */
function fieldNameFromLoc(loc: unknown[]): string | undefined {
  const named = loc.filter((segment): segment is string => typeof segment === 'string' && segment !== 'body');
  return named[named.length - 1];
}

function parseValidationErrorList(errors: unknown[], status: number): ParsedError {
  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  for (const item of errors) {
    if (!isRecord(item) || typeof item.msg !== 'string') continue;
    messages.push(item.msg);
    const field = Array.isArray(item.loc) ? fieldNameFromLoc(item.loc) : undefined;
    if (field) fieldErrors[field] = item.msg;
  }

  if (messages.length === 0) return { message: `Error ${status}` };
  return { message: messages.join(' '), fieldErrors };
}

function parseErrorPayload(payload: unknown, status: number): ParsedError {
  // El backend devuelve {"detail": {"code": ..., "message": ...}} (errores
  // de dominio), {"detail": "..."} o {"detail": [...]} (422 nativo de
  // Pydantic — un array de `{loc, msg, type}`, uno por campo inválido).
  if (isRecord(payload) && Array.isArray(payload.detail)) {
    return parseValidationErrorList(payload.detail, status);
  }
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

    throw new ApiError(parsed.message, response.status, parsed.code, parsed.fieldErrors);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
