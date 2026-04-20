"use client";

import { ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPathLabel, parsePath as parsePathMeta } from "@/lib/editablePaths";
import { unwrapMessage, wrapMessage, type BuilderToPreviewMessage } from "@/types/previewProtocol";

type ZoneMode = "text" | "textarea" | "image" | "color" | "icon" | "rating" | "select";

type Props = {
  path: string;
  mode: ZoneMode;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  /** When true in preview iframe, show emptyHint instead of blank text. */
  isEmpty?: boolean;
  emptyHint?: string;
  /** Override pill label in preview (e.g. locked template paths). */
  label?: string;
};

export function EditableZone({ path, mode, children, className = "", as: Tag = "div", style, isEmpty, emptyHint, label }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPreviewIframe, setIsPreviewIframe] = useState(false);

  useEffect(() => {
    setIsPreviewIframe(typeof window !== "undefined" && window.parent !== window);
  }, []);

  const onMessage = useCallback(
    (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = unwrapMessage<BuilderToPreviewMessage>(e.data);
      if (!msg) return;
      if (msg.type === "FIELD_FOCUSED") {
        if (msg.path === path) {
          setIsFocused(true);
          requestAnimationFrame(() => {
            ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        } else {
          setIsFocused(false);
        }
      } else if (msg.type === "FIELD_BLURRED" && msg.path === path) {
        setIsFocused(false);
      }
    },
    [path]
  );

  useEffect(() => {
    if (!isPreviewIframe) return;
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isPreviewIframe, onMessage]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreviewIframe) return;
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    const rect = el?.getBoundingClientRect();
    window.parent.postMessage(
      wrapMessage({
        type: "ELEMENT_CLICKED",
        path,
        boundingRect: rect
          ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          : { top: 0, left: 0, width: 0, height: 0 },
      }),
      window.location.origin
    );
  };

  const handleMouseEnter = () => {
    if (!isPreviewIframe) return;
    setIsHovered(true);
    window.parent.postMessage(wrapMessage({ type: "ELEMENT_HOVERED", path }), window.location.origin);
  };

  const handleMouseLeave = () => {
    if (!isPreviewIframe) return;
    setIsHovered(false);
    window.parent.postMessage(wrapMessage({ type: "ELEMENT_HOVERED", path: null }), window.location.origin);
  };

  const editableClass = isPreviewIframe
    ? [
        "relative cursor-pointer transition-all duration-150",
        "before:absolute before:inset-[-4px] before:rounded-[6px] before:pointer-events-none",
        "before:border-2 before:border-transparent",
        isHovered ? "before:border-[#D4FF4F]/60" : "",
        isFocused ? "before:border-[#D4FF4F] before:shadow-[0_0_0_3px_rgba(212,255,79,0.25)]" : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const showPill = isPreviewIframe && (isHovered || isFocused);
  const pillLabel = label ?? getPathLabel(path);
  const meta = parsePathMeta(path);

  const Cmp = Tag as React.ElementType;

  const showHint = Boolean(isPreviewIframe && isEmpty && emptyHint);
  const inner = showHint ? (
    <span className="block min-h-[1.25em] text-sm italic text-[var(--text-secondary)] opacity-80">{emptyHint}</span>
  ) : (
    children
  );

  return (
    <Cmp
      ref={ref as React.Ref<HTMLElement>}
      data-editable-path={path}
      data-editable-mode={mode}
      style={style}
      className={`${className} ${editableClass}`.trim()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Edit ${meta.label}`}
    >
      {isPreviewIframe && mode === "image" ? (
        <span className="relative block h-full w-full">
          {inner}
          <AnimatePresence>
            {isHovered && !isFocused ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white"
              >
                <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
                <span className="text-xs font-medium">Replace image</span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      ) : (
        inner
      )}
      <AnimatePresence>
        {showPill ? (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ delay: 0.1, duration: 0.15 }}
            className="pointer-events-none absolute left-2 top-2 z-[2] rounded px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: "#D4FF4F", color: "#0A0B0D" }}
          >
            {pillLabel}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Cmp>
  );
}
