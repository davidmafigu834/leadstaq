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
    <nav
      className={`-mx-4 overflow-x-auto border-b border-border px-4 pb-1 scrollbar-hide md:mx-0 md:border-b-0 md:border-r md:px-0 md:pb-0 md:pr-4 ${widthClass}`}
      aria-label="Settings sections"
    >
      <ul className="flex gap-1 md:block md:space-y-0.5">
        {tabs.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onChange(t.id)}
              className={`w-full shrink-0 whitespace-nowrap rounded-sm px-3 py-3 text-left text-sm font-medium transition-colors md:py-2 ${
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
