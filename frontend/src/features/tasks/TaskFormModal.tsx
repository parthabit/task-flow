import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useCreateTask, useUpdateTask } from '../../api/tasks';
import { useProjects } from '../../api/projects';
import { Task, TaskInput } from '../../types';

interface FormValues {
  title: string;
  description?: string;
  project: string;
  status: string;
  priority: string;
  dueDate?: string;
}

export function TaskFormModal({ isOpen, onClose, task }: { isOpen: boolean; onClose: () => void; task?: Task | null }) {
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEditing = Boolean(task);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    values: task
      ? {
          title: task.title,
          description: task.description,
          project: task.project._id,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.slice(0, 10),
        }
      : { title: '', description: '', project: '', status: 'todo', priority: 'medium', dueDate: '' },
  });

  const onSubmit = async (values: FormValues) => {
    const payload: TaskInput = {
      ...values,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
    };
    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task._id, payload });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Task created');
      }
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    }
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Title" error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('description')}
          />
        </div>
        <Select label="Project" {...register('project', { required: true })}>
          <option value="">Select a project</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" {...register('status')}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </Select>
          <Select label="Priority" {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        <Input label="Due date" type="date" {...register('dueDate')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
