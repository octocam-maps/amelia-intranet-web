import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';
import type { StaffMemberInput } from '../domain/models';

export function useUpdateStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StaffMemberInput> }) =>
      staffApiAdapter.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    },
  });
}
