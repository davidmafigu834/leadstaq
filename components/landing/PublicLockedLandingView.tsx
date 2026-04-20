"use client";

import { FormRenderer } from "@/components/FormRenderer";
import { getTemplateComponent } from "@/lib/templates/registry";
import { northfieldContentSchema, northfieldThemeSchema } from "@/lib/templates/northfield/schema";
import { NORTHFIELD_DEFAULT_CONTENT, NORTHFIELD_DEFAULT_THEME } from "@/lib/templates/northfield/defaults";
import type { FormSchemaRow, LandingPageRow } from "@/types";
import type { NorthfieldContent, NorthfieldTheme } from "@/types/templates/northfield";

type LockedMeta = {
  component_name: string;
  default_content?: unknown;
  default_theme?: unknown;
};

export function PublicLockedLandingView({
  clientId,
  landing,
  formSchema,
  previewMode = false,
  templatePreview = false,
  livePreview = false,
  lockedTemplate,
}: {
  clientId: string;
  slug?: string;
  landing: LandingPageRow;
  formSchema: FormSchemaRow | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
  previewMode?: boolean;
  templatePreview?: boolean;
  hidePreviewRibbon?: boolean;
  livePreview?: boolean;
  lockedTemplate: LockedMeta;
}) {
  const Cmp = getTemplateComponent(lockedTemplate.component_name);
  const rawContent = landing.template_content ?? lockedTemplate.default_content ?? NORTHFIELD_DEFAULT_CONTENT;
  const rawTheme = landing.template_theme ?? lockedTemplate.default_theme ?? NORTHFIELD_DEFAULT_THEME;
  const parsedC = northfieldContentSchema.safeParse(rawContent);
  const parsedT = northfieldThemeSchema.safeParse(rawTheme);
  const content: NorthfieldContent = parsedC.success ? parsedC.data : NORTHFIELD_DEFAULT_CONTENT;
  const theme: NorthfieldTheme = parsedT.success ? parsedT.data : NORTHFIELD_DEFAULT_THEME;

  async function submitAnswers(answers: Record<string, string>) {
    if (previewMode) return;
    const res = await fetch("/api/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        source: "LANDING_PAGE",
        formData: answers,
      }),
    });
    if (!res.ok) throw new Error("submit failed");
  }

  if (!Cmp) {
    return <div className="p-8 text-center text-sm text-[var(--text-secondary)]">Template renderer not found.</div>;
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

  return (
    <Cmp
      content={content}
      theme={theme}
      leadFormSlot={formSlot}
      isPreview={Boolean(previewMode || livePreview || templatePreview)}
    />
  );
}
