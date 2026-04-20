import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LandingPageBuilder } from "./LandingPageBuilder";

export default async function LandingBuilderPage({ params }: { params: { clientId: string } }) {
  const supabase = createAdminClient();
  const { data: client } = await supabase.from("clients").select("name, slug").eq("id", params.clientId).maybeSingle();
  if (!client) notFound();
  const { data: landing } = await supabase.from("landing_pages").select("*").eq("client_id", params.clientId).maybeSingle();
  let lockedTemplate: Record<string, unknown> | null = null;
  const lr = landing as { is_locked_template?: boolean; applied_template_id?: string } | null;
  if (lr?.is_locked_template && lr.applied_template_id) {
    const { data: tpl } = await supabase.from("landing_page_templates").select("*").eq("id", lr.applied_template_id).maybeSingle();
    if (tpl && (tpl as { is_locked?: boolean }).is_locked) lockedTemplate = tpl as Record<string, unknown>;
  }

  const { count: publishedTemplateCount } = await supabase
    .from("landing_page_templates")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  const templateCount = publishedTemplateCount ?? 0;
  const landingRow = landing as { updated_at?: string } | null;
  const builderKey = String(landingRow?.updated_at ?? `new-${params.clientId}`);

  return (
    <LandingPageBuilder
      clientId={params.clientId}
      slug={client.slug as string}
      clientName={client.name as string}
      initial={landing ?? {}}
      templateCount={templateCount}
      builderKey={builderKey}
      lockedTemplate={lockedTemplate}
    />
  );
}
