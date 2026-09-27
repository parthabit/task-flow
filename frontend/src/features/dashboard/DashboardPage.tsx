import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ListChecks, FolderKanban, AlertTriangle, Users as UsersIcon } from 'lucide-react';
import { useDashboardSummary } from '../../api/dashboard';
import { Spinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';

const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981'];

function StatCard({ label, value, icon: Icon, tint }: { label: string; value: number | string; icon: any; tint: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`rounded-lg p-2 ${tint}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) return <Spinner full />;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Dashboard" subtitle="A snapshot of everything moving across your projects" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tasks" value={data.totalTasks} icon={ListChecks} tint="bg-blue-50 text-blue-600" />
        <StatCard label="Projects" value={data.totalProjects} icon={FolderKanban} tint="bg-brand-50 text-brand-600" />
        <StatCard label="Overdue" value={data.overdue} icon={AlertTriangle} tint="bg-red-50 text-red-600" />
        {data.totalUsers !== undefined && (
          <StatCard label="Team members" value={data.totalUsers} icon={UsersIcon} tint="bg-emerald-50 text-emerald-600" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Tasks by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {data.byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">New tasks, last 7 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
