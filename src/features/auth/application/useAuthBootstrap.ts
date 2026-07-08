import { useEffect } from 'react';
import { useStore } from '@/store';
import { authApiAdapter } from '../infrastructure/auth-api.adapter';
import { refreshSessionSingleFlight } from '../infrastructure/refresh-single-flight';

/**
 * Silent refresh al cargar la app. El access token vive SOLO en memoria
 * (nunca en localStorage — regla del proyecto), así que tras un F5 no hay
 * nada que "rehidratar": hay que preguntarle al backend, vía la cookie
 * HttpOnly de refresh, si sigue habiendo sesión.
 *
 * Se llama una única vez desde la raíz de la app (`App.tsx`). Usa
 * `refreshSessionSingleFlight` (no `authApiAdapter.refresh` directo): en
 * dev, React StrictMode monta este efecto dos veces — sin single-flight,
 * eso dispara DOS `POST /auth/refresh` con el mismo refresh token y el
 * backend termina con sesiones duplicadas o revocando la familia entera
 * por detección de reuso. `cancelled` sigue haciendo falta para no aplicar
 * el resultado del primer montaje ya limpiado, pero no evita el segundo
 * fetch por sí solo — de eso se encarga el single-flight.
 */
export function useAuthBootstrap() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const refreshResult = await refreshSessionSingleFlight();
        if (cancelled) return;
        useStore.getState().setSessionFromRefresh(refreshResult);

        const user = await authApiAdapter.me();
        if (cancelled) return;
        useStore.getState().setUser(user);
      } catch {
        // Sin cookie de refresh (o expirada): no hay sesión, nada que hacer.
        // El usuario verá la pantalla de login.
      } finally {
        if (!cancelled) {
          useStore.getState().markAuthSessionReady();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
