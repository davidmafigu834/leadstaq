"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Camera, Plus, ArrowRight, Folder } from "lucide-react";
import { NewProjectSlideOver } from "./projects/NewProjectSlideOver";
import { SectionCard } from "@/app/cloud/components/SectionCard";
import { getProjectCardStyles } from "@/app/cloud/components/ProjectCard";

type MediaItem = { public_url: string; display_order: number };
type Project = {
  id: string;
  title: string;
  category: string | null;
  updated_at: string;
  project_media: MediaItem[];
};
type Stats = { total_projects: number; total_photos: number; total_bytes: number };

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatBytesGB(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function CloudDashboardHome() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const fetchProjects = useCallback(() => {
    if (!session?.clientId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/clients/${session.clientId}/projects`).then((r) => r.json()),
      fetch(`/api/cloud/stats`).then((r) => r.json()),
    ])
      .then(([projectData, statsData]: [unknown, unknown]) => {
        if (Array.isArray(projectData)) setProjects(projectData as Project[]);
        if (statsData && typeof statsData === "object" && "total_projects" in (statsData as object)) {
          setStats(statsData as Stats);
        }
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
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F5F5F0]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-[#0a0a0a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-cloud-body">
      <div className="max-w-[680px] mx-auto px-5 pt-4">

        {/* Storage summary card — always dark, always first */}
        {stats && (
          <>
            <p className="text-[10px] font-bold tracking-[0.08em] text-[#999990] uppercase mb-3 font-cloud-body">Overview</p>
            <SectionCard variant="storage" className="mb-1 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-cloud-display text-[28px] text-white leading-none">{formatBytesGB(stats.total_bytes)}</p>
                  <p className="text-[12px] text-white/50 mt-1 font-cloud-body">storage used</p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60 font-cloud-body">Free plan</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 mb-4 overflow-hidden">
                <div className="h-full rounded-full bg-[#D4FF4F]" style={{ width: `${Math.min(100, (stats.total_bytes / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1)}%` }} />
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
                {([
                  { label: "Projects", value: stats.total_projects.toString() },
                  { label: "Photos", value: stats.total_photos.toLocaleString() },
                  { label: "of 5 GB used", value: formatBytes(stats.total_bytes) },
                ] as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5 px-3 first:pl-0 last:pr-0">
                    <span className="text-[11px] text-white/40 font-cloud-body">{label}</span>
                    <span className="text-[15px] font-semibold tabular-nums text-white font-cloud-body">{value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {projects.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center py-10">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-black/[0.07]" style={{ boxShadow: 'var(--cloud-shadow-card)' }}>
              <Camera className="h-6 w-6 text-[#999990]" strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 font-cloud-display text-[22px] text-[#0a0a0a]">Add your first project</h2>
            <p className="mb-6 max-w-xs text-[14px] text-[#999990] font-cloud-body">
              Create a project for a job you&apos;re working on, then upload photos straight from your phone.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 rounded-xl bg-[#D4FF4F] px-5 py-3 text-[14px] font-bold text-black hover:bg-[#C8F244] transition-colors font-cloud-body"
            >
              <Plus className="h-4 w-4" />
              Create a project
            </button>
          </div>
        ) : (
          <>
            {/* Recent projects — horizontal scroll on mobile */}
            <p className="text-[10px] font-bold tracking-[0.08em] text-[#999990] uppercase mb-3 mt-5 font-cloud-body">Recent projects</p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
              {recent.map((p) => {
                const styles = getProjectCardStyles(p.category);
                return (
                  <Link
                    key={p.id}
                    href={`/cloud/dashboard/projects/${p.id}`}
                    className={`flex-shrink-0 w-[160px] rounded-[20px] border overflow-hidden active:scale-[0.99] transition-transform ${styles.gradient} ${styles.border}`}
                  >
                    {p.category && (
                      <div className="px-3 pt-3 pb-1">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold font-cloud-body ${styles.badge}`}>
                          {p.category}
                        </span>
                      </div>
                    )}
                    <div className="mx-3 my-2 rounded-xl overflow-hidden bg-black/10" style={{ height: 100 }}>
                      {cover(p) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={cover(p)!} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Folder className="h-7 w-7 opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="px-3 pb-3">
                      <p className={`font-cloud-display text-[14px] leading-tight truncate ${styles.text}`}>{p.title}</p>
                      <p className={`text-[11px] mt-0.5 font-cloud-body ${styles.subtext}`}>{p.project_media?.length ?? 0} photos</p>
                    </div>
                  </Link>
                );
              })}
              {/* New project card */}
              <button
                onClick={() => setShowNew(true)}
                className="flex-shrink-0 w-[160px] rounded-[20px] border-2 border-dashed border-[#D8D8D0] bg-[#EEEEE8] flex flex-col items-center justify-center gap-2 active:scale-[0.99] transition-transform"
                style={{ minHeight: 180 }}
              >
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: 'var(--cloud-shadow-card)' }}>
                  <Plus className="w-4 h-4 text-[#999990]" />
                </div>
                <span className="text-[12px] text-[#999990] font-cloud-body">New project</span>
              </button>
            </div>

            {/* View all link */}
            <div className="flex justify-end mt-2 mb-1">
              <Link href="/cloud/dashboard/projects" className="flex items-center gap-1 text-[12px] text-[#999990] hover:text-[#0a0a0a] transition-colors font-cloud-body">
                View all projects <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Team + Activity row */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <SectionCard variant="team" className="p-4">
                <p className="text-[10px] font-bold tracking-[0.08em] text-[#BF7020] uppercase mb-3 font-cloud-body">Team</p>
                <p className="font-cloud-display text-[24px] text-[#7A3800] leading-none">—</p>
                <p className="text-[12px] text-[#BF7020] mt-1 font-cloud-body">members</p>
                <Link href="/cloud/dashboard/team" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A3800] font-cloud-body">
                  Manage <ArrowRight className="w-3 h-3" />
                </Link>
              </SectionCard>

              <SectionCard variant="activity" className="p-4">
                <p className="text-[10px] font-bold tracking-[0.08em] text-[#7B5EA7] uppercase mb-3 font-cloud-body">Activity</p>
                <p className="font-cloud-display text-[24px] text-[#2D1B6B] leading-none">{stats?.total_photos?.toLocaleString() ?? "—"}</p>
                <p className="text-[12px] text-[#7B5EA7] mt-1 font-cloud-body">photos total</p>
                <Link href="/cloud/dashboard/notifications" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D1B6B] font-cloud-body">
                  Notifications <ArrowRight className="w-3 h-3" />
                </Link>
              </SectionCard>
            </div>

            {/* Upload shortcut */}
            <p className="text-[10px] font-bold tracking-[0.08em] text-[#999990] uppercase mb-3 mt-5 font-cloud-body">Quick upload</p>
            <SectionCard variant="upload" className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white" style={{ boxShadow: 'var(--cloud-shadow-elevated)' }}>
                  <Camera className="h-5 w-5 text-[#00875A]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cloud-display text-[16px] text-[#004D30]">Upload site photos</p>
                  <p className="text-[12px] text-[#00875A] font-cloud-body">Add to an existing project</p>
                </div>
                <Link
                  href="/cloud/dashboard/upload"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 rounded-xl bg-[#D4FF4F] px-4 py-2 text-[12px] font-bold text-[#0a0a0a] hover:bg-[#C8F244] transition-colors font-cloud-body"
                >
                  Upload
                </Link>
              </div>
            </SectionCard>

            <div className="h-6" />
          </>
        )}
      </div>

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
