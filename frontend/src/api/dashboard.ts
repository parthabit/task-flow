import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { DashboardSummary } from '../types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary');
      return data.data as DashboardSummary;
    },
  });
}
