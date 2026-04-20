import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAgencyAdmin } from "@/lib/require-agency-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAgencyAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry");
  const style = searchParams.get("style");
  const search = searchParams.get("search")?.trim() ?? "";
  const sort = searchParams.get("sort") || "curated";

  const supabase = createAdminClient();

  const { data: countsRows } = await supabase
    .from("landing_page_templates")
    .select("industry, style")
    .eq("is_published", true);

  const countsByIndustry: Record<string, number> = {};
  const countsByStyle: Record<string, number> = {};
  for (const r of countsRows ?? []) {
    const ind = String((r as { industry: string }).industry);
    const st = String((r as { style: string }).style);
    countsByIndustry[ind] = (countsByIndustry[ind] ?? 0) + 1;
    countsByStyle[st] = (countsByStyle[st] ?? 0) + 1;
  }

  let q = supabase
    .from("landing_page_templates")
    .select(
      "id, slug, name, description, industry, style, thumbnail_url, preview_url, is_premium, sort_order, created_at"
    )
    .eq("is_published", true);

  if (industry) q = q.eq("industry", industry);
  if (style) q = q.eq("style", style);
  if (search) {
    const esc = search.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    q = q.or(`name.ilike.%${esc}%,description.ilike.%${esc}%`);
  }

  if (sort === "newest") {
    q = q.order("created_at", { ascending: false });
  } else if (sort === "popular") {
    q = q.order("created_at", { ascending: false });
  } else {
    q = q.order("sort_order", { ascending: true });
    q = q.order("created_at", { ascending: false });
  }

  const { data: templates, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    templates: templates ?? [],
    countsByIndustry,
    countsByStyle,
    totalPublished: countsRows?.length ?? 0,
  });
}
