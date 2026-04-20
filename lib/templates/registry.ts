import { NorthfieldConstruction } from "@/components/landing/templates/NorthfieldConstruction";

export const TEMPLATE_REGISTRY = {
  NorthfieldConstruction,
} as const;

export type TemplateComponentName = keyof typeof TEMPLATE_REGISTRY;

export function getTemplateComponent(name: string | null | undefined) {
  if (!name) return null;
  const Cmp = (TEMPLATE_REGISTRY as Record<string, unknown>)[name];
  return (Cmp as typeof NorthfieldConstruction) ?? null;
}
