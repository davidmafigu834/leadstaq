import type { LandingPageRow } from "@/types";

/** Canonical editable paths shared by preview + builder (see prompt spec). */
export type EditablePath =
  | "hero.headline"
  | "hero.subheadline"
  | "hero.image"
  | "hero.cta_text"
  | "hero.text_color"
  | "hero.overlay_opacity"
  | "about.company_name"
  | "about.tagline"
  | "about.text"
  | "about.image"
  | `about.stats[${number}].label`
  | `about.stats[${number}].value`
  | `services[${number}].title`
  | `services[${number}].description`
  | `services[${number}].icon`
  | `projects[${number}].title`
  | `projects[${number}].location`
  | `projects[${number}].value`
  | `projects[${number}].description`
  | `projects[${number}].image`
  | `testimonials[${number}].name`
  | `testimonials[${number}].company`
  | `testimonials[${number}].quote`
  | `testimonials[${number}].rating`
  | `testimonials[${number}].avatar`
  | "footer.contact"
  | "footer.copyright"
  | `footer.socials.${string}`;

export type PathSection = "hero" | "about" | "services" | "projects" | "testimonials" | "footer" | "global";

export type PathMeta = {
  path: string;
  section: PathSection;
  label: string;
  type: "text" | "textarea" | "image" | "color" | "number" | "select" | "rating";
  arrayIndex?: number;
  statIndex?: number;
  socialKey?: string;
};

const STAT_RE = /^about\.stats\[(\d+)\]\.(label|value)$/;
const SVC_RE = /^services\[(\d+)\]\.(title|description|icon)$/;
const PRJ_RE = /^projects\[(\d+)\]\.(title|location|value|description|image)$/;
const TST_RE = /^testimonials\[(\d+)\]\.(name|company|quote|rating|avatar)$/;
const SOC_RE = /^footer\.socials\.(facebook|instagram|linkedin|youtube)$/;

const LABELS: Record<string, string> = {
  "hero.headline": "Headline",
  "hero.subheadline": "Subheadline",
  "hero.image": "Hero image",
  "hero.cta_text": "CTA text",
  "hero.text_color": "Text color",
  "hero.overlay_opacity": "Overlay strength",
  "about.company_name": "Company name",
  "about.tagline": "Tagline",
  "about.text": "About body",
  "about.image": "About image",
  "footer.contact": "Contact",
  "footer.copyright": "Copyright",
};

export function parsePath(path: string): PathMeta {
  let m: RegExpExecArray | null;
  if ((m = STAT_RE.exec(path))) {
    const idx = Number(m[1]);
    return {
      path,
      section: "about",
      label: m[2] === "label" ? `Stat ${idx + 1} label` : `Stat ${idx + 1} value`,
      type: "text",
      statIndex: idx,
    };
  }
  if ((m = SVC_RE.exec(path))) {
    const idx = Number(m[1]);
    const field = m[2];
    return {
      path,
      section: "services",
      label: field === "title" ? "Service title" : field === "description" ? "Service description" : "Service icon",
      type: field === "description" ? "textarea" : field === "icon" ? "select" : "text",
      arrayIndex: idx,
    };
  }
  if ((m = PRJ_RE.exec(path))) {
    const idx = Number(m[1]);
    const field = m[2];
    return {
      path,
      section: "projects",
      label:
        field === "title"
          ? "Project title"
          : field === "location"
            ? "Project location"
            : field === "value"
              ? "Project value"
              : field === "description"
                ? "Project description"
                : "Project image",
      type: field === "description" ? "textarea" : field === "image" ? "image" : "text",
      arrayIndex: idx,
    };
  }
  if ((m = TST_RE.exec(path))) {
    const idx = Number(m[1]);
    const field = m[2];
    return {
      path,
      section: "testimonials",
      label:
        field === "name"
          ? "Name"
          : field === "company"
            ? "Company"
            : field === "quote"
              ? "Quote"
              : field === "rating"
                ? "Rating"
                : "Avatar",
      type: field === "quote" ? "textarea" : field === "rating" ? "rating" : field === "avatar" ? "image" : "text",
      arrayIndex: idx,
    };
  }
  if ((m = SOC_RE.exec(path))) {
    return {
      path,
      section: "footer",
      label: `${m[1][0]!.toUpperCase()}${m[1].slice(1)} URL`,
      type: "text",
      socialKey: m[1],
    };
  }
  if (path.startsWith("hero.")) {
    return {
      path,
      section: "hero",
      label: LABELS[path] ?? path,
      type: path === "hero.overlay_opacity" ? "number" : path === "hero.image" ? "image" : path === "hero.text_color" ? "select" : "text",
    };
  }
  if (path.startsWith("about.")) {
    return {
      path,
      section: "about",
      label: LABELS[path] ?? path,
      type: path === "about.text" ? "textarea" : path === "about.image" ? "image" : "text",
    };
  }
  if (path.startsWith("footer.")) {
    return {
      path,
      section: "footer",
      label: LABELS[path] ?? path,
      type: path === "footer.contact" ? "textarea" : "text",
    };
  }
  return { path, section: "hero", label: path, type: "text" };
}

