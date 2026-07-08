import { useEffect } from 'react';
import { useStore } from '@/store';
import { authApiAdapter } from '../infrastructure/auth-api.adapter';

/**
 * Silent refresh al cargar la app. El access token vive SOLO en memoria
 * (nunca en localStorage — regla del proyecto), así que tras un F5 no hay
 * nada que "rehidratar": hay que preguntarle al backend, vía la cookie
 * HttpOnly de refresh, si sigue habiendo sesión.
 *
 * Se llama una única vez desde la raíz de la app (`App.tsx`).
 */
export function useAuthBootstrap() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const refreshResult = await authApiAdapter.refresh();
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
