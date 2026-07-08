import { useMutation } from '@tanstack/react-query';
import { useStore } from '@/store';
import { authApiAdapter } from '../infrastructure/auth-api.adapter';

export function useLogout() {
  return useMutation({
    mutationFn: () => authApiAdapter.logout(),
    onSettled: () => {
      // Cerramos la sesión local aunque el request falle (p.ej. token ya
      // expirado) — el objetivo de logout es que el usuario quede fuera.
      useStore.getState().clearSession();
    },
  });
}
