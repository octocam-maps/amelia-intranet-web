import type { RefreshResponse } from '../domain/models';
import { authApiAdapter } from './auth-api.adapter';

let inFlight: Promise<RefreshResponse> | null = null;

/**
 * Single-flight sobre `POST /auth/refresh`. Sin esto, cualquier fuente de
 * llamadas casi simultáneas (React StrictMode montando el efecto de
 * bootstrap dos veces en dev, varias pestañas, un futuro interceptor de
 * 401 que también dispare refresh) manda VARIOS refresh concurrentes con
 * el MISMO refresh token — cada uno rota una sesión distinta en el backend
 * y, en el mejor caso, deja sesiones activas en paralelo; en el peor,
 * dispara la detección de reuso del backend y se autodenuncia como robo,
 * cerrando la sesión sin motivo real.
 *
 * Mientras haya una petición en vuelo, cualquier llamador adicional
 * reutiliza esa MISMA promesa en vez de lanzar un `fetch` nuevo — como
 * mucho un refresh en curso a la vez en esta pestaña.
 */
export function refreshSessionSingleFlight(): Promise<RefreshResponse> {
  if (!inFlight) {
    inFlight = authApiAdapter.refresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
