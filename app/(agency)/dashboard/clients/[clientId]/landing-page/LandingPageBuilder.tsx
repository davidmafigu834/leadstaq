"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import {
  ChevronRight,
  ExternalLink,
  LayoutTemplate,
  Loader2,
  Monitor,
  MoreHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorPanel } from "@/lib/landing-types";
import { pathToEditorTarget } from "@/lib/editablePaths";
import { isLandingMeaningfullyEmpty } from "@/lib/landing-empty";
import { formStateToApiBody, rowToFormState } from "@/lib/landing-normalize";
import type { BuilderToPreviewMessage } from "@/types/previewProtocol";
import { LandingBuilderProvider, useLandingBuilder, useLandingDirty } from "./LandingBuilderContext";
import { PreviewBridgeProvider, type PreviewBridge } from "./PreviewBridgeContext";
import { usePreviewSync } from "./hooks/usePreviewSync";
import { UnsavedChangesBar } from "./components/UnsavedChangesBar";
import { GlobalSettingsPanel } from "./panels/GlobalSettingsPanel";
import { PreviewPanel, type PreviewDevice } from "./panels/PreviewPanel";
import { SectionsSidebar } from "./panels/SectionsSidebar";
import { AboutEditor } from "./sections/AboutEditor";
import { FooterEditor } from "./sections/FooterEditor";
import { HeroEditor } from "./sections/HeroEditor";
import { ProjectsEditor } from "./sections/ProjectsEditor";
import { ServicesEditor } from "./sections/ServicesEditor";
import { TestimonialsEditor } from "./sections/TestimonialsEditor";
import { LockedTemplateEditor } from "./LockedTemplateEditor";

const SECTION_LABEL: Record<EditorPanel, string> = {
  hero: "Hero",
  about: "About",
  services: "Services",
  projects: "Projects",
  testimonials: "Testimonials",
  footer: "Footer",
  "global-settings": "Global settings",
};

function displayPublicLandingUrl(slug: string, customDomain: string): string {
  const envHost =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_APP_DOMAIN?.replace(/^https?:\/\//i, "").replace(/\/$/, "")) ||
    "leadstaq.com";
  const trimmed = customDomain?.trim() ?? "";
  if (trimmed) {
    const host = trimmed.replace(/^https?:\/\//i, "").split("/")[0]?.replace(/\/$/, "") ?? trimmed;
    return `${host}/p/${slug}`;
  }
  return `${envHost}/p/${slug}`;
}

function useViewportMinWidth(min: number) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const sync = () => setOk(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [min]);
  return ok;
}

function useBuilderToolbarCollapse() {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= 1380) setLevel(0);
      else if (w >= 1280) setLevel(1);
      else if (w >= 1180) setLevel(2);
      else setLevel(3);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return level;
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
}

function BuilderOverflowMenu({
  open,
  onClose,
  collapseLevel,
  clientId,
  slug,
  published,
  saving,
  onUnpublish,
}: {
  open: boolean;
  onClose: () => void;
  collapseLevel: number;
  clientId: string;
  slug: string;
  published: boolean;
  saving: boolean;
  onUnpublish: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  const showUnpublish = collapseLevel >= 1 && published;
  const showBrowse = collapseLevel >= 2;
  const showPreview = collapseLevel >= 3;
  if (!showUnpublish && !showBrowse && !showPreview) return null;

  return (
    <div ref={wrapRef} className="absolute right-0 top-full z-[220] mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg">
      {showPreview ? (
        <a
          href={`/p/${slug}/preview`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center gap-2 px-3 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)]"
          onClick={onClose}
        >
          <ExternalLink className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Preview ↗
        </a>
      ) : null}
      {showBrowse ? (
        <Link
          href={`/dashboard/templates?applyTo=${encodeURIComponent(clientId)}`}
          className="flex h-9 items-center gap-2 px-3 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-card-alt)]"
          onClick={onClose}
        >
          <LayoutTemplate className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          Browse templates
        </Link>
      ) : null}
      {showUnpublish ? (
        <button
          type="button"
          disabled={saving}
          className="flex h-9 w-full items-center gap-2 px-3 text-left text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--surface-card-alt)] disabled:opacity-40"
          onClick={() => {
            onClose();
            void onUnpublish();
          }}
        >
          Unpublish
        </button>
      ) : null}
    </div>
  );
}

