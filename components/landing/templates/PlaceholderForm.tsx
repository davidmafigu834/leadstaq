"use client";

/** Non-submitting placeholder for template marketplace preview (locked templates). */
export function PlaceholderForm() {
  return (
    <div className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-4">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40">Full name</div>
        <div className="mt-1 h-9 rounded border-b border-white/25 bg-transparent" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40">Phone</div>
        <div className="mt-1 h-9 rounded border-b border-white/25 bg-transparent" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40">Email</div>
        <div className="mt-1 h-9 rounded border-b border-white/25 bg-transparent" />
      </div>
      <button type="button" className="mt-2 w-full rounded-md py-2.5 text-sm font-semibold opacity-60" disabled>
        Request Quote
      </button>
    </div>
  );
}
