import { Routes, Route } from 'react-router-dom';
import LandingPage from './features/marketing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TasksPage from './features/tasks/TasksPage';
import ProjectsPage from './features/projects/ProjectsPage';
import UsersPage from './features/users/UsersPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/tasks" element={<TasksPage />} />
          <Route path="/dashboard/projects" element={<ProjectsPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/dashboard/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<div className="p-10 text-center text-gray-500">Page not found</div>} />
    </Routes>
  );
}
