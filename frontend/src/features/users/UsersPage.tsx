import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { useUsers, useUpdateUserRole } from '../../api/users';
import { useDebounce } from '../../hooks/useDebounce';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { format } from 'date-fns';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading } = useUsers({ page, limit: 8, search: debouncedSearch || undefined });
  const updateRole = useUpdateUserRole();

  const handleRoleChange = async (id: string, role: 'user' | 'admin') => {
    try {
      await updateRole.mutateAsync({ id, role });
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Users" subtitle="Manage team members and their access level" />

      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft">
        {isLoading ? (
          <Spinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No users found" description="Try a different search term." />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} />
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      {u._id === currentUser?._id ? (
                        <Badge value={u.role} />
                      ) : (
                        <Select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as 'user' | 'admin')}
                          className="w-32"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
