"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Camera, Plus, ArrowRight, Upload, Folder } from "lucide-react";
import { NewProjectSlideOver } from "./projects/NewProjectSlideOver";

type MediaItem = { public_url: string; display_order: number };
type Project = {
  id: string;
  title: string;
  category: string | null;
  updated_at: string;
  project_media: MediaItem[];
};

export default function CloudDashboardHome() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const recent = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  function cover(p: Project): string | null {
    const sorted = [...(p.project_media ?? [])].sort(
      (a, b) => a.display_order - b.display_order
    );
    return sorted[0]?.public_url ?? null;
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
      {projects.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Camera className="h-8 w-8 text-[#D4FF4F]" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Add your first project</h2>
          <p className="mb-8 max-w-xs text-sm text-white/50">
            Start by creating a project for a job you&apos;re working on. Then upload photos
            straight from your phone.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-xl bg-[#D4FF4F] px-6 py-3 text-sm font-semibold text-black hover:bg-[#c4ef3f] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create a project
          </button>
        </div>
      ) : (
        <>
          {/* Recent projects */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recent projects</h2>
              <Link
                href="/cloud/dashboard/projects"
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  href={`/cloud/dashboard/projects/${p.id}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5"
                >
                  {cover(p) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cover(p)!}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Folder className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {p.category && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                      {p.category}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="truncate text-xs font-semibold text-white">{p.title}</p>
                    <p className="text-[10px] text-white/50">
                      {p.project_media?.length ?? 0} photos
                    </p>
                  </div>
                </Link>
              ))}

              {/* New project card */}
              <button
                onClick={() => setShowNew(true)}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-transparent text-white/30 transition-colors hover:border-[#D4FF4F] hover:text-[#D4FF4F]"
              >
                <Plus className="h-6 w-6" />
                <span className="text-xs">New project</span>
              </button>
            </div>
          </div>

          {/* Quick upload shortcut */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111111] px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#D4FF4F]">
                <Camera className="h-5 w-5 text-black" />
              </div>
              <p className="text-sm text-white/60">Upload photos to an existing project</p>
            </div>
            <Link
              href="/cloud/dashboard/upload"
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Link>
          </div>
        </>
      )}

      {session?.clientId && (
        <NewProjectSlideOver
          clientId={session.clientId}
          open={showNew}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
