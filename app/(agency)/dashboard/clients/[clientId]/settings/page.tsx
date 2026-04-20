import { notFound } from "next/navigation";
import { AgencyLayout } from "@/components/layouts/AgencyLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAgencySettings } from "@/lib/agency-settings";
import { buildClientDetailHero } from "@/lib/client-hero";
import { ClientDetailView } from "../ClientDetailView";
import { getPublicLandingPageUrl } from "@/lib/public-url";
import { ClientSettingsClient } from "@/components/client-settings/ClientSettingsClient";

export default async function ClientSettingsPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { tab?: string };
}) {
  const supabase = createAdminClient();
  const agency = await getAgencySettings();
  const { data: client } = await supabase.from("clients").select("*").eq("id", params.clientId).maybeSingle();
  if (!client) notFound();

  const { data: landing } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("client_id", params.clientId)
    .maybeSingle();

  const { data: salespeople } = await supabase
    .from("users")
    .select("id, name, email, phone, is_active, round_robin_order")
    .eq("client_id", params.clientId)
    .eq("role", "SALESPERSON")
    .order("round_robin_order", { ascending: true });

  const { data: mgrs } = await supabase
    .from("users")
    .select("id, name, email, phone")
    .eq("client_id", params.clientId)
    .eq("role", "CLIENT_MANAGER")
    .eq("is_active", true)
    .limit(1);

  const hero = buildClientDetailHero(client as never, Boolean((landing as { published?: boolean } | null)?.published));
  const initialTab = typeof searchParams.tab === "string" ? searchParams.tab : undefined;

  return (
    <AgencyLayout
      hideShellHeader
      breadcrumb={`AGENCY / ${(client.name as string).toUpperCase()} / SETTINGS`}
      pageTitle={client.name as string}
    >
      <ClientDetailView
        clientId={params.clientId}
        name={client.name as string}
        industry={client.industry as string}
        publicLandingUrl={getPublicLandingPageUrl(client.slug as string)}
        hero={hero}
      >
        <ClientSettingsClient
          clientId={params.clientId}
          initialClient={client as Record<string, unknown>}
          initialLanding={(landing as Record<string, unknown> | null) ?? null}
          initialSalespeople={(salespeople ?? []) as never}
          initialManager={(mgrs?.[0] as never) ?? null}
          agencyDefaultHours={agency.default_response_time_limit_hours}
          initialTab={initialTab}
        />
      </ClientDetailView>
    </AgencyLayout>
  );
}
