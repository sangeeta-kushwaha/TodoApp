function Pulse({ className }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none ${className}`}
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-line bg-surface p-5"
        >
          <Pulse className="h-4 w-24" />
          <Pulse className="mt-4 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TaskListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      <p className="sr-only" role="status">
        Loading tasks
      </p>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <Pulse className="h-5 w-1/3" />
            <Pulse className="mt-3 h-4 w-2/3" />
            <Pulse className="mt-4 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
      <p role="status" className="text-sm font-medium text-muted">
        Loading Taskboard…
      </p>
    </div>
  );
}
