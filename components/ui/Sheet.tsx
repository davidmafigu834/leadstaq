"use client";

import { useEffect } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Bottom sheet for narrow viewports (paired with `md:hidden` on trigger). */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="safe-bottom absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-xl border border-[var(--border)] bg-[var(--surface-modal)] shadow-[var(--shadow-modal)]">
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" aria-hidden />
        </div>
        <div className="border-b border-[var(--border)] px-4 pb-3 pt-1">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? <div className="border-t border-[var(--border)]">{footer}</div> : null}
      </div>
    </div>
  );
}
