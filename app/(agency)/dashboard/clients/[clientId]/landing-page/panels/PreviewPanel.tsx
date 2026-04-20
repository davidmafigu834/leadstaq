"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeviceFrame } from "./DeviceFrame";
import type { PreviewDevice } from "./preview-types";

export type { PreviewDevice } from "./preview-types";

export function PreviewPanel({
  slug,
  device,
  displayUrl,
  iframeRef,
  iframeRev,
  onIframeLoad,
  onManualReload,
}: {
  slug: string;
  device: PreviewDevice;
  /** Shown in the preview chrome (non-clickable). */
  displayUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Increment to bust cache (publish, font, manual reload). */
  iframeRev: number;
  onIframeLoad?: () => void;
  onManualReload?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [previewTooNarrow, setPreviewTooNarrow] = useState(false);
  const previewAreaRef = useRef<HTMLDivElement>(null);

  const src = useMemo(() => {
    const base = `/p/${slug}/preview`;
    return iframeRev > 0 ? `${base}?rev=${iframeRev}` : base;
  }, [slug, iframeRev]);

  useEffect(() => {
    setLoading(true);
  }, [src, device]);

  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setPreviewTooNarrow(el.clientWidth < 640);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onRefresh = useCallback(() => {
    onManualReload?.();
  }, [onManualReload]);

  const handleFrameLoad = useCallback(() => {
    setLoading(false);
    onIframeLoad?.();
  }, [onIframeLoad]);

  return (
    <div ref={previewAreaRef} className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-card-alt)]">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-4 py-2">
        <p className="min-w-0 truncate font-mono text-[12px] text-[var(--text-tertiary)]">{displayUrl}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            title="Reload preview"
            onClick={onRefresh}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <a
            href={`/p/${slug}/preview`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-card-alt)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </a>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="pointer-events-none absolute inset-x-8 top-6 z-10 h-0.5 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full w-1/3 animate-pulse bg-[var(--accent)]" />
          </div>
        ) : null}
        {previewTooNarrow ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--surface-card-alt)]/95 p-6 text-center">
            <div className="max-w-xs text-sm text-[var(--text-secondary)]">
              Preview area is narrower than 640px. Widen the window for a clearer desktop preview.
            </div>
          </div>
        ) : null}
        <DeviceFrame mode={device} src={src} iframeRef={iframeRef} onLoad={handleFrameLoad} />
      </div>
    </div>
  );
}
