const PREFIX: Record<string, string> = {
  top_bar: "Brand",
  hero: "Hero",
  quote_card: "Quote Form",
  marquee: "Marquee",
  stats: "Stats",
  services: "Services",
  projects: "Projects",
  process: "Process",
  testimonial: "Testimonial",
  cta: "Call to Action",
  footer: "Footer",
  theme: "Theme",
};

export function pathToLockedEditorGroup(path: string): string {
  const m = /^([^.[]+)/.exec(path);
  const root = m?.[1] ?? "";
  return PREFIX[root] ?? "Brand";
}
