"use client";

import { useCallback, useEffect, useState } from "react";
import { applyPathUpdate } from "@/lib/editablePaths";
import type { FormSchemaRow, LandingPageRow } from "@/types";
import { unwrapMessage, wrapMessage, type BuilderToPreviewMessage } from "@/types/previewProtocol";
import { PublicLanding } from "./PublicLanding";

type Props = {
  initialLanding: LandingPageRow;
  clientId: string;
  slug: string;
  formSchema: FormSchemaRow | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
  templatePreview?: boolean;
};

export function LivePublicLandingUnlocked({
  initialLanding,
  clientId,
  slug,
  formSchema,
  termsUrl,
  privacyUrl,
  templatePreview,
}: Props) {
  const [landing, setLanding] = useState<LandingPageRow>(initialLanding);

  useEffect(() => {
    setLanding(initialLanding);
  }, [initialLanding]);

  const onMessage = useCallback((e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    const msg = unwrapMessage<BuilderToPreviewMessage>(e.data);
    if (!msg) return;

    if (msg.type === "FIELD_UPDATED") {
      setLanding((prev) =>
        applyPathUpdate(prev as unknown as Record<string, unknown>, msg.path, msg.value) as unknown as LandingPageRow
      );
      return;
    }
    if (msg.type === "SECTION_VISIBILITY_CHANGED") {
      setLanding((prev) => ({
        ...prev,
        section_visibility: {
          ...(prev.section_visibility as Record<string, boolean>),
          [msg.section]: msg.visible,
        },
      }));
      return;
    }
    if (msg.type === "SECTION_REORDER") {
      setLanding((prev) => ({ ...prev, section_order: msg.order as LandingPageRow["section_order"] }));
      return;
    }
    if (msg.type === "FULL_STATE_SYNC") {
      setLanding((prev) => ({ ...prev, ...(msg.state as Partial<LandingPageRow>) }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    if (window.parent !== window) {
      window.parent.postMessage(wrapMessage({ type: "READY" }), window.location.origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  return (
    <PublicLanding
      clientId={clientId}
      slug={slug}
      landing={landing}
      formSchema={formSchema}
      termsUrl={termsUrl}
      privacyUrl={privacyUrl}
      previewMode
      templatePreview={templatePreview}
      hidePreviewRibbon
      livePreview
    />
  );
}
