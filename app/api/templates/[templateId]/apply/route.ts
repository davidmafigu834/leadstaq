import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmptyLandingValue, pickContentFields } from "@/lib/landing-content-fields";
import { pickTemplateSnapshot, TEMPLATE_SNAPSHOT_FIELDS } from "@/lib/template-snapshot-fields";
import { requireAgencyAdmin } from "@/lib/require-agency-admin";
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from "@/lib/landing-constants";
import { northfieldContentSchema, northfieldThemeSchema } from "@/lib/templates/northfield/schema";
import { NORTHFIELD_DEFAULT_CONTENT, NORTHFIELD_DEFAULT_THEME } from "@/lib/templates/northfield/defaults";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clientId: z.string().uuid(),
  merge: z.enum(["replace", "fill_empty"]).optional().default("replace"),
});

function emptyFooterSocials() {
  return { enabled: false, facebook: "", instagram: "", linkedin: "", youtube: "" };
}

export async function POST(req: Request, { params }: { params: { templateId: string } }) {
  const auth = await requireAgencyAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { clientId, merge } = parsed.data;

  const supabase = createAdminClient();

  const { data: client, error: cErr } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (cErr || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: template, error: tErr } = await supabase
    .from("landing_page_templates")
    .select("*")
    .eq("id", params.templateId)
    .maybeSingle();
  if (tErr || !template || !template.is_published) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const templateRow = template as Record<string, unknown>;
  const isLocked = Boolean(templateRow.is_locked);

  const { data: existing } = await supabase.from("landing_pages").select("*").eq("client_id", clientId).maybeSingle();
  const existingRow = (existing ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const published = (existingRow.published as boolean | null | undefined) ?? false;

  let payload: Record<string, unknown>;

  if (isLocked) {
    const backup = existing ? pickContentFields(existingRow) : null;
    const rawC = templateRow.default_content;
    const rawT = templateRow.default_theme;
    const c = northfieldContentSchema.safeParse(rawC ?? NORTHFIELD_DEFAULT_CONTENT);
    const t = northfieldThemeSchema.safeParse(rawT ?? NORTHFIELD_DEFAULT_THEME);
    const base = existing ? { ...existingRow } : { client_id: clientId, published: false };
    payload = {
      ...base,
      client_id: clientId,
      published,
      is_locked_template: true,
      template_content: c.success ? c.data : NORTHFIELD_DEFAULT_CONTENT,
      template_theme: t.success ? t.data : NORTHFIELD_DEFAULT_THEME,
      applied_template_id: params.templateId,
      applied_template_at: now,
      content_backup: backup,
      updated_at: now,
    };
    for (const k of TEMPLATE_SNAPSHOT_FIELDS) {
      if (k === "section_order") payload[k] = [...DEFAULT_SECTION_ORDER];
      else if (k === "section_visibility") payload[k] = { ...DEFAULT_SECTION_VISIBILITY };
      else if (k === "services" || k === "projects" || k === "testimonials" || k === "about_stats") payload[k] = [];
      else if (k === "footer_socials") payload[k] = emptyFooterSocials();
      else if (k === "hero_text_color") payload[k] = "light";
      else if (k === "hero_overlay_opacity") payload[k] = 40;
      else if (k === "font_choice") payload[k] = "instrument-serif";
      else if (k === "primary_color") payload[k] = (t.success ? t.data.primary_color : NORTHFIELD_DEFAULT_THEME.primary_color) as string;
      else payload[k] = null;
    }
  } else if (merge === "replace") {
    const templateData = pickTemplateSnapshot(templateRow);
    const backup = existing ? pickContentFields(existingRow) : null;
    if (existing) {
      payload = {
        ...existingRow,
        ...templateData,
        is_locked_template: false,
        template_content: null,
        template_theme: null,
        client_id: clientId,
        published,
        content_backup: backup,
        applied_template_id: params.templateId,
        applied_template_at: now,
        updated_at: now,
      };
    } else {
      payload = {
        client_id: clientId,
        published: false,
        is_locked_template: false,
        template_content: null,
        template_theme: null,
        ...templateData,
        content_backup: null,
        applied_template_id: params.templateId,
        applied_template_at: now,
        updated_at: now,
      };
    }
  } else {
    const templateData = pickTemplateSnapshot(templateRow);
    if (!existing) {
      payload = {
        client_id: clientId,
        published: false,
        is_locked_template: false,
        template_content: null,
        template_theme: null,
        ...templateData,
        applied_template_id: params.templateId,
        applied_template_at: now,
        updated_at: now,
      };
    } else {
      payload = { ...existingRow, client_id: clientId, published, updated_at: now };
      for (const k of TEMPLATE_SNAPSHOT_FIELDS) {
        const tplVal = templateData[k as string];
        const existingValue = existingRow[k as string];
        if (isEmptyLandingValue(existingValue) && tplVal !== null && tplVal !== undefined) {
          payload[k as string] = tplVal;
        }
      }
      payload.is_locked_template = false;
      payload.template_content = null;
      payload.template_theme = null;
      payload.applied_template_id = params.templateId;
      payload.applied_template_at = now;
    }
  }

  const { data: landing, error: uErr } = await supabase
    .from("landing_pages")
    .upsert(payload, { onConflict: "client_id" })
    .select("*")
    .single();
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, landing });
}
