import { apiClient } from '@/lib/http/api-client';
import type { DashboardSummary } from '../domain/models';
import type { DashboardSummaryDTO } from './dtos';
import { summaryFromDTO } from './mappers';

export const dashboardApiAdapter = {
  async getSummary(): Promise<DashboardSummary> {
    const dto = await apiClient<DashboardSummaryDTO>('/dashboard/summary');
    return summaryFromDTO(dto);
  },
};
