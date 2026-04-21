"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { ChevronRight, ExternalLink, LayoutTemplate, Loader2, Monitor, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getByContentPath } from "@/lib/json-content-path";
import { getPublicBaseUrl } from "@/lib/constants";
import { applyLockedFieldUpdate } from "@/lib/templates/northfield/apply-field";
import { NORTHFIELD_EDITABLE_FIELDS, NORTHFIELD_EDITOR_GROUPS } from "@/lib/templates/northfield/editableFields";
import { northfieldContentSchema, northfieldThemeSchema } from "@/lib/templates/northfield/schema";
import { NORTHFIELD_DEFAULT_CONTENT, NORTHFIELD_DEFAULT_THEME } from "@/lib/templates/northfield/defaults";
import { pathToLockedEditorGroup } from "@/lib/templates/northfield/pathToGroup";
import type { EditableFieldSpec } from "@/types/editableFields";
import type { NorthfieldContent, NorthfieldTheme } from "@/types/templates/northfield";
import type { BuilderToPreviewMessage } from "@/types/previewProtocol";
import { usePreviewSync } from "./hooks/usePreviewSync";
import { PreviewPanel, type PreviewDevice } from "./panels/PreviewPanel";
import { ColorPicker } from "./components/ColorPicker";
import { ImageUpload } from "./components/ImageUpload";
import { RepeaterList } from "./components/RepeaterList";

function stripIds(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripIds);
  if (v && typeof v === "object") {
    const o = { ...(v as Record<string, unknown>) };
    delete o._id;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) out[k] = stripIds(o[k]);
    return out;
  }
  return v;
}

function withRowIds<T extends Record<string, unknown>>(arr: T[], prefix: string): (T & { _id: string })[] {
  return arr.map((x, i) => ({ ...x, _id: `${prefix}-${i}` }));
}

function reorderList<T>(list: T[], from: number, to: number): T[] {
  const n = [...list];
  const [r] = n.splice(from, 1);
  n.splice(to, 0, r!);
  return n;
}

