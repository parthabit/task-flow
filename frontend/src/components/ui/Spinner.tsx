import { Loader2 } from 'lucide-react';

export function Spinner({ full }: { full?: boolean }) {
  return (
    <div className={full ? 'flex min-h-[50vh] items-center justify-center' : 'flex items-center justify-center py-10'}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    </div>
  );
}
