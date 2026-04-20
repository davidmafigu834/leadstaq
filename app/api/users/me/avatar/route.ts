import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/api-guards";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png"]);

export async function POST(req: Request) {
  const g = await requireSession();
  if ("error" in g) return g.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Expected multipart field file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  const type = file.type;
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Only JPG and PNG allowed" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ext = type === "image/png" ? "png" : "jpg";
  const path = `${g.session.userId}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("avatars").upload(path, buf, {
    contentType: type,
    upsert: true,
  });

  if (upErr) {
    console.error("[avatar upload]", upErr);
    return NextResponse.json(
      { error: "Storage upload failed — ensure the `avatars` bucket exists in Supabase Storage." },
      { status: 500 }
    );
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = pub.publicUrl;

  const { error: dbErr } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", g.session.userId);
  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}