function BuilderWorkspace({
  clientId,
  slug,
  clientName,
  templateCount,
}: {
  clientId: string;
  slug: string;
  clientName: string;
  templateCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, markSaved, patchFn, resetToSaved } = useLandingBuilder();
  const dirty = useLandingDirty();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [active, setActive] = useState<EditorPanel>("hero");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeRev, setIframeRev] = useState(0);
  const [expandServiceId, setExpandServiceId] = useState<string | null>(null);
  const [expandProjectId, setExpandProjectId] = useState<string | null>(null);
  const [expandTestimonialId, setExpandTestimonialId] = useState<string | null>(null);
  const [expandStatId, setExpandStatId] = useState<string | null>(null);
  const sendToPreviewRef = useRef<(msg: BuilderToPreviewMessage) => void>(() => {});
  const fieldDebounceRef = useRef<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const viewportOk = useViewportMinWidth(1100);
  const toolbarCollapse = useBuilderToolbarCollapse();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [toolbarCollapse]);

  const onPreviewReady = useCallback(() => {
    sendToPreviewRef.current({ type: "FULL_STATE_SYNC", state: formStateToApiBody(stateRef.current, {}) });
  }, []);

  const onElementClicked = useCallback((path: string) => {
    sendToPreviewRef.current({ type: "FIELD_FOCUSED", path });
    const t = pathToEditorTarget(path);
    if (t.panel === "hero") setActive("hero");
    else if (t.panel === "about") setActive("about");
    else if (t.panel === "services") setActive("services");
    else if (t.panel === "projects") setActive("projects");
    else if (t.panel === "testimonials") setActive("testimonials");
    else if (t.panel === "footer") setActive("footer");

    const s = stateRef.current;
    if (t.serviceIndex != null && s.services[t.serviceIndex]) setExpandServiceId(s.services[t.serviceIndex]!._id);
    if (t.projectIndex != null && s.projects[t.projectIndex]) setExpandProjectId(s.projects[t.projectIndex]!._id);
    if (t.testimonialIndex != null && s.testimonials[t.testimonialIndex])
      setExpandTestimonialId(s.testimonials[t.testimonialIndex]!._id);
    if (t.statIndex != null && s.about_stats[t.statIndex]) setExpandStatId(s.about_stats[t.statIndex]!._id);

    window.setTimeout(() => {
      const esc = typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(path) : path.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const el = document.querySelector(`[data-editable-path="${esc}"]`) as HTMLElement | null;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[var(--accent)]", "ring-offset-2");
        window.setTimeout(() => el.classList.remove("ring-2", "ring-[var(--accent)]", "ring-offset-2"), 1000);
      }
    }, 160);
  }, []);

  const { sendToPreview, markNotReady } = usePreviewSync({
    iframeRef,
    onElementClicked,
    onElementHovered: () => {},
    onPreviewReady,
  });

  sendToPreviewRef.current = sendToPreview;

  const bumpPreviewHard = useCallback(() => {
    markNotReady();
    setIframeRev((n) => n + 1);
  }, [markNotReady]);

  const previewBridge = useMemo<PreviewBridge>(() => {
    const immediatePath = (path: string) =>
      /\.(icon|rating|image)$/.test(path) || path === "hero.text_color" || path === "hero.overlay_opacity";

    return {
      emitFocus: (path) => sendToPreview({ type: "FIELD_FOCUSED", path }),
      emitBlur: (path) => sendToPreview({ type: "FIELD_BLURRED", path }),
      emitField: (path, value, immediate) => {
        if (immediate || immediatePath(path)) {
          sendToPreview({ type: "FIELD_UPDATED", path, value });
          return;
        }
        const prev = fieldDebounceRef.current[path];
        if (prev) window.clearTimeout(prev);
        fieldDebounceRef.current[path] = window.setTimeout(() => {
          sendToPreview({ type: "FIELD_UPDATED", path, value });
          delete fieldDebounceRef.current[path];
        }, 150);
      },
    };
  }, [sendToPreview]);

  useEffect(() => {
    const body = formStateToApiBody(state, {});
    const t = window.setTimeout(() => {
      sendToPreview({ type: "FULL_STATE_SYNC", state: body });
    }, 150);
    return () => window.clearTimeout(t);
  }, [state, sendToPreview]);

  useEffect(() => {
    markNotReady();
  }, [device, markNotReady]);

  const saveSeq = useRef(0);
  const [revertToast, setRevertToast] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [storageDismissed, setStorageDismissed] = useState(false);

  const templateApplied = searchParams.get("templateApplied");
  const templateName = searchParams.get("templateName");
  const appliedAt = Number(searchParams.get("appliedAt") ?? "0");
  const dismissKey = appliedAt ? `lp_tpl_banner_${clientId}_${appliedAt}` : "";

  useEffect(() => {
    if (!dismissKey) return;
    try {
      if (sessionStorage.getItem(dismissKey)) setStorageDismissed(true);
    } catch {
      /* ignore */
    }
  }, [dismissKey]);

  const withinWindow = appliedAt > 0 && Date.now() - appliedAt < 5 * 60 * 1000;
  const showTemplateBanner =
    Boolean(templateApplied) &&
    Boolean(templateName) &&
    withinWindow &&
    !bannerDismissed &&
    !storageDismissed;

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      if (dismissKey) sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
    router.replace(`/dashboard/clients/${clientId}/landing-page`, { scroll: false });
  }, [router, clientId, dismissKey]);

  const onRevertTemplate = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/landing/revert-template`, { method: "POST" });
    if (!res.ok) {
      setRevertToast("Could not revert.");
      return;
    }
    setRevertToast("Reverted to previous content.");
    dismissBanner();
    router.refresh();
  }, [clientId, dismissBanner, router]);

  useEffect(() => {
    if (!revertToast) return;
    const t = window.setTimeout(() => setRevertToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [revertToast]);

  useEffect(() => {
    if (!templateApplied || !templateName || !appliedAt) return;
    if (Date.now() - appliedAt >= 5 * 60 * 1000) {
      dismissBanner();
      return;
    }
    const left = 5 * 60 * 1000 - (Date.now() - appliedAt);
    const t = window.setTimeout(() => dismissBanner(), left);
    return () => window.clearTimeout(t);
  }, [templateApplied, templateName, appliedAt, dismissBanner]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const saveInternal = useCallback(
    async (showFlash: boolean) => {
      const seq = ++saveSeq.current;
      setSaving(true);
      try {
        const body = formStateToApiBody(stateRef.current, {});
        const res = await fetch(`/api/clients/${clientId}/landing`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("save failed");
        if (seq !== saveSeq.current) return;
        const data = (await res.json()) as { landing?: Record<string, unknown> };
        if (data.landing) markSaved(rowToFormState(data.landing));
        if (showFlash) {
          setSavedFlash(true);
          window.setTimeout(() => setSavedFlash(false), 2000);
        }
        sendToPreview({ type: "FULL_STATE_SYNC", state: formStateToApiBody(stateRef.current, {}) });
      } finally {
        if (seq === saveSeq.current) setSaving(false);
      }
    },
    [clientId, markSaved, sendToPreview]
  );

  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => {
      void saveInternal(false);
    }, 3000);
    return () => window.clearTimeout(t);
  }, [state, dirty, saveInternal]);

  const onSaveClick = useCallback(() => {
    void saveInternal(true);
  }, [saveInternal]);

  const onPublish = useCallback(async () => {
    const seq = ++saveSeq.current;
    setSaving(true);
    try {
      const body = formStateToApiBody(stateRef.current, { published: true });
      const res = await fetch(`/api/clients/${clientId}/landing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("publish failed");
      if (seq !== saveSeq.current) return;
      const data = (await res.json()) as { landing?: Record<string, unknown> };
      if (data.landing) markSaved(rowToFormState(data.landing));
      bumpPreviewHard();
    } finally {
      if (seq === saveSeq.current) setSaving(false);
    }
  }, [clientId, markSaved, bumpPreviewHard]);

  const onUnpublish = useCallback(async () => {
    const seq = ++saveSeq.current;
    setSaving(true);
    try {
      const body = formStateToApiBody(stateRef.current, { published: false });
      const res = await fetch(`/api/clients/${clientId}/landing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("unpublish failed");
      if (seq !== saveSeq.current) return;
      const data = (await res.json()) as { landing?: Record<string, unknown> };
      if (data.landing) markSaved(rowToFormState(data.landing));
      sendToPreview({ type: "FULL_STATE_SYNC", state: formStateToApiBody(stateRef.current, {}) });
    } finally {
      if (seq === saveSeq.current) setSaving(false);
    }
  }, [clientId, markSaved, sendToPreview]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source } = result;
      if (!destination || source.droppableId !== destination.droppableId) return;
      if (source.index === destination.index) return;
      const id = source.droppableId;
      patchFn((draft) => {
        if (id === "section-order") {
          const nextOrder = reorder(draft.section_order, source.index, destination.index);
          sendToPreviewRef.current({ type: "SECTION_REORDER", order: nextOrder });
          return { section_order: nextOrder };
        }
        if (id === "about-stats") {
          return { about_stats: reorder(draft.about_stats, source.index, destination.index) };
        }
        if (id === "services") {
          return { services: reorder(draft.services, source.index, destination.index) };
        }
        if (id === "projects") {
          return { projects: reorder(draft.projects, source.index, destination.index) };
        }
        if (id === "testimonials") {
          return { testimonials: reorder(draft.testimonials, source.index, destination.index) };
        }
        return {};
      });
    },
    [patchFn]
  );

  const exitHref = `/dashboard/clients/${clientId}`;
  const handleExit = useCallback(() => {
    if (dirty && !window.confirm("Unsaved changes — leave anyway?")) return;
    router.push(exitHref);
  }, [dirty, router, exitHref]);

  const displayUrl = useMemo(
    () => displayPublicLandingUrl(slug, state.custom_domain),
    [slug, state.custom_domain]
  );

  const showPreviewBtn = toolbarCollapse < 3;
  const showBrowseBtn = toolbarCollapse < 2;
  const showUnpublishBtn = toolbarCollapse < 1 && state.published;
  const showMoreButton = (toolbarCollapse >= 1 && state.published) || toolbarCollapse >= 2;

  const appliedTemplateDisplayName = templateName ? decodeURIComponent(templateName) : "";

  const deviceTabs = (
    <div className="inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--surface-card-alt)] p-0.5">
      {(["desktop", "tablet", "mobile"] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDevice(d)}
          className={`h-full rounded-full px-3 text-[13px] font-medium capitalize transition ${
            device === d
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );

  if (!viewportOk) {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[var(--surface-canvas)] p-8">
        <div className="max-w-md text-center">
          <Monitor className="mx-auto mb-4 h-10 w-10 text-[var(--text-tertiary)]" />
          <h2 className="mb-2 font-serif text-2xl text-[var(--text-primary)]">Larger screen required</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            The landing page builder needs at least 1100px of screen width. Please switch to a laptop or desktop.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <PreviewBridgeProvider value={previewBridge}>
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="relative flex h-14 shrink-0 items-center border-b border-[var(--border)] bg-white px-5">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <button
                type="button"
                title="Exit to client"
                onClick={handleExit}
                className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)] hover:text-[var(--text-primary)]"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
              <div className="h-6 w-px shrink-0 bg-[var(--border)]" aria-hidden />
              <div className="min-w-0">
                <p className="flex min-w-0 items-center gap-1 text-[12px] font-medium text-[var(--text-primary)]">
                  <span className="truncate">{clientName}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                  <span className="truncate">{SECTION_LABEL[active]}</span>
                </p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
                  Landing page editor
                </p>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="pointer-events-auto">{deviceTabs}</div>
            </div>

            <div className="relative flex min-w-0 flex-1 items-center justify-end gap-2.5">
              {state.published ? (
                <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface-sidebar)] px-3 text-[12px] font-medium text-[var(--text-on-dark)]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                  Published
                </span>
              ) : (
                <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-[var(--surface-card-alt)] px-3 text-[12px] font-medium text-[var(--text-secondary)]">
                  Draft
                </span>
              )}

              {showBrowseBtn ? (
                <Link
                  href={`/dashboard/templates?applyTo=${encodeURIComponent(clientId)}`}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-transparent px-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Browse templates
                </Link>
              ) : null}

              {showPreviewBtn ? (
                <a
                  href={`/p/${slug}/preview`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-transparent px-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
                >
                  Preview ↗
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              <button
                type="button"
                disabled={saving || (!dirty && !savedFlash)}
                onClick={() => void onSaveClick()}
                className={`inline-flex h-8 shrink-0 items-center rounded-md px-3 text-[13px] font-medium disabled:opacity-40 ${
                  dirty
                    ? "bg-[var(--surface-sidebar)] text-[var(--text-on-dark)]"
                    : "border border-[var(--border)] bg-white text-[var(--text-primary)]"
                }`}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Save
                  </span>
                ) : savedFlash ? (
                  "Saved ✓"
                ) : (
                  "Save"
                )}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void onPublish()}
                className="inline-flex h-8 shrink-0 items-center rounded-md bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--accent-ink)] disabled:opacity-50"
              >
                {state.published ? "Update" : "Publish"}
              </button>

              {showUnpublishBtn ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onUnpublish()}
                  className="inline-flex h-8 shrink-0 items-center rounded-md px-2 text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--surface-card-alt)] disabled:opacity-40"
                >
                  Unpublish
                </button>
              ) : null}

              {showMoreButton ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="More actions"
                    onClick={() => setMoreOpen((o) => !o)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <BuilderOverflowMenu
                    open={moreOpen}
                    onClose={() => setMoreOpen(false)}
                    collapseLevel={toolbarCollapse}
                    clientId={clientId}
                    slug={slug}
                    published={state.published}
                    saving={saving}
                    onUnpublish={onUnpublish}
                  />
                </div>
              ) : null}
            </div>
          </header>

          {showTemplateBanner ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--accent)] bg-[rgba(212,255,79,0.15)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span className="min-w-0">{`Template '${appliedTemplateDisplayName}' applied. Customize below, or undo.`}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" className="btn-ghost h-8 px-2 text-[13px]" onClick={() => void onRevertTemplate()}>
                  Undo
                </button>
                <button type="button" className="btn-ghost h-8 w-8 p-0" aria-label="Dismiss" onClick={() => dismissBanner()}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {revertToast ? (
            <div className="pointer-events-none fixed bottom-6 left-1/2 z-[260] -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--surface-sidebar)] px-4 py-2 text-sm text-[var(--text-on-dark)] shadow-lg">
              {revertToast}
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1">
            <SectionsSidebar active={active} onSelect={setActive} />
            <main className="w-[420px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-card)]">
              {isLandingMeaningfullyEmpty(state) && templateCount > 0 ? (
                <div className="border-b border-dashed border-[var(--accent)] bg-[rgba(212,255,79,0.06)] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <LayoutTemplate className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent)]" />
                      <div>
                        <p className="font-display text-xl text-[var(--text-primary)]">Start faster with a template</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Pick from {templateCount} pre-designed landing pages. Customize and publish in minutes.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/templates?applyTo=${encodeURIComponent(clientId)}`}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)]"
                    >
                      Browse templates
                    </Link>
                  </div>
                </div>
              ) : null}
              {active === "hero" ? <HeroEditor clientId={clientId} /> : null}
              {active === "about" ? (
                <AboutEditor clientId={clientId} expandStatId={expandStatId} onExpandStatConsumed={() => setExpandStatId(null)} />
              ) : null}
              {active === "services" ? (
                <ServicesEditor expandItemId={expandServiceId} onExpandConsumed={() => setExpandServiceId(null)} />
              ) : null}
              {active === "projects" ? (
                <ProjectsEditor clientId={clientId} expandItemId={expandProjectId} onExpandConsumed={() => setExpandProjectId(null)} />
              ) : null}
              {active === "testimonials" ? (
                <TestimonialsEditor clientId={clientId} expandItemId={expandTestimonialId} onExpandConsumed={() => setExpandTestimonialId(null)} />
              ) : null}
              {active === "footer" ? <FooterEditor /> : null}
              {active === "global-settings" ? (
                <GlobalSettingsPanel clientId={clientId} slug={slug} onFontChoiceChange={bumpPreviewHard} />
              ) : null}
            </main>
            <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-card-alt)]">
              <PreviewPanel
                slug={slug}
                device={device}
                displayUrl={displayUrl}
                iframeRef={iframeRef}
                iframeRev={iframeRev}
                onManualReload={bumpPreviewHard}
              />
            </section>
          </div>
        </div>
      </PreviewBridgeProvider>
      <UnsavedChangesBar visible={dirty} onDiscard={resetToSaved} onSave={() => void saveInternal(true)} saving={saving} />
    </DragDropContext>
  );
}

export function LandingPageBuilder({
  clientId,
  slug,
  clientName,
  initial,
  templateCount,
  builderKey,
  lockedTemplate,
}: {
  clientId: string;
  slug: string;
  clientName: string;
  initial: Record<string, unknown>;
  templateCount: number;
  builderKey: string;
  lockedTemplate?: Record<string, unknown> | null;
}) {
  const isLocked =
    Boolean(initial.is_locked_template) &&
    Boolean(initial.applied_template_id) &&
    Boolean(lockedTemplate && lockedTemplate.is_locked);

  if (isLocked && lockedTemplate) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex min-h-[200px] flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">Loading…</div>
          }
        >
          <LockedTemplateEditor
            key={builderKey}
            clientId={clientId}
            slug={slug}
            clientName={clientName}
            initialLanding={initial}
            template={lockedTemplate}
          />
        </Suspense>
      </div>
    );
  }

  const form = rowToFormState(initial);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <LandingBuilderProvider key={builderKey} initial={form}>
        <Suspense
          fallback={
            <div className="flex min-h-[200px] flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">Loading…</div>
          }
        >
          <BuilderWorkspace clientId={clientId} slug={slug} clientName={clientName} templateCount={templateCount} />
        </Suspense>
      </LandingBuilderProvider>
    </div>
  );
}
