import { CloudOff } from "lucide-react";

interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white/70 p-8 text-center">
      <CloudOff className="mx-auto h-10 w-10 text-ink-500" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-black text-ink-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">{body}</p>
    </div>
  );
}
