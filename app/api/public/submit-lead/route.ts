import { NextResponse } from "next/server";
import { createLead } from "@/lib/leads/createLead";

export async function POST(req: Request) {
  const { clientId, formData } = await req.json() as {
    clientId: string;
    formData: Record<string, unknown>;
  };

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const result = await createLead({
    clientId,
    source: "LANDING_PAGE",
    formData: formData ?? {},
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, leadId: result.leadId });
}
