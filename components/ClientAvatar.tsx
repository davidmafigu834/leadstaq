const PALETTE_VARS = [
  "var(--avatar-palette-0)",
  "var(--avatar-palette-1)",
  "var(--avatar-palette-2)",
  "var(--avatar-palette-3)",
  "var(--avatar-palette-4)",
  "var(--avatar-palette-5)",
];

function hashName(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return Math.abs(sum) % 6;
}

const legacySize: Record<"sm" | "md" | "lg", number> = { sm: 24, md: 32, lg: 64 };

export function ClientAvatar({
  name,
  size = 32,
  src,
}: {
  name: string;
  size?: number | "sm" | "md" | "lg";
  /** When set, shows photo instead of initials */
  src?: string | null;
}) {
  const px = typeof size === "number" ? size : legacySize[size];
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
  const bg = PALETTE_VARS[hashName(name)];
  const fontSize = px * 0.4;

  if (src?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="inline-block shrink-0 rounded-full object-cover"
        width={px}
        height={px}
      />
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-ink-primary"
      style={{
        width: px,
        height: px,
        backgroundColor: bg,
        fontSize,
        fontWeight: 500,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
