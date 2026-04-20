"use client";

import { useCallback, useEffect, useState } from "react";
import { applyLockedFieldUpdate } from "@/lib/templates/northfield/apply-field";
import { northfieldContentSchema, northfieldThemeSchema } from "@/lib/templates/northfield/schema";
import { NORTHFIELD_DEFAULT_CONTENT, NORTHFIELD_DEFAULT_THEME } from "@/lib/templates/northfield/defaults";
import { getTemplateComponent } from "@/lib/templates/registry";
import type { FormSchemaRow, LandingPageRow } from "@/types";
import type { NorthfieldContent, NorthfieldTheme } from "@/types/templates/northfield";
import { unwrapMessage, wrapMessage, type BuilderToPreviewMessage } from "@/types/previewProtocol";
import { FormRenderer } from "@/components/FormRenderer";

type LockedMeta = {
  component_name: string;
  default_content?: unknown;
  default_theme?: unknown;
};

function parseState(landing: LandingPageRow, meta: LockedMeta) {
  const rawC = landing.template_content ?? meta.default_content ?? NORTHFIELD_DEFAULT_CONTENT;
  const rawT = landing.template_theme ?? meta.default_theme ?? NORTHFIELD_DEFAULT_THEME;
  const c = northfieldContentSchema.safeParse(rawC);
  const t = northfieldThemeSchema.safeParse(rawT);
  return {
    content: (c.success ? c.data : NORTHFIELD_DEFAULT_CONTENT) as NorthfieldContent,
    theme: (t.success ? t.data : NORTHFIELD_DEFAULT_THEME) as NorthfieldTheme,
  };
}

export function LiveNorthfieldLanding({
  initialLanding,
  lockedTemplate,
  clientId,
  formSchema,
}: {
  initialLanding: LandingPageRow;
  lockedTemplate: LockedMeta;
  clientId: string;
  slug?: string;
  formSchema: FormSchemaRow | null;
}) {
  const [{ content, theme }, setBoth] = useState(() => parseState(initialLanding, lockedTemplate));

  useEffect(() => {
    setBoth(parseState(initialLanding, lockedTemplate));
  }, [initialLanding, lockedTemplate]);

  const onMessage = useCallback((e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    const msg = unwrapMessage<BuilderToPreviewMessage>(e.data);
    if (!msg) return;
    if (msg.type === "FIELD_UPDATED") {
      setBoth((prev) => applyLockedFieldUpdate(prev.content, prev.theme, msg.path, msg.value));
      return;
    }
    if (msg.type === "FULL_STATE_SYNC") {
      const st = msg.state as { template_content?: unknown; template_theme?: unknown };
      const c = northfieldContentSchema.safeParse(st.template_content);
      const t = northfieldThemeSchema.safeParse(st.template_theme);
      if (c.success && t.success) setBoth({ content: c.data, theme: t.data });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    if (window.parent !== window) {
      window.parent.postMessage(wrapMessage({ type: "READY" }), window.location.origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  const Cmp = getTemplateComponent(lockedTemplate.component_name);
  if (!Cmp) {
    return <div className="p-8 text-center text-sm">Unknown locked template.</div>;
  }

  async function submitAnswers(answers: Record<string, string>) {
    await fetch("/api/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, source: "LANDING_PAGE", formData: answers }),
    });
  }

  const formSlot =
    formSchema && formSchema.fields?.length ? (
      <FormRenderer
        variant="northfield"
        schema={{
          fields: formSchema.fields,
          form_title: null,
          submit_button_text: content.quote_card.submit_label,
          thank_you_message: formSchema.thank_you_message,
        }}
        onSubmit={submitAnswers}
        primaryColor={theme.primary_color}
      />
    ) : (
      <div className="rounded-lg border border-white/15 p-4 text-sm text-white/60">Form not configured.</div>
    );

  return <Cmp content={content} theme={theme} leadFormSlot={formSlot} isPreview />;
}
