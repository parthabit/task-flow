import { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TaskFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="hidden bg-gradient-to-br from-brand-600 to-brand-800 lg:flex lg:flex-col lg:justify-center lg:p-16">
        <blockquote className="text-2xl font-medium leading-snug text-white">
          "The team finally has one place to see what's actually happening across every project."
        </blockquote>
        <p className="mt-4 text-sm text-brand-200">— A TaskFlow customer, probably you soon</p>
      </div>
    </div>
  );
}
