import { notFound } from "next/navigation";
import { AgencyLayout } from "@/components/layouts/AgencyLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadClientHeroContext } from "@/lib/client-hero";
import { ClientDetailView } from "../ClientDetailView";
import { getPublicLandingPageUrl } from "@/lib/public-url";

export default async function ClientTeamPage({ params }: { params: { clientId: string } }) {
  const supabase = createAdminClient();
  const ctx = await loadClientHeroContext(params.clientId);
  if (!ctx) notFound();
  const { client, hero } = ctx;
  const { data: users } = await supabase
    .from("users")
    .select("name, role, email")
    .eq("client_id", params.clientId)
    .eq("is_active", true);

  return (
    <AgencyLayout breadcrumb="AGENCY / TEAM" pageTitle={client.name as string}>
      <ClientDetailView
        clientId={params.clientId}
        name={client.name as string}
        industry={client.industry as string}
        publicLandingUrl={getPublicLandingPageUrl(client.slug as string)}
        hero={hero}
      >
        <div className="border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-card-alt font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.email as string} className="border-t border-border hover:bg-surface-card-alt">
                  <td className="px-4 py-3 font-medium">{u.name as string}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{u.role as string}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{u.email as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClientDetailView>
    </AgencyLayout>
  );
}
