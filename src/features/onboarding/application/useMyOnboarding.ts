import { useQuery } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

export function useMyOnboarding() {
  return useQuery({
    queryKey: ['onboarding', 'me'],
    queryFn: () => onboardingApiAdapter.getMyOnboarding(),
    staleTime: 15_000,
  });
}
