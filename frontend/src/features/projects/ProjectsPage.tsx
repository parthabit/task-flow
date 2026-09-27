import { useState } from 'react';
import { Plus, Trash2, Folder } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjects, useDeleteProject } from '../../api/projects';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import { PageHeader } from '../../components/layout/PageHeader';
import { ProjectFormModal } from './ProjectFormModal';
import { useAuth } from '../auth/AuthContext';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project and all of its tasks? This cannot be undone.')) return;
    try {
      await deleteProject.mutateAsync(id);
      toast.success('Project deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Projects"
        subtitle="Group related tasks together and track ownership"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <Spinner />
        ) : !projects || projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start organizing tasks."
            icon={Folder}
            action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New project</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  </div>
                  {(user?.role === 'admin' || user?._id === project.owner._id) && (
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {project.description && <p className="mt-2 text-sm text-gray-500">{project.description}</p>}
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                  <Avatar name={project.owner.name} color={project.owner.avatarColor} size={24} />
                  <span className="text-xs text-gray-500">Owned by {project.owner.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
