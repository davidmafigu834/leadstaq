"use client";

import { useState } from "react";
import { Plus, Star, Trash2, Pencil, Check, X } from "lucide-react";

type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  content: string;
  rating: number | null;
  photo_url: string | null;
  is_featured: boolean;
  display_order: number;
};

const EMPTY_FORM = {
  author_name: "",
  author_role: "",
  content: "",
  rating: 5 as number | null,
  photo_url: "",
  is_featured: false,
};

export function TestimonialsManager({
  clientId,
  clientName,
  initialTestimonials,
}: {
  clientId: string;
  clientName: string;
  initialTestimonials: Testimonial[];
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlideoverOpen(true);
  }

  function openEdit(t: Testimonial) {
    setEditingId(t.id);
    setForm({
      author_name: t.author_name,
      author_role: t.author_role ?? "",
      content: t.content,
      rating: t.rating,
      photo_url: t.photo_url ?? "",
      is_featured: t.is_featured,
    });
    setSlideoverOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author_name.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/clients/${clientId}/testimonials/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, rating: form.rating ?? null, author_role: form.author_role || null, photo_url: form.photo_url || null }),
        });
        if (res.ok) {
          const updated = await res.json() as Testimonial;
          setTestimonials((t) => t.map((x) => (x.id === editingId ? updated : x)));
          setSlideoverOpen(false);
        }
      } else {
        const res = await fetch(`/api/clients/${clientId}/testimonials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, rating: form.rating ?? null, author_role: form.author_role || null, photo_url: form.photo_url || null, display_order: testimonials.length }),
        });
        if (res.ok) {
          const newT = await res.json() as Testimonial;
          setTestimonials((t) => [...t, newT]);
          setSlideoverOpen(false);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/clients/${clientId}/testimonials/${id}`, { method: "DELETE" });
    setTestimonials((t) => t.filter((x) => x.id !== id));
  }

  async function handleToggleFeatured(t: Testimonial) {
    const res = await fetch(`/api/clients/${clientId}/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !t.is_featured }),
    });
    if (res.ok) {
      const updated = await res.json() as Testimonial;
      setTestimonials((list) => list.map((x) => (x.id === t.id ? updated : x)));
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-display text-ink-primary">Testimonials</h2>
          <p className="mt-1 text-sm text-ink-secondary">{clientName}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add testimonial
        </button>
      </div>

      {testimonials.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-8 py-16 text-center">
          <Star className="h-12 w-12 text-ink-tertiary" strokeWidth={1.25} />
          <div>
            <p className="text-lg font-medium text-ink-primary">No testimonials yet</p>
            <p className="mt-1 text-sm text-ink-secondary">Add client reviews to display on the profile page</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Add first testimonial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <div key={t.id} className="flex gap-4 rounded-xl border border-border bg-surface-card p-5">
              {t.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photo_url} alt={t.author_name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium text-ink-primary">{t.author_name}</span>
                  {t.author_role && <span className="text-xs text-ink-tertiary">{t.author_role}</span>}
                  {t.is_featured && (
                    <span className="flex items-center gap-0.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-ink)]">
                      <Star className="h-2.5 w-2.5 fill-current" /> Featured
                    </span>
                  )}
                </div>
                {t.rating != null && (
                  <div className="mb-2 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < (t.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                    ))}
                  </div>
                )}
                <p className="line-clamp-2 text-sm text-ink-secondary">&ldquo;{t.content}&rdquo;</p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(t)}
                  title={t.is_featured ? "Unfeature" : "Feature"}
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors ${t.is_featured ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-surface-card-alt text-ink-tertiary hover:text-ink-primary"}`}
                >
                  <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-card-alt text-ink-tertiary hover:text-ink-primary"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-card-alt text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {slideoverOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSlideoverOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface-canvas shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-lg tracking-display text-ink-primary">
                {editingId ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <button type="button" onClick={() => setSlideoverOpen(false)} className="text-ink-secondary hover:text-ink-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-primary">Author name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-primary">Role / Company</label>
                <input
                  type="text"
                  value={form.author_role}
                  onChange={(e) => setForm((f) => ({ ...f, author_role: e.target.value }))}
                  placeholder="Homeowner"
                  className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-primary">Review <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="What the client said…"
                  className="w-full resize-none rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-primary">Rating</label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`h-6 w-6 ${i < (form.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                    </button>
                  ))}
                  {form.rating != null && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, rating: null }))} className="ml-2 text-xs text-ink-tertiary hover:text-ink-primary">
                      clear
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-primary">Photo URL</label>
                <input
                  type="url"
                  value={form.photo_url}
                  onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-primary">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[var(--accent)]"
                />
                Feature on profile page
              </label>
              <div className="mt-auto pt-4">
                <button
                  type="submit"
                  disabled={saving || !form.author_name.trim() || !form.content.trim()}
                  className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-medium disabled:opacity-60"
                >
                  {saving ? "Saving…" : (
                    <><Check className="h-4 w-4" strokeWidth={2} /> {editingId ? "Save changes" : "Add testimonial"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
