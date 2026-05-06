import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId || !session?.clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("project_media")
    .select("id, file_size_bytes")
    .eq("client_id", session.clientId)
    .eq("type", "photo");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count: projectCount, error: projError } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("client_id", session.clientId);

  if (projError) return NextResponse.json({ error: projError.message }, { status: 500 });

  const totalPhotos = data?.length ?? 0;
  const totalBytes = data?.reduce((sum, m) => sum + (m.file_size_bytes ?? 0), 0) ?? 0;

  return NextResponse.json({
    total_projects: projectCount ?? 0,
    total_photos: totalPhotos,
    total_bytes: totalBytes,
  });
}
