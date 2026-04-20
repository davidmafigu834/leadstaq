import type { NorthfieldContent, NorthfieldTheme } from "@/types/templates/northfield";

export const NORTHFIELD_DEFAULT_THEME: NorthfieldTheme = {
  primary_color: "#FF6B1F",
  ink_color: "#1A1815",
  paper_color: "#EFEAE0",
};

export const NORTHFIELD_DEFAULT_CONTENT: NorthfieldContent = {
  top_bar: {
    license_text: "Est. 1998 · Lic. #CA-24891",
    availability_text: "Taking projects — Q3 / 2026",
    phone_display: "+1 (415) 555 0142",
    company_name: "Northfield & Co.",
  },
  hero: {
    eyebrow: "Commercial Construction · Northern California",
    headline_line_1: "We build",
    headline_italic_word: "remarkable",
    headline_line_2: "places",
    headline_line_3: "for",
    headline_underlined: "people to work.",
    lede: "Northfield & Co. delivers commercial builds that last — for hotels, offices, hospitals, and warehouses across the Bay Area. On time. On budget. Every time.",
    meta_stats: [
      { label: "Est.", value: "1998" },
      { label: "Projects", value: "240+" },
      { label: "Repeat Rate", value: "84%" },
    ],
  },
  quote_card: {
    tag: "Free Estimate",
    title: "Request a project quote.",
    subtitle: "We respond within one business day.",
    submit_label: "Request Quote",
    caption: "No obligation — tell us about scope, schedule, and budget.",
  },
  marquee: {
    items: [
      { text: "Commercial builds", accent_word: "builds" },
      { text: "Ground-up hotels", accent_word: "hotels" },
      { text: "Healthcare facilities", accent_word: null },
      { text: "Office campuses", accent_word: "campuses" },
      { text: "Industrial warehouses", accent_word: "warehouses" },
      { text: "Tenant improvements", accent_word: "improvements" },
    ],
  },
  stats: {
    section_number: "01 / By the numbers",
    section_title_prefix: "A quarter-century of",
    section_title_italic: "steady",
    section_title_suffix: "delivery.",
    items: [
      { number: "240", superscript: "+", label: "Commercial projects delivered across Northern California." },
      { number: "52", superscript: null, label: "Week average from mobilization to substantial completion on core builds." },
      { number: "11", superscript: null, label: "Months — our median schedule variance on fixed-price contracts." },
      { number: "84", superscript: "%", label: "Repeat clients who bring us their next phase within 24 months." },
    ],
  },
  services: {
    section_number: "02 / Capabilities",
    section_title_prefix: "What we",
    section_title_italic: "build",
    section_title_suffix: "best.",
    intro:
      "From early feasibility through commissioning, Northfield self-performs structure and envelope while coordinating MEP partners who meet our QA bar. Every trade package is sequenced to protect your opening date.",
    items: [
      {
        number: "S / 01",
        title_prefix: "Commercial",
        title_italic: "new build",
        title_suffix: null,
        description:
          "Ground-up offices, labs, and mixed-use podiums with tight floor-to-floor heights and aggressive crane calendars.",
        tags: ["Design-assist", "LEED", "Fast-track"],
      },
      {
        number: "S / 02",
        title_prefix: "Hospitality &",
        title_italic: "higher-ed",
        title_suffix: null,
        description:
          "Hotels, student housing, and conference centers where acoustics, FF&E coordination, and punch quality define turnover.",
        tags: ["GC", "CMAR", "Open book"],
      },
      {
        number: "S / 03",
        title_prefix: "Healthcare",
        title_italic: "shell & core",
        title_suffix: null,
        description:
          "IMF-ready slabs, vibration-sensitive imaging suites, and phased occupancy without shutting down active campuses.",
        tags: ["OSP", "ICRA", "Phased"],
      },
      {
        number: "S / 04",
        title_prefix: "Industrial",
        title_italic: "warehouse",
        title_suffix: "& logistics",
        description:
          "Clear heights over 36', ESFR, and cross-dock configurations with accelerated paving and rack-ready flatness.",
        tags: ["Tilt-up", "PEMB", "Nationwide"],
      },
    ],
  },
  projects: {
    section_number: "03 / Selected work",
    section_title_prefix: "Proof in",
    section_title_italic: "steel",
    section_title_suffix: "and concrete.",
    items: [
      {
        number: "01",
        name_prefix: "The Holloway —",
        name_italic: "Oakland",
        type_heading: "Hotel · 148 rooms",
        type_detail: "52,000 sq ft · 11 months",
        completed_heading: "Completed",
        completed_detail: "2024 · Q4",
        value: "$32M",
        image_url: null,
      },
      {
        number: "02",
        name_prefix: "Bayview Labs —",
        name_italic: "South SF",
        type_heading: "Office / R&D · 6 floors",
        type_detail: "118,000 sq ft · 14 months",
        completed_heading: "Completed",
        completed_detail: "2023 · Q2",
        value: "$48M",
        image_url: null,
      },
      {
        number: "03",
        name_prefix: "Marin Health —",
        name_italic: "Greenbrae",
        type_heading: "Hospital wing · Level 5 IMF",
        type_detail: "34,000 sq ft · 9 months",
        completed_heading: "Completed",
        completed_detail: "2022 · Q1",
        value: "$27M",
        image_url: null,
      },
    ],
  },
  process: {
    section_number: "04 / How we work",
    section_title_prefix: "Discipline in",
    section_title_italic: "every",
    section_title_suffix: "phase.",
    steps: [
      {
        number: "01",
        title_prefix: "Preconstruction",
        title_italic: "clarity",
        title_suffix: null,
        description:
          "Estimating, logistics modeling, and trade partner buyout before we pour footings. You see the critical path weekly.",
      },
      {
        number: "02",
        title_prefix: "Field",
        title_italic: "execution",
        title_suffix: null,
        description:
          "Superintendents with commissioning mindsets — daily huddles, photo documentation, and zero-surprise RFIs.",
      },
      {
        number: "03",
        title_prefix: "Quality &",
        title_italic: "safety",
        title_suffix: null,
        description:
          "Third-party inspections on waterproofing and fireproofing. EMR under 0.85 for five consecutive years.",
      },
      {
        number: "04",
        title_prefix: "Closeout &",
        title_italic: "warranty",
        title_suffix: null,
        description:
          "Digital O&M manuals, training walkthroughs, and a dedicated warranty desk for 24 months post occupancy.",
      },
    ],
  },
  testimonial: {
    quote_parts: {
      opening:
        "Northfield ran the tightest site logistics we have seen on a downtown infill. They protected our brand standard while shaving six weeks off a",
      italic_1: "very",
      middle: "aggressive opening date. Their field leadership",
      italic_2: "never",
      closing: "wavered when the crane calendar shifted — they rebuilt the sequence overnight.",
    },
    author_initials: "RK",
    author_name: "Rina Kowalski",
    author_role: "VP Development · Harborline Hospitality",
  },
  cta: {
    title_prefix: "Ready when you are —",
    title_italic: "call",
    subtitle: "Tell us about your next bid package, RFQ, or design-assist opportunity. We will staff a partner-level lead within 48 hours.",
    action_label: "Schedule a call",
    phone_display: "+1 (415) 555 0142",
    hours_text: "Mon–Fri · 7a–6p PT\nSat · By appointment",
  },
  footer: {
    tagline: "Commercial construction for teams who cannot afford surprises.",
    columns: [
      {
        title: "Company",
        links: [
          { label: "About", href: "#" },
          { label: "Safety", href: "#" },
          { label: "Careers", href: "#" },
        ],
      },
      {
        title: "Markets",
        links: [
          { label: "Hospitality", href: "#" },
          { label: "Healthcare", href: "#" },
          { label: "Industrial", href: "#" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Project archive", href: "#" },
          { label: "Qualifications", href: "#" },
          { label: "Contact", href: "#" },
        ],
      },
    ],
    copyright: "© 2026 Northfield & Co. All rights reserved.",
    legal_links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Licenses", href: "#" },
    ],
  },
};
