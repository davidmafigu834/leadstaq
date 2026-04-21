"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";

function suggestSlugFromName(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return s.length > 0 ? s : "client";
}

export function CreateClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setName("");
    setIndustry("");
    setSlug("");
    setSlugTouched(false);
    setError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    setError(null);
  }, [open, reset]);

  useEffect(() => {
    if (!open || slugTouched) return;
    setSlug(suggestSlugFromName(name));
  }, [name, open, slugTouched]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const slugNorm = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slugNorm)) {
      setError("Slug may only contain lowercase letters, numbers, and hyphens.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim(),
          slug: slugNorm,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; client?: { id?: string } };
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Could not create client");
        return;
      }
      const id = j.client?.id;
      if (!id) {
        setError("Created but no client id returned.");
        return;
      }
      onClose();
      reset();
      router.push(`/dashboard/clients/${id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-surface-overlay md:items-center md:justify-center md:px-4 md:py-8">
      <div className="flex h-full w-full flex-col border border-border bg-surface-card shadow-lg md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-lg">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:h-auto md:border-b-0 md:px-6 md:pt-6">
          <button type="button" className="flex h-9 w-9 items-center justify-center md:hidden" onClick={onClose} aria-label="Back">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <h2 className="min-w-0 flex-1 truncate font-display text-xl text-ink-primary">New client</h2>
          <button
            type="button"
            className="hidden text-ink-tertiary hover:text-ink-primary md:block"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6 md:pt-2">
            <p className="mt-2 text-sm text-ink-secondary">
              After you create the client, you will go to their overview to finish setup (landing page, form, team, and
              optional Facebook).
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink-secondary">Client name *</label>
                <input
                  className="input-base h-11 w-full text-base md:h-10 md:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink-secondary">Industry *</label>
                <input
                  className="input-base h-11 w-full text-base md:h-10 md:text-sm"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                  placeholder="e.g. Solar, HVAC"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink-secondary">URL slug *</label>
                <input
                  className="input-base h-11 w-full font-mono text-base md:h-10 md:text-sm"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  required
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  placeholder="acme-roofing"
                />
                <p className="mt-1 text-xs text-ink-tertiary">Used in public URLs: /p/{slug || "your-slug"} …</p>
              </div>
              {error ? <p className="text-sm text-[var(--status-lost-fg)]">{error}</p> : null}
            </div>
          </div>
          <div className="safe-bottom mt-auto flex justify-end gap-2 border-t border-border p-4 md:px-6 md:pb-6">
            <button type="button" className="btn-ghost h-11 flex-1 md:h-9 md:flex-none" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary h-11 flex-1 md:h-9 md:flex-none" disabled={submitting}>
              {submitting ? "Creating…" : "Create client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
