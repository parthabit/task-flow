export type Role = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  owner: User;
  members: User[];
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  project: { _id: string; name: string; color: string };
  assignee?: User;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  project: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  dueDate?: string;
  assignee?: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardSummary {
  totalTasks: number;
  totalProjects: number;
  overdue: number;
  totalUsers?: number;
  byStatus: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  last7Days: { _id: string; count: number }[];
}
