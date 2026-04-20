export const FONT_STYLESHEETS: Record<string, string | null> = {
  "instrument-serif": null,
  "playfair-inter":
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap",
  "dm-serif-sans":
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&display=swap",
  syne: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap",
  "newsreader-source":
    "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Source+Sans+3:wght@400;500;600&display=swap",
};

export function landingFontVars(choice: string): { heading: string; body: string } {
  switch (choice) {
    case "playfair-inter":
      return { heading: "'Playfair Display', ui-serif, Georgia, serif", body: "'Inter', system-ui, sans-serif" };
    case "dm-serif-sans":
      return { heading: "'DM Serif Display', ui-serif, Georgia, serif", body: "'DM Sans', system-ui, sans-serif" };
    case "syne":
      return { heading: "'Syne', system-ui, sans-serif", body: "'Syne', system-ui, sans-serif" };
    case "newsreader-source":
      return { heading: "'Newsreader', ui-serif, Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif" };
    default:
      return {
        heading: "var(--font-instrument-serif), ui-serif, Georgia, serif",
        body: "var(--font-geist-sans), system-ui, sans-serif",
      };
  }
}
