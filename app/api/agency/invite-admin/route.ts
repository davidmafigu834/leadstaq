import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/lib/api-guards";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
});

export async function POST(req: Request) {
  const g = await requireRoles(["AGENCY_ADMIN"]);
  if ("error" in g) return g.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
  }

  const tempPass = randomBytes(12).toString("base64url").slice(0, 16);
  const hash = await hashPassword(tempPass);

  const { data: row, error } = await supabase
    .from("users")
    .insert({
      name: parsed.data.name?.trim() || email.split("@")[0],
      email,
      password: hash,
      role: "AGENCY_ADMIN",
      client_id: null,
      is_active: true,
    })
    .select("id, email, name")
    .single();

  if (error) {
    console.error("[invite-admin]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user: row,
    temporaryPassword: tempPass,
    message: "Share this password with the new admin once. They should change it after signing in.",
  });
}
