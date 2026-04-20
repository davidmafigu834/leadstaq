import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLead } from "@/lib/leads/createLead";
import { graphCall } from "@/lib/facebook/graph";
import { verifyFacebookSignature } from "@/lib/facebook/signature";
import { fbLog } from "@/lib/facebook/log";

type ClientRow = {
  id: string;
  fb_access_token: string;
};

type LeadgenPayload = {
  field_data?: { name: string; values: string[] }[];
};

async function processLead({ leadgen_id, client }: { leadgen_id: string; client: ClientRow }) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("client_id", client.id)
    .eq("facebook_lead_id", leadgen_id)
    .maybeSingle();

  if (existing) {
    fbLog("fb.lead.duplicate", { leadgen_id, clientId: client.id, existingLeadId: existing.id });
    return;
  }

  const fields = encodeURIComponent("field_data,created_time");
  const graphRes = await graphCall<LeadgenPayload>(`/${leadgen_id}?fields=${fields}`, client.fb_access_token, {
    clientId: client.id,
  });

  if (!graphRes.ok) {
    fbLog("fb.lead.fetch_failed", {
      leadgen_id,
      clientId: client.id,
      message: graphRes.error.message,
      tokenExpired: graphRes.tokenExpired,
    });
    return;
  }

  fbLog("fb.lead.fetched", { leadgen_id, clientId: client.id });

  const formData: Record<string, string> = {};
  for (const field of graphRes.data.field_data || []) {
    if (field.name && field.values?.[0] != null && field.values[0] !== "") {
      formData[field.name] = field.values[0];
    }
  }

  const created = await createLead({
    clientId: client.id,
    source: "FACEBOOK",
    formData,
    facebookLeadId: leadgen_id,
  });

  if (!created.ok) {
    fbLog("fb.lead.submit_failed", { leadgen_id, clientId: client.id, error: created.error, code: created.code });
    return;
  }

  if (created.duplicate) {
    fbLog("fb.lead.duplicate", { leadgen_id, clientId: client.id, existingLeadId: created.leadId });
  } else {
    fbLog("fb.lead.created", { leadId: created.leadId, clientId: client.id, leadgen_id });
  }

  if (!created.duplicate) {
    await supabase
      .from("clients")
      .update({ last_lead_received_at: new Date().toISOString() })
      .eq("id", client.id);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    fbLog("fb.webhook.verified", { mode });
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-hub-signature-256");
  const rawBody = await req.text();

  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    console.error("[fb webhook] FACEBOOK_APP_SECRET not configured");
    return new Response("Misconfigured", { status: 500 });
  }

  if (!verifyFacebookSignature(rawBody, signature, appSecret)) {
    fbLog("fb.webhook.signature_failed", { signaturePrefix: signature?.slice(0, 16) ?? null });
    return new Response("Invalid signature", { status: 403 });
  }

  let payload: {
    object?: string;
    entry?: { changes?: { field?: string; value?: { leadgen_id?: string; page_id?: string | number; form_id?: string | number } }[] }[];
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.object !== "page") {
    fbLog("fb.webhook.object_mismatch", { object: payload.object });
    return new Response("OK", { status: 200 });
  }

  fbLog("fb.webhook.received", { entries: payload.entry?.length ?? 0 });

  const supabase = createAdminClient();

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;

        const value = change.value || {};
        const leadgen_id = value.leadgen_id != null ? String(value.leadgen_id) : "";
        const page_id = value.page_id != null ? String(value.page_id) : "";
        const form_id = value.form_id != null ? String(value.form_id) : "";

        if (!leadgen_id || !page_id || !form_id) {
          fbLog("fb.webhook.malformed", { value });
          continue;
        }

        const { data: client, error } = await supabase
          .from("clients")
          .select("id, fb_access_token, fb_page_id, fb_form_id")
          .eq("fb_page_id", page_id)
          .eq("fb_form_id", form_id)
          .not("fb_access_token", "is", null)
          .maybeSingle();

        if (error) {
          console.error("[fb webhook] client lookup failed:", error);
          continue;
        }

        if (!client?.fb_access_token) {
          fbLog("fb.webhook.no_client_match", { page_id, form_id });
          continue;
        }

        await processLead({
          leadgen_id,
          client: client as ClientRow,
        });
      }
    }
  } catch (e) {
    console.error("[fb webhook] handler error", e);
  }

  return new Response("OK", { status: 200 });
}
