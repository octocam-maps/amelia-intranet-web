import { useQuery } from '@tanstack/react-query';
import { dashboardApiAdapter } from '../infrastructure/dashboard-api.adapter';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApiAdapter.getSummary(),
    staleTime: 15_000,
  });
}
