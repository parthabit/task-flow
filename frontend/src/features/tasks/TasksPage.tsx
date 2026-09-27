import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { useTasks, useDeleteTask } from '../../api/tasks';
import { useProjects } from '../../api/projects';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { PageHeader } from '../../components/layout/PageHeader';
import { TaskFormModal } from './TaskFormModal';
import { Task } from '../../types';
import { format } from 'date-fns';

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [project, setProject] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const { data: projects } = useProjects();
  const { data, isLoading, isFetching } = useTasks({
    page,
    limit: 8,
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    project: project || undefined,
    sort,
  });
  const deleteTask = useDeleteTask();

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const toggleSort = (field: string) => {
    setSort((prev) => (prev === field ? `-${field}` : field));
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Tasks"
        subtitle="Search, filter, and manage every task across your projects"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </Select>
        <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
        <Select value={project} onChange={(e) => { setProject(e.target.value); setPage(1); }}>
          <option value="">All projects</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft">
        {isLoading ? (
          <Spinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Try adjusting your filters, or create a new task to get started."
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New task</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">
                      <button className="flex items-center gap-1" onClick={() => toggleSort('title')}>
                        Task <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">
                      <button className="flex items-center gap-1" onClick={() => toggleSort('dueDate')}>
                        Due <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((task) => (
                    <tr key={task._id} className={isFetching ? 'opacity-60' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && <p className="max-w-xs truncate text-xs text-gray-500">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                          {task.project.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={task.priority} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(task)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(task._id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <TaskFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} task={editingTask} />
    </div>
  );
}
