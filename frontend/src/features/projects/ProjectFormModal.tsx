import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useCreateProject } from '../../api/projects';

interface FormValues {
  name: string;
  description?: string;
  color: string;
}

const palette = ['#6366F1', '#F97316', '#10B981', '#EC4899', '#0EA5E9', '#8B5CF6'];

export function ProjectFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createProject = useCreateProject();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', description: '', color: palette[0] },
  });
  const selectedColor = watch('color');

  const onSubmit = async (values: FormValues) => {
    try {
      await createProject.mutateAsync(values);
      toast.success('Project created');
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not create project');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New project">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Project name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('description')}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue('color', c)}
                className={`h-8 w-8 rounded-full ring-offset-2 transition-all ${selectedColor === c ? 'ring-2 ring-gray-900' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createProject.isPending}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
