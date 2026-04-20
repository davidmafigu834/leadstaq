"use client";

import { useEffect, useRef, useState, type Ref, type RefObject } from "react";
import type { PreviewDevice } from "./preview-types";

const TARGET_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

const TARGET_HEIGHTS: Record<PreviewDevice, number> = {
  desktop: 800,
  tablet: 1024,
  mobile: 812,
};

export function DeviceFrame({
  mode,
  src,
  iframeRef,
  onLoad,
}: {
  mode: PreviewDevice;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  src: string;
  onLoad?: () => void;
}) {
  const targetWidth = TARGET_WIDTHS[mode];
  const targetHeight = TARGET_HEIGHTS[mode];
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const availWidth = container.clientWidth - 64;
      const nextScale = availWidth < targetWidth ? availWidth / targetWidth : 1;
      setScale(nextScale);
    };
    resize();
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode, targetWidth]);

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 items-start justify-center overflow-hidden p-8">
      <div
        className="origin-top overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm"
        style={{
          width: targetWidth,
          height: targetHeight,
          transform: `scale(${scale})`,
          marginBottom: targetHeight * (1 - scale) * -1,
        }}
      >
        <iframe
          ref={iframeRef as Ref<HTMLIFrameElement>}
          key={`${src}-${mode}`}
          title="Landing preview"
          src={src}
          className="h-full w-full border-0"
          style={{ width: targetWidth, height: targetHeight }}
          onLoad={onLoad}
        />
      </div>
    </div>
  );
}
