import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, FolderKanban, Users, LogOut, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../features/auth/AuthContext';
import { Avatar } from '../ui/Avatar';
import toast from 'react-hot-toast';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <CheckCircle2 className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900">TaskFlow</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
                )
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/dashboard/users"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
                )
              }
            >
              <Users className="h-4.5 w-4.5" />
              Users
            </NavLink>
          )}
        </nav>
        {user && (
          <div className="flex items-center gap-3 border-t border-gray-200 p-4">
            <Avatar name={user.name} color={user.avatarColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <button onClick={handleLogout} title="Log out" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
