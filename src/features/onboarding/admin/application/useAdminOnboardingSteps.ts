import { useQuery } from '@tanstack/react-query';
import { onboardingAdminApiAdapter } from '../infrastructure/onboarding-admin-api.adapter';

/** Los 5 pasos con su `config` COMPLETO (incluye `correct` en el quiz) —
 * exclusivo de la pantalla de administración, nunca se comparte cache con
 * `['onboarding','me']` (el empleado no debe ver las respuestas correctas). */
export function useAdminOnboardingSteps() {
  return useQuery({
    queryKey: ['onboarding', 'admin', 'steps'],
    queryFn: () => onboardingAdminApiAdapter.listSteps(),
    staleTime: 60_000,
  });
}
