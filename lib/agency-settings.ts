import { createAdminClient } from "@/lib/supabase/admin";

export type AgencySettingsRow = {
  id: string;
  agency_name: string | null;
  logo_url: string | null;
  default_response_time_limit_hours: number;
  default_currency: string;
  default_timezone: string;
  terms_url: string | null;
  privacy_url: string | null;
  updated_at: string;
};

export async function getAgencySettings(): Promise<AgencySettingsRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("agency_settings").select("*").eq("id", "singleton").maybeSingle();
  if (error || !data) {
    return {
      id: "singleton",
      agency_name: null,
      logo_url: null,
      default_response_time_limit_hours: 2,
      default_currency: "USD",
      default_timezone: "America/New_York",
      terms_url: null,
      privacy_url: null,
      updated_at: new Date().toISOString(),
    };
  }
  return data as AgencySettingsRow;
}

export async function getDefaultResponseHoursForNewClients(): Promise<number> {
  const s = await getAgencySettings();
  return s.default_response_time_limit_hours ?? 2;
}