function readField(content: NorthfieldContent, theme: NorthfieldTheme, path: string): unknown {
  if (path.startsWith("theme.")) return getByContentPath(theme as unknown as Record<string, unknown>, path.slice(6));
  return getByContentPath(content as unknown as Record<string, unknown>, path);
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

export function LockedTemplateEditor({
  clientId,
  slug,
  clientName,
  initialLanding,
  template,
}: {
  clientId: string;
  slug: string;
  clientName: string;
  initialLanding: Record<string, unknown>;
  template: Record<string, unknown>;
}) {
  const router = useRouter();
  const viewportOk = useViewportMinWidth(1100);
  const parsedC = northfieldContentSchema.safeParse(initialLanding.template_content ?? template.default_content ?? NORTHFIELD_DEFAULT_CONTENT);
  const parsedT = northfieldThemeSchema.safeParse(initialLanding.template_theme ?? template.default_theme ?? NORTHFIELD_DEFAULT_THEME);
  const [content, setContent] = useState<NorthfieldContent>(parsedC.success ? parsedC.data : NORTHFIELD_DEFAULT_CONTENT);
  const [theme, setTheme] = useState<NorthfieldTheme>(parsedT.success ? parsedT.data : NORTHFIELD_DEFAULT_THEME);
  const savedRef = useRef({ content: parsedC.success ? parsedC.data : NORTHFIELD_DEFAULT_CONTENT, theme: parsedT.success ? parsedT.data : NORTHFIELD_DEFAULT_THEME });
  const [activeGroup, setActiveGroup] = useState<string>("Brand");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeRev, setIframeRev] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const previewTimers = useRef<Record<string, number>>({});
  const bundleRef = useRef({ content, theme });
  bundleRef.current = { content, theme };

  const dirty = useMemo(
    () => JSON.stringify({ content, theme }) !== JSON.stringify(savedRef.current),
    [content, theme]
  );

  const sendToPreviewRef = useRef<(msg: BuilderToPreviewMessage) => void>(() => {});

  const schedulePreviewPush = useCallback((path: string, value: unknown) => {
    const prev = previewTimers.current[path];
    if (prev) window.clearTimeout(prev);
    previewTimers.current[path] = window.setTimeout(() => {
      sendToPreviewRef.current({ type: "FIELD_UPDATED", path, value });
      delete previewTimers.current[path];
    }, 150);
  }, []);

  const handleFieldChange = useCallback(
    (path: string, value: unknown) => {
      const { content: c, theme: th } = bundleRef.current;
      const next = applyLockedFieldUpdate(c, th, path, value);
      setContent(next.content);
      setTheme(next.theme);
      schedulePreviewPush(path, value);
    },
    [schedulePreviewPush]
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source } = result;
      if (!destination || destination.droppableId !== source.droppableId) return;
      if (source.index === destination.index) return;
      const id = source.droppableId;
      if (!id.startsWith("locked-")) return;
      const path = id.replace(/^locked-/, "");
      const { content: c, theme: th } = bundleRef.current;
      const arr = readField(c, th, path);
      if (!Array.isArray(arr)) return;
      const next = reorderList(arr, source.index, destination.index);
      handleFieldChange(path, stripIds(next));
    },
    [handleFieldChange]
  );

  const syncFullPreview = useCallback(() => {
    sendToPreviewRef.current({
      type: "FULL_STATE_SYNC",
      state: { template_content: content, template_theme: theme },
    });
  }, [content, theme]);

  const onPreviewReady = useCallback(() => {
    sendToPreviewRef.current({
      type: "FULL_STATE_SYNC",
      state: { template_content: content, template_theme: theme },
    });
  }, [content, theme]);

  const onElementClicked = useCallback((path: string) => {
    setActiveGroup(pathToLockedEditorGroup(path));
  }, []);

  const { sendToPreview, markNotReady } = usePreviewSync({
    iframeRef,
    onElementClicked,
    onElementHovered: () => {},
    onPreviewReady,
  });
  sendToPreviewRef.current = sendToPreview;

  useEffect(() => {
    const t = window.setTimeout(() => syncFullPreview(), 400);
    return () => window.clearTimeout(t);
    // initial iframe sync only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    markNotReady();
  }, [device, markNotReady]);

  const bumpPreviewHard = useCallback(() => {
    markNotReady();
    setIframeRev((n) => n + 1);
  }, [markNotReady]);

  const saveInternal = useCallback(
    async (showFlash: boolean) => {
      setSaving(true);
      try {
        const body = {
          template_content: stripIds(content) as NorthfieldContent,
          template_theme: theme,
          published: initialLanding.published as boolean | undefined,
        };
        const c = northfieldContentSchema.safeParse(body.template_content);
        const t = northfieldThemeSchema.safeParse(body.template_theme);
        if (!c.success || !t.success) throw new Error("invalid");
        const res = await fetch(`/api/clients/${clientId}/landing`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_content: c.data, template_theme: t.data }),
        });
        if (!res.ok) throw new Error("save failed");
        const data = (await res.json()) as { landing?: Record<string, unknown> };
        if (data.landing?.template_content) {
          const nc = northfieldContentSchema.safeParse(data.landing.template_content);
          const nt = northfieldThemeSchema.safeParse(data.landing.template_theme);
          if (nc.success && nt.success) {
            setContent(nc.data);
            setTheme(nt.data);
            savedRef.current = { content: nc.data, theme: nt.data };
          }
        }
        if (showFlash) {
          setSavedFlash(true);
          window.setTimeout(() => setSavedFlash(false), 2000);
        }
        syncFullPreview();
      } finally {
        setSaving(false);
      }
    },
    [clientId, content, theme, initialLanding.published, syncFullPreview]
  );

  const onPublish = useCallback(async () => {
    setSaving(true);
    try {
      const c = northfieldContentSchema.safeParse(stripIds(content));
      const t = northfieldThemeSchema.safeParse(theme);
      if (!c.success || !t.success) throw new Error("invalid");
      const res = await fetch(`/api/clients/${clientId}/landing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_content: c.data, template_theme: t.data, published: true }),
      });
      if (!res.ok) throw new Error("publish failed");
      bumpPreviewHard();
      const data = (await res.json()) as { landing?: Record<string, unknown> };
      if (data.landing?.template_content) {
        const nc = northfieldContentSchema.safeParse(data.landing.template_content);
        const nt = northfieldThemeSchema.safeParse(data.landing.template_theme);
        if (nc.success && nt.success) {
          setContent(nc.data);
          setTheme(nt.data);
          savedRef.current = { content: nc.data, theme: nt.data };
        }
      }
    } finally {
      setSaving(false);
    }
  }, [clientId, content, theme, bumpPreviewHard]);

  const fieldsInGroup = useMemo(
    () => NORTHFIELD_EDITABLE_FIELDS.filter((f) => f.group === activeGroup),
    [activeGroup]
  );

  const displayUrl = useMemo(() => {
    const envHost = getPublicBaseUrl().replace(/^https?:\/\//i, "").replace(/\/$/, "");
    const cd = String(initialLanding.custom_domain ?? "").trim();
    if (cd) {
      const host = cd.replace(/^https?:\/\//i, "").split("/")[0]?.replace(/\/$/, "") ?? cd;
      return `${host}/p/${slug}`;
    }
    return `${envHost}/p/${slug}`;
  }, [slug, initialLanding.custom_domain]);

  const handleExit = () => {
    if (dirty && !window.confirm("Unsaved changes — leave anyway?")) return;
    router.push(`/dashboard/clients/${clientId}`);
  };

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

  const tplName = (template.name as string) || "Template";
  const tplIndustry = (template.industry as string) || "";
  const tplStyle = (template.style as string) || "";

  return (
    <DragDropContext onDragEnd={onDragEnd}>
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="relative flex h-14 shrink-0 items-center border-b border-[var(--border)] bg-white px-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            title="Exit to client"
            onClick={handleExit}
            className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
          <div className="h-6 w-px shrink-0 bg-[var(--border)]" />
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-1 text-[12px] font-medium text-[var(--text-primary)]">
              <span className="truncate">{clientName}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
              <span className="truncate">Locked template</span>
            </p>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Landing page editor</p>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <div className="pointer-events-auto inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--surface-card-alt)] p-0.5">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`h-full rounded-full px-3 text-[13px] font-medium capitalize ${
                  device === d ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-[var(--surface-card-alt)] px-3 text-[12px] font-medium text-[var(--text-secondary)]">
            Locked
          </span>
          <Link
            href={`/dashboard/templates?applyTo=${encodeURIComponent(clientId)}&replace=true`}
            className="hidden text-[12px] font-medium text-[var(--accent)] sm:inline"
          >
            Change template →
          </Link>
          <a
            href={`/p/${slug}/preview`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
          >
            Preview <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => void saveInternal(true)}
            className={`inline-flex h-8 items-center rounded-md px-3 text-[12px] font-medium disabled:opacity-40 ${
              dirty ? "bg-[var(--surface-sidebar)] text-[var(--text-on-dark)]" : "border border-[var(--border)]"
            }`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedFlash ? "Saved ✓" : "Save"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onPublish()}
            className="inline-flex h-8 items-center rounded-md bg-[var(--accent)] px-3 text-[12px] font-semibold text-[var(--accent-ink)]"
          >
            {initialLanding.published ? "Update" : "Publish"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-card)]">
          <div className="border-b border-[var(--border)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Template</p>
            <p className="font-display text-lg text-[var(--text-primary)]">{tplName}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {tplStyle} · {tplIndustry}
            </p>
            <Link
              href={`/dashboard/templates?applyTo=${encodeURIComponent(clientId)}&replace=true`}
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--accent)]"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Change template →
            </Link>
          </div>
          <nav className="flex-1 py-2">
            {NORTHFIELD_EDITOR_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGroup(g)}
                className={`flex w-full border-l-2 py-2.5 pl-4 pr-2 text-left text-[13px] font-medium ${
                  activeGroup === g
                    ? "border-[var(--accent)] bg-[var(--surface-card-alt)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]/60"
                }`}
              >
                {g}
              </button>
            ))}
          </nav>
        </aside>

        <main className="w-[420px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-card)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{activeGroup}</p>
          <h2 className="font-display text-2xl text-[var(--text-primary)]">Edit content</h2>
          <div className="mt-4 space-y-5">
            {fieldsInGroup.map((f) => (
              <LockedFieldRow key={f.path} spec={f} content={content} theme={theme} clientId={clientId} onChange={handleFieldChange} />
            ))}
          </div>
          <div className="mt-8 flex justify-end border-t border-[var(--border)] pt-4">
            <button
              type="button"
              className="text-sm font-medium text-[var(--accent)]"
              onClick={() => {
                const gs = [...NORTHFIELD_EDITOR_GROUPS];
                const i = gs.indexOf(activeGroup as (typeof NORTHFIELD_EDITOR_GROUPS)[number]);
                if (i >= 0 && i < gs.length - 1) setActiveGroup(gs[i + 1]!);
              }}
            >
              Next group →
            </button>
          </div>
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
    </DragDropContext>
  );
}

