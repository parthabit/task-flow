import { Link } from 'react-router-dom';
import { CheckCircle2, ListChecks, BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const features = [
  { icon: ListChecks, title: 'Organize everything', desc: 'Projects and tasks with status, priority, and due dates.' },
  { icon: BarChart3, title: 'See the big picture', desc: 'A live dashboard shows exactly where work stands.' },
  { icon: ShieldCheck, title: 'Built-in access control', desc: 'Role-based permissions keep admin actions safe.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <CheckCircle2 className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">TaskFlow</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/signup"><Button>Get started</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Project management that keeps up with your team.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
          TaskFlow gives your team one place to plan projects, track tasks, and see progress —
          without the bloat.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/signup"><Button className="px-6 py-3 text-base">Start for free</Button></Link>
          <Link to="/login"><Button variant="secondary" className="px-6 py-3 text-base">Sign in</Button></Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 pb-24 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-gray-200 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <Icon className="h-5 w-5 text-brand-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mt-1.5 text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
