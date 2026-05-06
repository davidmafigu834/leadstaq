"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, ArrowLeft, Share2, Loader2, Star, Globe } from "lucide-react";

type MediaItem = {
  id: string;
  public_url: string;
  storage_key: string;
  caption: string | null;
  display_order: number;
};

type Project = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  completion_date: string | null;
  description: string | null;
  is_featured: boolean;
  is_public: boolean;
  slug: string;
  display_order: number;
  project_media: MediaItem[];
};

const CATEGORIES = ["Construction", "Solar", "Renovation", "Fencing", "Electrical", "Plumbing", "Landscaping", "Other"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function ProjectDetail({ clientId, project: initialProject }: { clientId: string; project: Project }) {
  const router = useRouter();
  const [project, setProject] = useState<Project>(initialProject);
  const [media, setMedia] = useState<MediaItem[]>(
    [...initialProject.project_media].sort((a, b) => a.display_order - b.display_order)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: initialProject.title,
    category: initialProject.category ?? "",
    location: initialProject.location ?? "",
    completion_date: initialProject.completion_date ?? "",
    description: initialProject.description ?? "",
    is_featured: initialProject.is_featured,
    is_public: initialProject.is_public,
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      alert(`${oversized.length} file(s) exceed 20 MB. Please compress them before uploading.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const total = files.length;
    let done = 0;

    for (const file of files) {
      try {
        const presignRes = await fetch("/api/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            clientId,
            projectId: project.id,
            purpose: "media",
          }),
        });
        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, key, publicUrl } = await presignRes.json() as { uploadUrl: string; key: string; publicUrl: string };

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");

        const mediaRes = await fetch(`/api/clients/${clientId}/projects/${project.id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storage_key: key, public_url: publicUrl, file_size_bytes: file.size }),
        });
        if (mediaRes.ok) {
          const newMedia = await mediaRes.json() as MediaItem;
          setMedia((m) => [...m, newMedia]);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
      done++;
      setUploadProgress(Math.round((done / total) * 100));
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteMedia(item: MediaItem) {
    if (!confirm("Delete this photo?")) return;
    await fetch(`/api/clients/${clientId}/projects/${project.id}/media/${item.id}`, { method: "DELETE" });
    setMedia((m) => m.filter((x) => x.id !== item.id));
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json() as Project;
      setProject((p) => ({ ...p, ...updated }));
      setEditing(false);
    }
    setSaving(false);
  }

  function handleShare() {
    const url = `${window.location.origin}/share/projects/${project.slug}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-4xl">
      <button
        type="button"
        onClick={() => router.push(`/dashboard/clients/${clientId}/projects`)}
        className="mb-6 flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> All Projects
      </button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          {!editing ? (
            <>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl tracking-display text-ink-primary">{project.title}</h2>
                {project.is_featured && (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-ink)]">
                    <Star className="h-2.5 w-2.5 fill-current" /> Featured
                  </span>
                )}
                {!project.is_public && (
                  <span className="rounded-full bg-surface-card-alt px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">
                    Private
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
                {project.category && <span>{project.category}</span>}
                {project.location && <span>{project.location}</span>}
                {project.completion_date && (
                  <span>{new Date(project.completion_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                )}
              </div>
              {project.description && (
                <p className="mt-2 max-w-lg text-sm text-ink-secondary">{project.description}</p>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveEdit} className="w-full max-w-lg space-y-4">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="rounded-lg border border-border bg-surface-card px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">Category…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Location"
                  className="rounded-lg border border-border bg-surface-card px-3 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <input
                type="date"
                value={editForm.completion_date}
                onChange={(e) => setEditForm((f) => ({ ...f, completion_date: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description…"
                className="w-full resize-none rounded-lg border border-border bg-surface-card px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-primary">
                  <input type="checkbox" checked={editForm.is_featured} onChange={(e) => setEditForm((f) => ({ ...f, is_featured: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
                  Featured
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-primary">
                  <input type="checkbox" checked={editForm.is_public} onChange={(e) => setEditForm((f) => ({ ...f, is_public: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
                  Public
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-60">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-ink-secondary hover:text-ink-primary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn-ghost px-3 py-1.5 text-sm">
              Edit details
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-surface-card-alt"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.5} />
            {copied ? "Copied!" : "Share"}
          </button>
          <a
            href={`/share/projects/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-surface-card-alt"
          >
            <Globe className="h-4 w-4" strokeWidth={1.5} /> Preview
          </a>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-tertiary">
          Photos — {media.length}
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                Uploading {uploadProgress}%…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" strokeWidth={1.5} /> Upload Photos
              </>
            )}
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <div
          className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border transition-colors hover:border-[var(--accent)] hover:bg-surface-card"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-ink-tertiary" strokeWidth={1.25} />
          <div className="text-center">
            <p className="font-medium text-ink-primary">Drop photos here or click to upload</p>
            <p className="mt-1 text-xs text-ink-tertiary">JPEG, PNG, WEBP, HEIC · Max 20 MB each</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item, idx) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg bg-surface-card-alt">
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.public_url} alt={item.caption ?? `Photo ${idx + 1}`} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => handleDeleteMedia(item)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              {item.caption && (
                <p className="px-2 py-1.5 text-xs text-ink-secondary">{item.caption}</p>
              )}
            </div>
          ))}
          <div
            className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-[var(--accent)] hover:bg-surface-card"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-ink-tertiary" strokeWidth={1.25} />
          </div>
        </div>
      )}
    </div>
  );
}