function LockedFieldRow({
  spec,
  content,
  theme,
  clientId,
  onChange,
}: {
  spec: EditableFieldSpec;
  content: NorthfieldContent;
  theme: NorthfieldTheme;
  clientId: string;
  onChange: (path: string, value: unknown) => void;
}) {
  const val = readField(content, theme, spec.path);

  if (spec.type === "color") {
    return (
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">{spec.label}</label>
        <div className="mt-1">
          <ColorPicker value={String(val ?? "#000000")} onChange={(hex) => onChange(spec.path, hex)} />
        </div>
        {spec.hint ? <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{spec.hint}</p> : null}
      </div>
    );
  }

  if (spec.type === "textarea") {
    return (
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">{spec.label}</label>
        <textarea
          className="mt-1 w-full rounded-md border border-[var(--border)] p-2 text-sm"
          rows={4}
          value={String(val ?? "")}
          maxLength={spec.maxLength}
          onChange={(e) => onChange(spec.path, e.target.value)}
        />
        {spec.hint ? <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{spec.hint}</p> : null}
      </div>
    );
  }

  if (spec.type === "image") {
    return (
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">{spec.label}</label>
        <div className="mt-1">
          <ImageUpload
            folder={spec.path.includes("projects") ? "projects" : "hero"}
            value={(val as string | null) ?? null}
            onChange={(url) => onChange(spec.path, url)}
            clientId={clientId}
          />
        </div>
        {spec.hint ? <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{spec.hint}</p> : null}
      </div>
    );
  }

  if (spec.type === "repeater" && spec.itemSchema) {
    const arr = (Array.isArray(val) ? val : []) as Record<string, unknown>[];
    const items = withRowIds(arr, spec.path);
    const readOnlyCount = spec.locked === "count";
    return (
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">{spec.label}</label>
        <RepeaterList
          droppableId={`locked-${spec.path}`}
          items={items}
          singular="item"
          maxItems={spec.maxItems ?? 99}
          readOnlyCount={readOnlyCount}
          onAdd={() => {
            if (readOnlyCount) return;
            const row: Record<string, unknown> = {};
            for (const it of spec.itemSchema ?? []) {
              if (it.type === "tag-list") row[it.field] = [];
              else if (it.type === "link-list") row[it.field] = [{ label: "", href: "" }];
              else row[it.field] = "";
            }
            const next = [...arr, row];
            onChange(spec.path, stripIds(next));
          }}
          onChange={(next) => {
            const cleaned = next.map((row) => {
              const copy = { ...row } as Record<string, unknown>;
              delete copy._id;
              return copy;
            });
            onChange(spec.path, cleaned);
          }}
          renderPreview={(it) => <span className="truncate text-sm">{JSON.stringify(it).slice(0, 80)}…</span>}
          renderItem={(it, idx) => (
            <div className="space-y-3">
              {(spec.itemSchema ?? []).map((sub) => (
                <div key={sub.field}>
                  <label className="text-[11px] text-[var(--text-tertiary)]">{sub.label}</label>
                  {sub.type === "textarea" ? (
                    <textarea
                      className="mt-0.5 w-full rounded border border-[var(--border)] p-2 text-sm"
                      rows={3}
                      value={String((it as Record<string, unknown>)[sub.field] ?? "")}
                      onChange={(e) => {
                        const next = arr.slice();
                        const cur = { ...(next[idx] as Record<string, unknown>) };
                        cur[sub.field] = e.target.value;
                        next[idx] = cur;
                        onChange(spec.path, next);
                      }}
                    />
                  ) : sub.type === "tag-list" ? (
                    <input
                      className="mt-0.5 w-full rounded border border-[var(--border)] p-2 text-sm"
                      value={Array.isArray((it as Record<string, unknown>)[sub.field])
                        ? ((it as Record<string, unknown>)[sub.field] as string[]).join(", ")
                        : ""}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const next = arr.slice();
                        const cur = { ...(next[idx] as Record<string, unknown>) };
                        cur[sub.field] = tags;
                        next[idx] = cur;
                        onChange(spec.path, next);
                      }}
                    />
                  ) : sub.type === "link-list" ? (
                    <div className="space-y-2">
                      {(((it as Record<string, unknown>)[sub.field] as { label: string; href: string }[]) ?? []).map((ln, li) => (
                        <div key={li} className="flex gap-2">
                          <input
                            className="flex-1 rounded border border-[var(--border)] p-1 text-xs"
                            placeholder="Label"
                            value={ln.label}
                            onChange={(e) => {
                              const next = arr.slice();
                              const curIt = { ...(next[idx] as Record<string, unknown>) };
                              const links = [...((curIt[sub.field] as { label: string; href: string }[]) ?? [])];
                              links[li] = { ...links[li]!, label: e.target.value };
                              curIt[sub.field] = links;
                              next[idx] = curIt;
                              onChange(spec.path, next);
                            }}
                          />
                          <input
                            className="flex-1 rounded border border-[var(--border)] p-1 text-xs"
                            placeholder="URL"
                            value={ln.href}
                            onChange={(e) => {
                              const next = arr.slice();
                              const curIt = { ...(next[idx] as Record<string, unknown>) };
                              const links = [...((curIt[sub.field] as { label: string; href: string }[]) ?? [])];
                              links[li] = { ...links[li]!, href: e.target.value };
                              curIt[sub.field] = links;
                              next[idx] = curIt;
                              onChange(spec.path, next);
                            }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-xs text-[var(--accent)]"
                        onClick={() => {
                          const next = arr.slice();
                          const curIt = { ...(next[idx] as Record<string, unknown>) };
                          const links = [...((curIt[sub.field] as { label: string; href: string }[]) ?? []), { label: "", href: "" }];
                          curIt[sub.field] = links;
                          next[idx] = curIt;
                          onChange(spec.path, next);
                        }}
                      >
                        + Link
                      </button>
                    </div>
                  ) : (
                    <input
                      className="mt-0.5 w-full rounded border border-[var(--border)] p-2 text-sm"
                      value={String((it as Record<string, unknown>)[sub.field] ?? "")}
                      onChange={(e) => {
                        const next = arr.slice();
                        const cur = { ...(next[idx] as Record<string, unknown>) };
                        cur[sub.field] = e.target.value;
                        next[idx] = cur;
                        onChange(spec.path, next);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-[var(--text-secondary)]">{spec.label}</label>
      <input
        className="mt-1 w-full rounded-md border border-[var(--border)] p-2 text-sm"
        value={String(val ?? "")}
        maxLength={spec.maxLength}
        onChange={(e) => onChange(spec.path, e.target.value)}
      />
      {spec.hint ? <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{spec.hint}</p> : null}
    </div>
  );
}
