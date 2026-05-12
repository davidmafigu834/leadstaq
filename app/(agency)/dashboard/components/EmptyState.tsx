type Props = {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--ag-surface-3)",
          border: "0.5px solid var(--ag-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 22, color: "var(--ag-text-tertiary)" }} aria-hidden="true" />
      </div>

      <p
        style={{
          fontFamily: "var(--ag-font-display)",
          fontSize: 16,
          color: "var(--ag-text-primary)",
          margin: "0 0 6px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </p>

      <p
        style={{
          fontFamily: "var(--ag-font-body)",
          fontSize: 13,
          color: "var(--ag-text-tertiary)",
          margin: "0 0 20px",
          lineHeight: 1.6,
          maxWidth: 280,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            height: 34,
            padding: "0 16px",
            background: "var(--ag-lime)",
            color: "var(--ag-lime-fg)",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--ag-font-body)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 13 }} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
