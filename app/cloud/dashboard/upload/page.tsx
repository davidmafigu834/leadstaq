"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Camera, Check, ChevronRight, Loader2, Plus, X, ArrowRight, Folder,
} from "lucide-react";
import { InstallPrompt } from "@/app/cloud/components/InstallPrompt";
import { IOSInstallBanner } from "@/app/cloud/components/IOSInstallBanner";

type Project = {
  id: string;
  title: string;
  category: string | null;
  updated_at: string;
  project_media: { id: string; public_url: string; display_order: number }[];
};

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
};

const CATEGORIES = [
  "Construction", "Solar Installation", "Landscaping", "Electrical",
  "Plumbing", "Interior Design", "Roofing", "Fencing", "Events", "Architecture", "Other",
];

export default function CloudUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [showNewSheet, setShowNewSheet] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = useCallback(() => {
    if (!session?.clientId) return;
    fetch(`/api/clients/${session.clientId}/projects`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const sorted = (data as Project[]).sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          setProjects(sorted);
        }
      })
      .catch(() => {});
  }, [session?.clientId]);

  useEffect(() => {
    fetchProjects();
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, [fetchProjects]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const items: QueueItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "pending",
    }));
    setQueue(items);
    setAllDone(false);
    e.target.value = "";
  }

  async function uploadAll() {
    if (!session?.clientId || !selectedProject || !queue.length) return;
    setUploading(true);
    let doneCount = 0;

    for (const item of queue) {
      setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, status: "uploading" } : q));
      try {
        const presignRes = await fetch("/api/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            contentType: item.file.type || "image/jpeg",
            clientId: session.clientId,
            projectId: selectedProject.id,
            purpose: "media",
          }),
        });
        if (!presignRes.ok) throw new Error("Presign failed");
        const { uploadUrl, key, publicUrl } = (await presignRes.json()) as {
          uploadUrl: string; key: string; publicUrl: string;
        };

        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": item.file.type || "image/jpeg" },
          body: item.file,
        });

        await fetch(`/api/clients/${session.clientId}/projects/${selectedProject.id}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_key: key,
            public_url: publicUrl,
            file_size_bytes: item.file.size,
          }),
        });

        doneCount++;
        setQueue((prev) =>
          prev.map((q) => q.id === item.id ? { ...q, status: "done", progress: 100 } : q)
        );
      } catch {
        setQueue((prev) =>
          prev.map((q) => q.id === item.id ? { ...q, status: "error" } : q)
        );
      }
    }

    setUploading(false);
    if (doneCount > 0) setAllDone(true);
  }

  async function handleCreateProject() {
    if (!newTitle.trim() || !session?.clientId) return;
    setCreatingProject(true);
    setCreateError("");
    try {
      const res = await fetch(`/api/clients/${session.clientId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory || null,
          location: newLocation.trim() || null,
          is_public: true,
        }),
      });
      const data = (await res.json()) as Project & { error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create project.");
        return;
      }
      setProjects((prev) => [data, ...prev]);
      setSelectedProject(data);
      setShowNewSheet(false);
      setNewTitle("");
      setNewCategory("");
      setNewLocation("");
    } catch {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreatingProject(false);
    }
  }

  function resetUpload() {
    setQueue([]);
    setAllDone(false);
  }

  const recent5 = projects.slice(0, 5);
  const pendingCount = queue.filter((q) => q.status === "pending" || q.status === "uploading").length;
  const doneFiles = queue.filter((q) => q.status === "done");

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Mobile-only top bar */}
      <div className="border-b border-white/10 px-6 py-4 lg:hidden">
        <p className="text-[13px] text-white/30">
          {session?.user?.name ?? "Leadstaq Cloud"}
        </p>
        <h1 className="text-[20px] font-semibold text-white">Upload</h1>
      </div>

      <div className="flex-1 px-6 py-6 lg:px-8">
        {allDone ? (
          /* ── All done state ── */
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4FF4F]">
              <Check className="h-8 w-8 text-black" strokeWidth={2.5} />
            </div>
            <h2 className="mb-1 text-[20px] font-semibold text-white">
              {doneFiles.length} photo{doneFiles.length !== 1 ? "s" : ""} added
            </h2>
            <p className="mb-8 text-[14px] text-white/50">
              to <span className="text-white">{selectedProject?.title}</span>
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <button
                onClick={resetUpload}
                className="w-full rounded-xl border border-white/10 py-3 text-[14px] font-medium text-white hover:bg-white/5"
              >
                Upload more
              </button>
              <button
                onClick={() => router.push(`/cloud/dashboard/projects/${selectedProject!.id}`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4FF4F] py-3 text-[14px] font-semibold text-black"
              >
                View project
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : !selectedProject ? (
          /* ── State A: no project selected ── */
          <>
            <div className="mb-4">
              <h2 className="text-[14px] font-semibold text-white">Recent projects</h2>
            </div>

            <div className="mb-4 space-y-2">
              {recent5.map((p) => {
                const cover = [...(p.project_media ?? [])]
                  .sort((a, b) => a.display_order - b.display_order)[0]?.public_url;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[#111111] px-4 py-4 text-left transition-colors hover:border-[#D4FF4F]/30 hover:bg-white/5"
                    style={{ minHeight: 72 }}
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Folder className="h-5 w-5 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] font-medium text-white">{p.title}</p>
                      <p className="text-[13px] text-white/40">
                        {p.project_media?.length ?? 0} photos
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/20" />
                  </button>
                );
              })}
            </div>

            {projects.length > 5 && (
              <button
                onClick={() => router.push("/cloud/dashboard/projects")}
                className="mb-4 w-full text-center text-[14px] text-white/40 hover:text-white transition-colors"
              >
                All projects →
              </button>
            )}

            <button
              onClick={() => setShowNewSheet(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 py-5 text-[14px] font-medium text-white/40 transition-colors hover:border-[#D4FF4F]/40 hover:text-[#D4FF4F]"
              style={{ minHeight: 72 }}
            >
              <Plus className="h-5 w-5" />
              Create new project +
            </button>
          </>
        ) : (
          /* ── State B: project selected ── */
          <>
            <div className="mb-6 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
                {selectedProject.title}
                <button
                  onClick={() => { setSelectedProject(null); setQueue([]); }}
                  className="ml-1 text-white/40 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>

            {/* Big upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {queue.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-transparent py-16 transition-colors hover:border-[#D4FF4F]/50 hover:bg-[#D4FF4F]/5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4FF4F]">
                  <Camera className="h-8 w-8 text-black" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-white">Add photos</p>
                  <p className="mt-1 text-[13px] text-white/40">Tap to open gallery</p>
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111111] px-4 py-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] text-white">{item.file.name}</p>
                      {item.status === "uploading" && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#D4FF4F] transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {item.status === "pending" && <div className="h-2 w-2 rounded-full bg-white/20" />}
                      {item.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-[#D4FF4F]" />}
                      {item.status === "done" && <Check className="h-4 w-4 text-[#D4FF4F]" />}
                      {item.status === "error" && <X className="h-4 w-4 text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {queue.length > 0 && !uploading && !allDone && (
              <button
                onClick={() => void uploadAll()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4FF4F] py-4 text-[14px] font-semibold text-black hover:bg-[#c4ef3f]"
              >
                <Camera className="h-4 w-4" />
                Upload {queue.length} photo{queue.length !== 1 ? "s" : ""}
              </button>
            )}

            {uploading && (
              <div className="mt-5 flex items-center justify-center gap-2 text-[14px] text-white/50">
                <Loader2 className="h-4 w-4 animate-spin text-[#D4FF4F]" />
                Uploading {pendingCount} remaining…
              </div>
            )}

            <p className="mt-4 text-center text-[12px] text-white/25">
              Or{" "}
              <button
                onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept="image/*"; i.capture="environment"; i.onchange=(e)=>{const f=(e.target as HTMLInputElement).files; if(f) handleFileSelect({target:{files:f,value:""}} as React.ChangeEvent<HTMLInputElement>);}; i.click(); }}
                className="text-white/40 hover:text-white"
              >
                take a new photo
              </button>
            </p>
          </>
        )}
      </div>

      {/* New project bottom sheet */}
      <div className={`fixed inset-0 z-[60] flex flex-col justify-end transition-opacity duration-300 ${showNewSheet ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewSheet(false)} />
          <div className={`relative rounded-t-3xl bg-[#111111] p-6 transform transition-transform duration-300 ease-out ${showNewSheet ? "translate-y-0" : "translate-y-full"}`} style={{ paddingBottom: "max(3rem, calc(3rem + env(safe-area-inset-bottom)))" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">New project</h3>
              <button onClick={() => setShowNewSheet(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                placeholder="Project name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4FF4F]"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4FF4F]"
              >
                <option value="">Category (optional)</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#D4FF4F]"
              />
              <button
                onClick={() => void handleCreateProject()}
                disabled={!newTitle.trim() || creatingProject}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4FF4F] py-3.5 text-[14px] font-semibold text-black disabled:opacity-60"
              >
                {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {creatingProject ? "Creating…" : "Create & upload →"}
              </button>
              {createError && (
                <p className="text-center text-[14px] text-red-400">{createError}</p>
              )}
            </div>
          </div>
      </div>
      <InstallPrompt />
      <IOSInstallBanner />
    </div>
  );
}
