import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/api-guards";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
}).refine((d) => /[0-9!@#$%^&*()_+\-=[\]{}|;:'",.<>/?]/.test(d.newPassword), {
  message: "Include at least one number or symbol",
  path: ["newPassword"],
});

export async function POST(req: Request) {
  const g = await requireSession();
  if ("error" in g) return g.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid password rules", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase.from("users").select("password, session_version").eq("id", g.session.userId).single();
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.password as string);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  const nextSv = Number((user as { session_version?: number }).session_version ?? 0) + 1;

  const { error } = await supabase
    .from("users")
    .update({ password: newHash, session_version: nextSv })
    .eq("id", g.session.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sessionVersion: nextSv });
}
