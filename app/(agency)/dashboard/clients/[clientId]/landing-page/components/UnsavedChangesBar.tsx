"use client";

import { motion, AnimatePresence } from "framer-motion";

export function UnsavedChangesBar({
  visible,
  onDiscard,
  onSave,
  saving,
}: {
  visible: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--border-dark)] bg-[var(--surface-sidebar)] px-6 py-3 text-[var(--text-on-dark)]"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-[13px] font-medium">Unsaved changes</p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost h-9 border border-[var(--surface-sidebar-border)] text-[var(--text-on-dark)]" onClick={onDiscard} disabled={saving}>
                Discard
              </button>
              <button
                type="button"
                className="h-9 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-50"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
