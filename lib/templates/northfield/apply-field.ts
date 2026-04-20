import { setByContentPath } from "@/lib/json-content-path";
import type { NorthfieldContent, NorthfieldTheme } from "@/types/templates/northfield";

export function applyLockedFieldUpdate(
  content: NorthfieldContent,
  theme: NorthfieldTheme,
  path: string,
  value: unknown
): { content: NorthfieldContent; theme: NorthfieldTheme } {
  if (path.startsWith("theme.")) {
    const sub = path.slice("theme.".length);
    const nextTheme = setByContentPath({ ...theme } as unknown as Record<string, unknown>, sub, value) as unknown as NorthfieldTheme;
    return { content, theme: nextTheme };
  }
  const nextContent = setByContentPath(
    { ...content } as unknown as Record<string, unknown>,
    path,
    value
  ) as unknown as NorthfieldContent;
  return { content: nextContent, theme };
}
