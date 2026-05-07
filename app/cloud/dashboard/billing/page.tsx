"use client";

import { useEffect, useState } from "react";
import { Check, Zap, Building2, Rocket, Loader2 } from "lucide-react";

type Plan = { id: string; name: string; price: string; storage: string; features: string[]; icon: React.ElementType; accent: string };

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    storage: "5 GB",
    icon: Zap,
    accent: "text-[#666660]",
    features: ["5 GB storage", "10 projects", "Public portfolio page", "Project share links", "1 team member"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$29",
    storage: "50 GB",
    icon: Rocket,
    accent: "text-[#3D7A00]",
    features: ["50 GB storage", "Unlimited projects", "Logo watermarking", "Priority support", "5 team members", "Analytics"],
  },
  {
    id: "business",
    name: "Business",
    price: "$79",
    storage: "200 GB",
    icon: Building2,
    accent: "text-[#1A4A7A]",
    features: ["200 GB storage", "Unlimited projects & team", "Custom domain", "White-label portfolio", "Advanced analytics", "Dedicated support"],
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cloud/storage/usage")
      .then((r) => r.json())
      .then((d: { plan?: string }) => setCurrentPlan(d.plan ?? "free"))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planCardStyles: Record<string, { gradient: string; border: string; text: string; subtext: string; checkColor: string }> = {
    free:         { gradient: "bg-gradient-to-br from-[#F8F8F4] via-[#F0F0EA] to-[#E8E8E0]", border: "border-[#D0D0C0]/40", text: "text-[#0a0a0a]", subtext: "text-[#666660]", checkColor: "text-[#666660]" },
    professional: { gradient: "bg-gradient-to-br from-[#F8FFF0] via-[#EFFFDC] to-[#DCFFB8]", border: "border-[#B8F060]/40", text: "text-[#1A3D00]", subtext: "text-[#3D7A00]", checkColor: "text-[#3D7A00]" },
    business:     { gradient: "bg-gradient-to-br from-[#F0F8FF] via-[#DCF0FF] to-[#C4E4FF]", border: "border-[#7BC8FF]/40", text: "text-[#001A3D]", subtext: "text-[#1A4A7A]", checkColor: "text-[#1A4A7A]" },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-cloud-body px-5 py-4 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="font-cloud-display text-[22px] text-[#0a0a0a]">Billing</p>
          <p className="mt-0.5 text-[13px] text-[#999990] font-cloud-body">Manage your plan and storage.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-[#0a0a0a]/20" />
          </div>
        ) : (
          <>
            {currentPlan !== "free" && (
              <div className="mb-6 rounded-[20px] border border-[#D0D0C0]/40 bg-gradient-to-br from-[#F8F8F4] via-[#F0F0EA] to-[#E8E8E0] p-5">
                <p className="mb-0.5 text-[10px] font-bold tracking-[0.08em] text-[#999990] uppercase font-cloud-body">Current plan</p>
                <p className="font-cloud-display text-[20px] text-[#0a0a0a] capitalize">{currentPlan}</p>
                <p className="mt-1 text-[12px] text-[#999990] font-cloud-body">Your next billing date and invoice history will appear here.</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => {
                const isActive = plan.id === currentPlan;
                const Icon = plan.icon;
                const s = planCardStyles[plan.id] ?? planCardStyles.free;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-[20px] border p-5 transition-all ${s.gradient} ${s.border} ${isActive ? "ring-2 ring-[#D4FF4F] ring-offset-2 ring-offset-[#F5F5F0]" : ""}`}
                  >
                    {isActive && (
                      <span className="absolute right-4 top-4 rounded-full bg-[#D4FF4F] px-2 py-0.5 text-[11px] font-bold text-black font-cloud-body">
                        Current
                      </span>
                    )}
                    <div className="mb-4 flex items-center gap-2.5">
                      <Icon className={`h-5 w-5 ${plan.accent}`} strokeWidth={1.5} />
                      <span className={`text-[15px] font-semibold font-cloud-body ${s.text}`}>{plan.name}</span>
                    </div>
                    <div className="mb-5">
                      <span className={`font-cloud-display text-[32px] ${s.text}`}>{plan.price}</span>
                      {plan.id !== "free" && <span className={`ml-1 text-[13px] font-cloud-body ${s.subtext}`}>/ mo</span>}
                    </div>
                    <ul className="mb-6 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-[13px] font-cloud-body ${s.subtext}`}>
                          <Check className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${s.checkColor}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isActive && (
                      <button
                        disabled
                        className="mt-auto w-full rounded-xl border border-black/[0.1] bg-white/50 py-2.5 text-[13px] font-semibold text-[#999990] transition-colors disabled:cursor-not-allowed font-cloud-body"
                        title="Billing coming soon"
                      >
                        {plan.id === "free" ? "Downgrade" : "Upgrade"} — coming soon
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[20px] border border-[#D0D0C0]/40 bg-gradient-to-br from-[#F8F8F4] via-[#F0F0EA] to-[#E8E8E0] p-5">
              <p className="text-[12px] font-bold text-[#666660] tracking-[0.06em] uppercase mb-1 font-cloud-body">Payment history</p>
              <p className="text-[13px] text-[#999990] font-cloud-body">No payment history yet. Your invoices will appear here once billing is active.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
