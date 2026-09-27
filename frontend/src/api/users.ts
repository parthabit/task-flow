import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Paginated, User } from '../types';

export function useUsers(params: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<User>>('/users', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'user' | 'admin' }) => {
      const { data } = await api.patch(`/users/${id}/role`, { role });
      return data.data as User;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
