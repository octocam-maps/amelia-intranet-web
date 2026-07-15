import { useQuery } from '@tanstack/react-query';
import { profileApiAdapter } from '../infrastructure/profile-api.adapter';

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApiAdapter.getMyProfile(),
    staleTime: 60_000,
  });
}
