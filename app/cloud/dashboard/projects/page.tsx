"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Folder, Star, MoreVertical, Search, Copy, Trash2, Edit2 } from "lucide-react";
import { NewProjectSlideOver } from "./NewProjectSlideOver";

type MediaItem = { public_url: string; display_order: number };
type Project = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  location: string | null;
  is_featured: boolean;
  updated_at: string;
  created_at: string;
  project_media: MediaItem[];
};

type SortKey = "newest" | "oldest" | "most_photos" | "alpha";

export default function CloudProjectsPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const fetchProjects = useCallback(() => {
    if (!session?.clientId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/clients/${session.clientId}/projects`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setProjects(data as Project[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.clientId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function cover(p: Project): string | null {
    const sorted = [...(p.project_media ?? [])].sort((a, b) => a.display_order - b.display_order);
    return sorted[0]?.public_url ?? null;
  }

  function sorted(list: Project[]): Project[] {
    return [...list].sort((a, b) => {
      if (sortKey === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortKey === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortKey === "most_photos") return (b.project_media?.length ?? 0) - (a.project_media?.length ?? 0);
      return a.title.localeCompare(b.title);
    });
  }

  const filtered = sorted(
    projects.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
  );

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  }

  async function handleDelete(p: Project) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    await fetch(`/api/clients/${session!.clientId!}/projects/${p.id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
    setMenuOpen(null);
  }

  async function handleToggleFeatured(p: Project) {
    await fetch(`/api/clients/${session!.clientId!}/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !p.is_featured }),
    });
    setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, is_featured: !x.is_featured } : x));
    setMenuOpen(null);
  }

  function copyShareLink(p: Project) {
    const url = `${window.location.origin}/cloud/share/${p.id}`;
    void navigator.clipboard.writeText(url);
    showToast("Share link copied!");
    setMenuOpen(null);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#D4FF4F]" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4FF4F]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-xs text-white outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most_photos">Most photos</option>
            <option value="alpha">Alphabetical</option>
          </select>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#D4FF4F] px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#c4ef3f]"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </button>
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Folder className="mb-4 h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">
            {search ? "No projects match your search." : "No projects yet."}
          </p>
          {!search && (
            <button
              onClick={() => setShowNew(true)}
              className="mt-4 rounded-lg bg-[#D4FF4F] px-5 py-2.5 text-sm font-semibold text-black"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((p) => (
            <div key={p.id} className="mb-4 break-inside-avoid">
              <div className="group relative overflow-hidden rounded-2xl bg-[#111111]">
                {/* Cover */}
                <Link href={`/cloud/dashboard/projects/${p.id}`}>
                  <div className="relative">
                    {cover(p) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={cover(p)!}
                        alt={p.title}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ aspectRatio: "auto" }}
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center">
                        <Folder className="h-10 w-10 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                </Link>

                {/* Featured badge */}
                {p.is_featured && (
                  <div className="absolute left-3 top-3">
                    <span className="flex items-center gap-1 rounded-full bg-[#D4FF4F]/90 px-2 py-0.5 text-[10px] font-semibold text-black backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5" />
                      Featured
                    </span>
                  </div>
                )}

                {/* Three-dot menu */}
                <div className="absolute right-2 top-2">
                  <button
                    onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                    className="rounded-lg bg-black/50 p-1.5 text-white/70 backdrop-blur-sm hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpen === p.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-white/10 bg-[#1a1a1a] py-1.5 shadow-xl">
                      <Link
                        href={`/cloud/dashboard/projects/${p.id}`}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                        onClick={() => setMenuOpen(null)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit details
                      </Link>
                      <button
                        onClick={() => copyShareLink(p)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy share link
                      </button>
                      <button
                        onClick={() => void handleToggleFeatured(p)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        <Star className="h-3.5 w-3.5" />
                        {p.is_featured ? "Unfeature" : "Set as featured"}
                      </button>
                      <hr className="my-1 border-white/10" />
                      <button
                        onClick={() => void handleDelete(p)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Info overlay */}
                <Link href={`/cloud/dashboard/projects/${p.id}`}>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-white/50">
                      {p.category && <span>{p.category}</span>}
                      {p.category && p.location && <span>·</span>}
                      {p.location && <span>{p.location}</span>}
                      <span className="ml-auto">{p.project_media?.length ?? 0} photos</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2.5 text-sm text-white backdrop-blur-md lg:bottom-8">
          {toastMsg}
        </div>
      )}

      {session?.clientId && (
        <NewProjectSlideOver
          clientId={session.clientId}
          open={showNew}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); fetchProjects(); }}
          redirectOnCreate
        />
      )}
    </div>
  );
}
