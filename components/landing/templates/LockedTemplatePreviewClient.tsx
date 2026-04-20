"use client";

import { getTemplateComponent } from "@/lib/templates/registry";
import type { NorthfieldContent, NorthfieldTheme } from "@/types/templates/northfield";
import { PlaceholderForm } from "./PlaceholderForm";

export function LockedTemplatePreviewClient({
  componentName,
  content,
  theme,
}: {
  componentName: string;
  content: NorthfieldContent;
  theme: NorthfieldTheme;
}) {
  const Cmp = getTemplateComponent(componentName);
  if (!Cmp) return <div className="p-8 text-sm">Unknown template component.</div>;
  return <Cmp content={content} theme={theme} leadFormSlot={<PlaceholderForm />} isPreview />;
}
