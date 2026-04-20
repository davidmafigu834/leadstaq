export const SECTION_IDS = ["hero", "about", "services", "projects", "testimonials", "footer"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "hero",
  "about",
  "services",
  "projects",
  "testimonials",
  "footer",
];

export const DEFAULT_SECTION_VISIBILITY: Record<SectionId, boolean> = {
  hero: true,
  about: true,
  services: true,
  projects: true,
  testimonials: true,
  footer: true,
};

export const SERVICE_ICON_KEYS = [
  "Hammer",
  "Wrench",
  "HardHat",
  "Truck",
  "Paintbrush",
  "Ruler",
  "Home",
  "Building",
  "Briefcase",
  "Shield",
  "Zap",
  "Sun",
  "Droplet",
  "Leaf",
  "Scale",
  "Gavel",
  "Stethoscope",
  "Sparkles",
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

export const FONT_CHOICES = [
  { id: "instrument-serif", label: "Instrument Serif + Geist", preview: "Leadstaq default pairing" },
  { id: "playfair-inter", label: "Playfair + Inter", preview: "Classic editorial" },
  { id: "dm-serif-sans", label: "DM Serif + DM Sans", preview: "Warm professional" },
  { id: "syne", label: "Syne + Syne", preview: "Bold geometric" },
  { id: "newsreader-source", label: "Newsreader + Source Sans 3", preview: "Editorial-style (replaces proprietary pairs)" },
] as const;
