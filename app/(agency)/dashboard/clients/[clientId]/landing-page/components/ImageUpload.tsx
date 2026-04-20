"use client";

import Image from "next/image";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function ImageUpload({
  clientId,
  folder,
  value,
  onChange,
  maxSizeMB = 5,
}: {
  clientId: string;
  folder: "hero" | "about" | "projects" | "testimonials" | "og";
  value: string | null;
  onChange: (url: string | null) => void;
  maxSizeMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onPick = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!ACCEPT.split(",").includes(file.type)) return;
      if (file.size > maxSizeMB * 1024 * 1024) return;
      setUploading(true);
      setProgress(10);
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      fd.set("clientId", clientId);
      try {
        const res = await fetch("/api/uploads/landing-image", {
          method: "POST",
          body: fd,
        });
        setProgress(80);
        if (!res.ok) throw new Error("upload failed");
        const data = (await res.json()) as { url?: string };
        if (data.url) onChange(data.url);
        setProgress(100);
      } finally {
        setUploading(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [clientId, folder, maxSizeMB, onChange]
  );

  if (value && !uploading) {
    return (
      <div className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-card-alt)]">
        <div className="relative aspect-[16/10] w-full max-h-48">
          <Image src={value} alt="" fill className="object-cover" sizes="480px" unoptimized={value.includes("localhost")} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-[var(--danger)]"
            onClick={() => onChange(null)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-card-alt)] px-6 py-8 text-center text-sm text-[var(--text-secondary)] transition hover:border-[var(--text-tertiary)] disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            <span>Uploading… {progress > 0 ? `${progress}%` : ""}</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-[var(--text-tertiary)]" />
            <span>Click or drop to upload</span>
            <span className="text-xs text-[var(--text-tertiary)]">JPG, PNG, WebP · max {maxSizeMB}MB</span>
          </>
        )}
      </button>
    </div>
  );
}
