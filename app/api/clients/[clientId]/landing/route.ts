import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from "@/lib/landing-constants";
import { landingPatchSchema } from "@/lib/landing-schema";
import { lockedNorthfieldLandingPatchSchema } from "@/lib/landing-locked-patch-schema";

export async function PATCH(req: Request, { params }: { params: { clientId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.role !== "AGENCY_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.json();
  const supabase = createAdminClient();

  const { data: existing, error: exErr } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("client_id", params.clientId)
    .maybeSingle();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  const isLocked = Boolean(existing?.is_locked_template);

  if (isLocked) {
    const lockedParsed = lockedNorthfieldLandingPatchSchema.safeParse(raw);
    if (!lockedParsed.success) {
      return NextResponse.json({ error: lockedParsed.error.flatten() }, { status: 400 });
    }
    const b = lockedParsed.data;
    const payload = {
      ...(existing as Record<string, unknown>),
      client_id: params.clientId,
      template_content: b.template_content,
      template_theme: b.template_theme,
      published: b.published ?? (existing as { published?: boolean }).published,
      seo_title: b.seo_title !== undefined ? b.seo_title : (existing as { seo_title?: string | null }).seo_title,
      seo_description:
        b.seo_description !== undefined ? b.seo_description : (existing as { seo_description?: string | null }).seo_description,
      og_image_url: b.og_image_url !== undefined ? b.og_image_url : (existing as { og_image_url?: string | null }).og_image_url,
      custom_domain:
        b.custom_domain !== undefined
          ? b.custom_domain === ""
            ? null
            : b.custom_domain
          : (existing as { custom_domain?: string | null }).custom_domain,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("landing_pages")
      .upsert(payload, { onConflict: "client_id" })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ landing: data });
  }

  const parsed = landingPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const visibility = {
    ...DEFAULT_SECTION_VISIBILITY,
    ...(body.section_visibility ?? {}),
  };

  const payload = {
    client_id: params.clientId,
    ...body,
    section_order: body.section_order ?? DEFAULT_SECTION_ORDER,
    section_visibility: visibility,
    custom_domain: body.custom_domain === "" ? null : body.custom_domain,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("landing_pages").upsert(payload, { onConflict: "client_id" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ landing: data });
}
