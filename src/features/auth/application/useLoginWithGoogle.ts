import { useMutation } from '@tanstack/react-query';
import { useStore } from '@/store';
import { authApiAdapter } from '../infrastructure/auth-api.adapter';

/** Intercambia el `id_token` de Google Identity Services por sesión interna. */
export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: (idToken: string) => authApiAdapter.loginWithGoogle(idToken),
    onSuccess: (result) => {
      useStore.getState().setSessionFromLogin(result);
    },
  });
}
