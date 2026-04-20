"use client";

import { createContext, useContext, useMemo } from "react";

export type PreviewBridge = {
  emitFocus: (path: string) => void;
  emitBlur: (path: string) => void;
  /** Sync a field to the preview iframe (debounced unless immediate). */
  emitField: (path: string, value: unknown, immediate?: boolean) => void;
};

const PreviewBridgeContext = createContext<PreviewBridge | null>(null);

export function PreviewBridgeProvider({ value, children }: { value: PreviewBridge; children: React.ReactNode }) {
  return <PreviewBridgeContext.Provider value={value}>{children}</PreviewBridgeContext.Provider>;
}

const noopBridge: PreviewBridge = {
  emitFocus: () => {},
  emitBlur: () => {},
  emitField: () => {},
};

export function usePreviewBridge(): PreviewBridge {
  const c = useContext(PreviewBridgeContext);
  return useMemo(() => c ?? noopBridge, [c]);
}
