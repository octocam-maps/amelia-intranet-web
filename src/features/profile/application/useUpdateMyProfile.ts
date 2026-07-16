import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApiAdapter } from '../infrastructure/profile-api.adapter';
import type { UpdateMyProfileInput } from '../domain/models';

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => profileApiAdapter.updateMyProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}
