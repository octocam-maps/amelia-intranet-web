import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';
import type { StaffMemberInput } from '../domain/models';

export function useCreateStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StaffMemberInput) => staffApiAdapter.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    },
  });
}
