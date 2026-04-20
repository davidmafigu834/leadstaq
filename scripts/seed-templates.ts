/**
 * Run: npm run seed:templates
 * Loads .env.local — uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { NORTHFIELD_DEFAULT_CONTENT, NORTHFIELD_DEFAULT_THEME } from "../lib/templates/northfield/defaults";
import { NORTHFIELD_EDITABLE_FIELDS } from "../lib/templates/northfield/editableFields";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvLocal();

const SECTION_ORDER = ["hero", "about", "services", "projects", "testimonials", "footer"];
const SECTION_VISIBILITY = {
  hero: true,
  about: true,
  services: true,
  projects: true,
  testimonials: true,
  footer: true,
};

const UNLOCKED_TEMPLATE_META = {
  is_locked: false,
  component_name: null as string | null,
  content_schema: null as unknown,
  default_content: null as unknown,
  default_theme: null as unknown,
  editable_fields: null as unknown,
};

const TEMPLATES = [
  {
    slug: "northfield-construction",
    name: "Northfield",
    description:
      "Heavy editorial design for commercial construction and general contractors. Blueprint-inspired with an industrial palette.",
    industry: "construction",
    style: "editorial",
    thumbnail_url: "/templates/northfield-thumb.svg",
    preview_url: null as string | null,
    is_premium: false,
    is_published: true,
    sort_order: 1,
    is_locked: true,
    component_name: "NorthfieldConstruction",
    default_content: NORTHFIELD_DEFAULT_CONTENT,
    default_theme: NORTHFIELD_DEFAULT_THEME,
    editable_fields: NORTHFIELD_EDITABLE_FIELDS,
    hero_headline: null,
    hero_subheadline: null,
    hero_image_url: null,
    hero_text_color: "light",
    hero_overlay_opacity: 40,
    cta_text: null,
    about_company_name: null,
    about_tagline: null,
    about_text: null,
    about_image_url: null,
    about_stats: [],
    services: [],
    projects: [],
    testimonials: [],
    primary_color: NORTHFIELD_DEFAULT_THEME.primary_color,
    font_choice: "instrument-serif",
    footer_contact: null,
    footer_socials: { enabled: false, facebook: "", instagram: "", linkedin: "", youtube: "" },
    footer_copyright: null,
    section_order: SECTION_ORDER,
    section_visibility: SECTION_VISIBILITY,
    content_schema: null,
  },
  {
    slug: "foundation-construction",
    name: "Foundation",
    description: "Clean, confident layout for construction and general contractors.",
    industry: "construction",
    style: "minimal",
    thumbnail_url: "/templates/foundation-construction.svg",
    preview_url: null as string | null,
    is_premium: false,
    is_published: true,
    sort_order: 0,
    hero_headline: "Building with precision since 1998.",
    hero_subheadline:
      "Commercial and residential construction trusted by 200+ clients across the region.",
    hero_image_url: null,
    hero_text_color: "light",
    hero_overlay_opacity: 45,
    cta_text: "Get a free project estimate",
    about_company_name: "Your Company Name",
    about_tagline: "Builders who listen.",
    about_text:
      "We deliver on time, on budget, and to spec. Every project starts with a conversation and ends with a handshake.",
    about_image_url: null,
    about_stats: [
      { label: "Years in business", value: "25+" },
      { label: "Projects completed", value: "200+" },
      { label: "Repeat client rate", value: "84%" },
    ],
    services: [
      {
        title: "Commercial builds",
        description: "Office, retail, and warehouse construction.",
        icon: "Building",
      },
      { title: "Residential", description: "Custom homes and major renovations.", icon: "Home" },
      {
        title: "Project management",
        description: "End-to-end coordination and reporting.",
        icon: "Briefcase",
      },
    ],
    projects: [],
    testimonials: [],
    primary_color: "#0A0B0D",
    font_choice: "instrument-serif",
    footer_contact: "Call (555) 000-0000 · hello@yourcompany.com",
    footer_socials: { enabled: false, facebook: "", instagram: "", linkedin: "", youtube: "" },
    footer_copyright: "© Your Company. All rights reserved.",
    section_order: SECTION_ORDER,
    section_visibility: SECTION_VISIBILITY,
    ...UNLOCKED_TEMPLATE_META,
  },
  {
    slug: "sunrise-solar",
    name: "Sunrise",
    description: "High-energy design for solar and renewable energy companies.",
    industry: "solar",
    style: "bold",
    thumbnail_url: "/templates/sunrise-solar.svg",
    preview_url: null,
    is_premium: false,
    is_published: true,
    sort_order: 2,
    hero_headline: "Power your home with the sun.",
    hero_subheadline:
      "Save up to 70% on your energy bill with custom solar solutions installed in weeks, not months.",
    hero_image_url: null,
    hero_text_color: "dark",
    hero_overlay_opacity: 20,
    cta_text: "See your savings estimate",
    about_company_name: "Sunrise Solar Co.",
    about_tagline: "Panels that pay for themselves.",
    about_text:
      "From roof assessment to grid hookup, our crews handle permits, incentives, and quality checks so you can flip the switch with confidence.",
    about_image_url: null,
    about_stats: [
      { label: "Homes powered", value: "1,200+" },
      { label: "Avg. payback", value: "6 yrs" },
      { label: "Warranty", value: "25 yrs" },
    ],
    services: [
      {
        title: "Residential solar",
        description: "Custom arrays sized to your roof and usage.",
        icon: "Home",
      },
      {
        title: "Battery backup",
        description: "Keep essentials online when the grid drops.",
        icon: "Zap",
      },
      {
        title: "Commercial installs",
        description: "Flat roofs, carports, and fleet depots.",
        icon: "Building",
      },
    ],
    projects: [],
    testimonials: [],
    primary_color: "#F59E0B",
    font_choice: "syne",
    footer_contact: "Solar@sunrise.example · (555) 010-2030",
    footer_socials: { enabled: false, facebook: "", instagram: "", linkedin: "", youtube: "" },
    footer_copyright: "© Sunrise Solar. All rights reserved.",
    section_order: SECTION_ORDER,
    section_visibility: SECTION_VISIBILITY,
    ...UNLOCKED_TEMPLATE_META,
  },
  {
    slug: "counsel-legal",
    name: "Counsel",
    description: "Refined and authoritative — built for law firms and legal consultants.",
    industry: "legal",
    style: "editorial",
    thumbnail_url: "/templates/counsel-legal.svg",
    preview_url: null,
    is_premium: false,
    is_published: true,
    sort_order: 3,
    hero_headline: "Legal clarity when you need it most.",
    hero_subheadline:
      "Specialized representation in commercial disputes, estate planning, and business formation.",
    hero_image_url: null,
    hero_text_color: "light",
    hero_overlay_opacity: 50,
    cta_text: "Book a consultation",
    about_company_name: "Counsel LLP",
    about_tagline: "Measured advice. Decisive action.",
    about_text:
      "Our attorneys combine trial experience with practical business judgment so you can move forward with confidence.",
    about_image_url: null,
    about_stats: [
      { label: "Years combined experience", value: "120+" },
      { label: "Practice areas", value: "8" },
      { label: "Client retention", value: "92%" },
    ],
    services: [
      {
        title: "Commercial litigation",
        description: "Disputes, contracts, and risk containment.",
        icon: "Scale",
      },
      {
        title: "Estate planning",
        description: "Wills, trusts, and succession strategies.",
        icon: "Shield",
      },
      {
        title: "Business formation",
        description: "Entity choice, agreements, and compliance.",
        icon: "Briefcase",
      },
    ],
    projects: [],
    testimonials: [],
    primary_color: "#1E3A8A",
    font_choice: "playfair-inter",
    footer_contact: "intake@counsel.example · (555) 314-1592",
    footer_socials: { enabled: false, facebook: "", instagram: "", linkedin: "", youtube: "" },
    footer_copyright: "© Counsel LLP. Attorney advertising.",
    section_order: SECTION_ORDER,
    section_visibility: SECTION_VISIBILITY,
    ...UNLOCKED_TEMPLATE_META,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const row of TEMPLATES) {
    const { error } = await supabase.from("landing_page_templates").upsert(row, { onConflict: "slug" });
    if (error) throw error;
    console.log("Upserted template:", row.slug);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
