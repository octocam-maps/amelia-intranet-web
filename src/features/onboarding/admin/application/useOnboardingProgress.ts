import { useQuery } from '@tanstack/react-query';
import { onboardingAdminApiAdapter } from '../infrastructure/onboarding-admin-api.adapter';

/** Progreso de TODA la plantilla — se refresca a menudo (30s) porque un
 * cuestionario reabierto o un paso recién completado debe reflejarse sin
 * que el admin tenga que recargar la página a mano. */
export function useOnboardingProgress() {
  return useQuery({
    queryKey: ['onboarding', 'admin', 'progress'],
    queryFn: () => onboardingAdminApiAdapter.listProgress(),
    staleTime: 30_000,
  });
}
