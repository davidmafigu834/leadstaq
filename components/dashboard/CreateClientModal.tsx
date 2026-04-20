"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-overlay px-4 py-8">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface-card p-6 shadow-lg">
        <button
          type="button"
          className="absolute right-4 top-4 text-ink-tertiary hover:text-ink-primary"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <h2 className="pr-10 font-display text-xl text-ink-primary">New client</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          After you create the client, you will go to their overview to finish setup (landing page, form, team, and
          optional Facebook).
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-secondary">Client name *</label>
            <input
              className="input-base h-10 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-secondary">Industry *</label>
            <input
              className="input-base h-10 w-full"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              placeholder="e.g. Solar, HVAC"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-secondary">URL slug *</label>
            <input
              className="input-base h-10 w-full font-mono text-sm"
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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
