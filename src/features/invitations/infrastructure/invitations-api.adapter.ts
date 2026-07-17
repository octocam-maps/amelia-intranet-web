import { apiClient } from '@/lib/http/api-client';
import type { Invitation, InvitationStatus } from '../domain/models';
import type { InvitationRepository } from '../domain/ports';
import type { InvitationDTO, InvitationListDTO } from './dtos';
import { invitationFromDTO } from './mappers';

export const invitationsApiAdapter: InvitationRepository = {
  async list(status?: InvitationStatus): Promise<Invitation[]> {
    const query = status ? `?status=${status}` : '';
    const dto = await apiClient<InvitationListDTO>(`/invitations${query}`);
    return dto.invitations.map(invitationFromDTO);
  },

  async resend(id: string): Promise<Invitation> {
    const dto = await apiClient<InvitationDTO>(`/invitations/${id}/resend`, { method: 'POST' });
    return invitationFromDTO(dto);
  },

  async cancel(id: string): Promise<Invitation> {
    const dto = await apiClient<InvitationDTO>(`/invitations/${id}/cancel`, { method: 'POST' });
    return invitationFromDTO(dto);
  },
};
