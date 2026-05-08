import React from "react";

// ── FWCard ──────────────────────────────────────────────────────────────────
type FWCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export function FWCard({ children, className = "", style, onClick }: FWCardProps) {
  const base: React.CSSProperties = {
    background: "#FFFFFF",
    border: "0.5px solid rgba(0,0,0,0.07)",
    borderRadius: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
    ...style,
  };
  return (
    <div style={base} className={className} onClick={onClick}>
      {children}
    </div>
  );
}

// ── FWSectionLabel ───────────────────────────────────────────────────────────
type FWSectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function FWSectionLabel({ children, className = "" }: FWSectionLabelProps) {
  return (
    <p
      className={`font-cloud-body ${className}`}
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "#6B7280",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

// ── FWButton ─────────────────────────────────────────────────────────────────
type FWButtonVariant = "primary" | "secondary" | "ghost";

type FWButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: FWButtonVariant;
  children: React.ReactNode;
};

const variantStyles: Record<FWButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#D4FF4F",
    color: "#111111",
    border: "none",
  },
  secondary: {
    background: "rgba(255,255,255,0.7)",
    color: "#374151",
    border: "0.5px solid rgba(0,0,0,0.10)",
  },
  ghost: {
    background: "transparent",
    color: "#6B7280",
    border: "0.5px solid rgba(0,0,0,0.08)",
  },
};

export function FWButton({
  variant = "primary",
  children,
  style,
  className = "",
  ...rest
}: FWButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    padding: "0 18px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.15s",
    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
    ...variantStyles[variant],
    ...style,
  };
  return (
    <button style={base} className={`font-cloud-body ${className}`} {...rest}>
      {children}
    </button>
  );
}
