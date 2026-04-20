import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX = 5 * 1024 * 1024;
const FOLDERS = new Set(["hero", "about", "projects", "testimonials", "og"]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.role !== "AGENCY_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "hero");
  const clientId = String(form.get("clientId") ?? "");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  if (!FOLDERS.has(folderRaw)) return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  if (!(file instanceof Blob)) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File too large" }, { status: 400 });
  const type = file.type;
  if (!ALLOWED.has(type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: client, error: cErr } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (cErr || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${clientId}/${folderRaw}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("landing-page-images").upload(path, buf, {
    contentType: type,
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("landing-page-images").getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl });
}
