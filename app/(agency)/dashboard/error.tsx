"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[10px] border border-border bg-surface-card p-8 text-center shadow-md">
        <p className="font-display text-xl text-ink-primary">Something went wrong loading the dashboard</p>
        {isDev && error?.message ? (
          <pre className="mt-4 max-h-40 overflow-auto rounded-sm bg-surface-card-alt p-3 text-left font-mono text-[11px] text-ink-secondary whitespace-pre-wrap">
            {error.message}
          </pre>
        ) : null}
        <button type="button" className="btn-primary mt-6" onClick={() => reset()}>
          Retry
        </button>
      </div>
    </div>
  );
}
