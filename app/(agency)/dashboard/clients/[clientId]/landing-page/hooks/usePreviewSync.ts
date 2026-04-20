"use client";

import { useCallback, useEffect, useRef } from "react";
import { unwrapMessage, wrapMessage, type BuilderToPreviewMessage, type PreviewToBuilderMessage } from "@/types/previewProtocol";

type Options = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onElementClicked: (path: string) => void;
  onElementHovered: (path: string | null) => void;
  onPreviewReady: () => void;
};

export function usePreviewSync({ iframeRef, onElementClicked, onElementHovered, onPreviewReady }: Options) {
  const isReadyRef = useRef(false);
  const queueRef = useRef<BuilderToPreviewMessage[]>([]);

  const flushQueue = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    const q = [...queueRef.current];
    queueRef.current = [];
    for (const msg of q) {
      w.postMessage(wrapMessage(msg), window.location.origin);
    }
  }, [iframeRef]);

  const sendToPreview = useCallback(
    (msg: BuilderToPreviewMessage) => {
      const w = iframeRef.current?.contentWindow;
      if (!w || !isReadyRef.current) {
        queueRef.current.push(msg);
        return;
      }
      w.postMessage(wrapMessage(msg), window.location.origin);
    },
    [iframeRef]
  );

  const markNotReady = useCallback(() => {
    isReadyRef.current = false;
    queueRef.current = [];
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = unwrapMessage<PreviewToBuilderMessage>(e.data);
      if (!msg) return;
      if (msg.type === "READY") {
        isReadyRef.current = true;
        flushQueue();
        onPreviewReady();
      } else if (msg.type === "ELEMENT_CLICKED") {
        onElementClicked(msg.path);
      } else if (msg.type === "ELEMENT_HOVERED") {
        onElementHovered(msg.path);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [flushQueue, onElementClicked, onElementHovered, onPreviewReady]);

  return { sendToPreview, markNotReady };
}
