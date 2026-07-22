import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store';
import { authApiAdapter } from '../infrastructure/auth-api.adapter';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApiAdapter.logout(),
    onSettled: () => {
      // Cerramos la sesión local aunque el request falle (p.ej. token ya
      // expirado) — el objetivo de logout es que el usuario quede fuera.
      useStore.getState().clearSession();
      // STATE-1 (HIGH): el login navega in-app sin recargar la página, así
      // que el QueryClient (creado una única vez en App.tsx) sobrevive al
      // cambio de sesión. Sin este `clear()`, en un dispositivo compartido
      // el usuario B vería por stale-while-revalidate la PII cacheada del
      // usuario A (perfil, nóminas, saldo de vacaciones) antes de que las
      // queries revaliden contra el backend.
      queryClient.clear();
    },
  });
}