export function buildPath(section: string, field: string, index?: number): string {
  if (index !== undefined) return `${section}[${index}].${field}`;
  return `${section}.${field}`;
}

export function getPathLabel(path: string): string {
  return parsePath(path).label.toUpperCase();
}

/** Map preview click path → sidebar panel + repeater expansion index. */
export function pathToEditorTarget(path: string): {
  panel: PathSection | "global-settings";
  serviceIndex?: number;
  projectIndex?: number;
  testimonialIndex?: number;
  statIndex?: number;
} {
  const meta = parsePath(path);
  if (meta.section === "services" && meta.arrayIndex != null) {
    return { panel: "services", serviceIndex: meta.arrayIndex };
  }
  if (meta.section === "projects" && meta.arrayIndex != null) {
    return { panel: "projects", projectIndex: meta.arrayIndex };
  }
  if (meta.section === "testimonials" && meta.arrayIndex != null) {
    return { panel: "testimonials", testimonialIndex: meta.arrayIndex };
  }
  if (meta.statIndex != null) {
    return { panel: "about", statIndex: meta.statIndex };
  }
  if (meta.section === "footer" || meta.socialKey) {
    return { panel: "footer" };
  }
  if (meta.section === "about") {
    return { panel: "about" };
  }
  return { panel: "hero" };
}

function cloneRow(row: LandingPageRow): LandingPageRow {
  try {
    return structuredClone(row) as LandingPageRow;
  } catch {
    return JSON.parse(JSON.stringify(row)) as LandingPageRow;
  }
}

/** Apply a single path update onto a landing row (immutable). */
export function applyPathUpdate<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const row = cloneRow(obj as unknown as LandingPageRow) as unknown as Record<string, unknown>;

  const setArr = (key: string, index: number, field: string, v: unknown) => {
    const arr = Array.isArray(row[key]) ? [...(row[key] as unknown[])] : [];
    while (arr.length <= index) arr.push({});
    const item = { ...(arr[index] as Record<string, unknown>) };
    item[field] = v;
    arr[index] = item;
    row[key] = arr;
  };

  switch (path) {
    case "hero.headline":
      row.hero_headline = value;
      break;
    case "hero.subheadline":
      row.hero_subheadline = value;
      break;
    case "hero.image":
      row.hero_image_url = value;
      break;
    case "hero.cta_text":
      row.cta_text = value;
      break;
    case "hero.text_color":
      row.hero_text_color = value;
      break;
    case "hero.overlay_opacity":
      row.hero_overlay_opacity = value;
      break;
    case "about.company_name":
      row.about_company_name = value;
      break;
    case "about.tagline":
      row.about_tagline = value;
      break;
    case "about.text":
      row.about_text = value;
      break;
    case "about.image":
      row.about_image_url = value;
      break;
    case "footer.contact":
      row.footer_contact = value;
      break;
    case "footer.copyright":
      row.footer_copyright = value;
      break;
    default: {
      const sm = STAT_RE.exec(path);
      if (sm) {
        const i = Number(sm[1]);
        const f = sm[2] as "label" | "value";
        setArr("about_stats", i, f, value);
        break;
      }
      const sv = SVC_RE.exec(path);
      if (sv) {
        const i = Number(sv[1]);
        const f = sv[2] as "title" | "description" | "icon";
        setArr("services", i, f, value);
        break;
      }
      const pj = PRJ_RE.exec(path);
      if (pj) {
        const i = Number(pj[1]);
        const raw = pj[2];
        const f = raw === "image" ? "image_url" : raw;
        setArr("projects", i, f, value);
        break;
      }
      const ts = TST_RE.exec(path);
      if (ts) {
        const i = Number(ts[1]);
        const raw = ts[2];
        const f = raw === "avatar" ? "avatar_url" : raw;
        setArr("testimonials", i, f, value);
        break;
      }
      const so = SOC_RE.exec(path);
      if (so) {
        const key = so[1] as "facebook" | "instagram" | "linkedin" | "youtube";
        const cur =
          row.footer_socials && typeof row.footer_socials === "object"
            ? { ...(row.footer_socials as Record<string, unknown>) }
            : {};
        cur[key] = value;
        row.footer_socials = cur;
        break;
      }
    }
  }

  return row as T;
}
