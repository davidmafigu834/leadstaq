export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="mb-8 flex justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-40 rounded-sm bg-surface-card-alt" />
          <div className="h-10 w-56 max-w-full rounded-sm bg-surface-card-alt" />
        </div>
        <div className="h-4 w-32 rounded-sm bg-surface-card-alt" />
      </div>
      <div className="flex h-[88px] gap-0 overflow-hidden rounded-[10px] border border-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-full flex-1 border-r border-border bg-surface-card-alt last:border-r-0" />
        ))}
      </div>
      <div className="h-14 rounded-[10px] border border-border bg-surface-card-alt" />
      <div className="grid grid-cols-1 gap-8 min-[1100px]:grid-cols-[3fr_2fr]">
        <div className="space-y-3">
          <div className="h-4 w-48 rounded-sm bg-surface-card-alt" />
          <div className="h-8 w-40 rounded-sm bg-surface-card-alt" />
          <div className="h-40 rounded-sm bg-surface-card-alt" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 rounded-sm bg-surface-card-alt" />
          <div className="h-8 w-28 rounded-sm bg-surface-card-alt" />
          <div className="h-48 rounded-sm bg-surface-card-alt" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 min-[720px]:grid-cols-2 min-[1200px]:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 rounded-[10px] border border-border bg-surface-card-alt" />
        ))}
      </div>
    </div>
  );
}
