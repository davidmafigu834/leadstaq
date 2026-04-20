import { createAdminClient } from "@/lib/supabase/admin";

/** Signed URL for private Supabase Storage objects (1 hour). */
export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) {
    console.error("[storage]", error.message);
    return null;
  }
  return data.signedUrl;
}
