import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/lib/api-guards";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderedUserIds: z.array(z.string().uuid()),
});

export async function PATCH(req: Request, { params }: { params: { clientId: string } }) {
  const g = await requireRoles(["AGENCY_ADMIN"]);
  if ("error" in g) return g.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ids = parsed.data.orderedUserIds;

  const { data: sales } = await supabase
    .from("users")
    .select("id")
    .eq("client_id", params.clientId)
    .eq("role", "SALESPERSON")
    .eq("is_active", true);

  const valid = new Set((sales ?? []).map((s) => s.id as string));
  if (ids.length !== valid.size || ids.some((id) => !valid.has(id))) {
    return NextResponse.json({ error: "Ordered list must include each salesperson exactly once" }, { status: 400 });
  }

  for (let i = 0; i < ids.length; i++) {
    await supabase.from("users").update({ round_robin_order: i }).eq("id", ids[i]);
  }

  return NextResponse.json({ ok: true });
}
