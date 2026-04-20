import { AgencyLayout } from "@/components/layouts/AgencyLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { CampaignsDashboard } from "@/components/campaigns/CampaignsDashboard";

export default async function CampaignsPage() {
  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <AgencyLayout breadcrumb="AGENCY / CAMPAIGNS" pageTitle="Campaigns" hideShellHeader>
      <CampaignsDashboard allClients={(clients ?? []) as { id: string; name: string }[]} />
    </AgencyLayout>
  );
}
