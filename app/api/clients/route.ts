import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/lib/api-guards";
import { getDefaultResponseHoursForNewClients } from "@/lib/agency-settings";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: Request) {
  const g = await requireRoles(["AGENCY_ADMIN"]);
  if ("error" in g) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: taken } = await supabase.from("clients").select("id").eq("slug", parsed.data.slug).maybeSingle();
  if (taken) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  const defaultHours = await getDefaultResponseHoursForNewClients();

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name.trim(),
      industry: parsed.data.industry.trim(),
      slug: parsed.data.slug.trim(),
      response_time_limit_hours: defaultHours,
    })
    .select("*")
    .single();

  if (error || !client) {
    console.error("[POST /api/clients]", error);
    return NextResponse.json({ error: error?.message ?? "Failed to create client" }, { status: 500 });
  }

  await supabase.from("form_schemas").insert({
    client_id: client.id as string,
    form_title: "Contact us",
    fields: [],
  });

  await supabase.from("landing_pages").insert({
    client_id: client.id as string,
    published: false,
    primary_color: (client as { primary_color?: string }).primary_color ?? "#00D4FF",
    font_choice: "inter",
  });

  return NextResponse.json({ client });
}
