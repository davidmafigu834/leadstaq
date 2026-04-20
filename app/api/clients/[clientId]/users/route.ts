import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/lib/api-guards";
import { hashPassword } from "@/lib/password";
import { normalizeToE164 } from "@/lib/phone-validate";

export const dynamic = "force-dynamic";

/** Active salespeople for reassignment pickers (agency admin). */
export async function GET(_req: Request, { params }: { params: { clientId: string } }) {
  const g = await requireRoles(["AGENCY_ADMIN"]);
  if ("error" in g) return g.error;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name")
    .eq("client_id", params.clientId)
    .eq("role", "SALESPERSON")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] });
}

const inviteSalesSchema = z.object({
  role: z.enum(["SALESPERSON", "CLIENT_MANAGER"]),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(32),
});

export async function POST(req: Request, { params }: { params: { clientId: string } }) {
  const g = await requireRoles(["AGENCY_ADMIN"]);
  if ("error" in g) return g.error;

  const parsed = inviteSalesSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const phoneNorm = normalizeToE164(parsed.data.phone);
  if (!phoneNorm) {
    return NextResponse.json(
      { error: "Phone number looks invalid. Use international format like +263 77 123 4567." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: client } = await supabase.from("clients").select("id").eq("id", params.clientId).maybeSingle();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { data: dupe } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (dupe) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  let rr = 0;
  if (parsed.data.role === "SALESPERSON") {
    const { data: maxRow } = await supabase
      .from("users")
      .select("round_robin_order")
      .eq("client_id", params.clientId)
      .eq("role", "SALESPERSON")
      .order("round_robin_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    rr = Number((maxRow as { round_robin_order?: number } | null)?.round_robin_order ?? -1) + 1;
  }

  if (parsed.data.role === "CLIENT_MANAGER") {
    await supabase.from("users").update({ is_active: false }).eq("client_id", params.clientId).eq("role", "CLIENT_MANAGER");
  }

  const tempPass = randomBytes(12).toString("base64url").slice(0, 16);
  const hash = await hashPassword(tempPass);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name: parsed.data.name.trim(),
      email,
      phone: phoneNorm,
      password: hash,
      role: parsed.data.role,
      client_id: params.clientId,
      is_active: true,
      round_robin_order: parsed.data.role === "SALESPERSON" ? rr : 0,
    })
    .select("id, name, email, phone, role")
    .single();

  if (error) {
    console.error("[client users POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user,
    temporaryPassword: tempPass,
  });
}
