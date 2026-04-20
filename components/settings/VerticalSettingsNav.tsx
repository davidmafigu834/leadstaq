"use client";

export function VerticalSettingsNav({
  tabs,
  active,
  onChange,
  widthClass = "w-[220px]",
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  widthClass?: string;
}) {
  return (
    <nav className={`shrink-0 border-r border-border pr-4 ${widthClass}`} aria-label="Settings sections">
      <ul className="space-y-0.5">
        {tabs.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onChange(t.id)}
              className={`w-full rounded-sm px-3 py-2 text-left text-sm font-medium transition-colors ${
                active === t.id
                  ? "bg-surface-card-alt text-ink-primary"
                  : "text-ink-secondary hover:bg-surface-card-alt/60 hover:text-ink-primary"
              }`}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
