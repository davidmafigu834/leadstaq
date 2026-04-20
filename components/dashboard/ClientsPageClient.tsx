"use client";

import { useState } from "react";
import Link from "next/link";
import { ClientAvatar } from "@/components/ClientAvatar";
import { CreateClientModal } from "@/components/dashboard/CreateClientModal";

export type ClientsPageListRow = { id: string; name: string; industry: string };

export function ClientsPageClient({ clients }: { clients: ClientsPageListRow[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
          New client
        </button>
      </div>
      <CreateClientModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <div className="grid gap-4 md:grid-cols-2 layout:grid-cols-3">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/clients/${c.id}`}
            className="group flex items-center gap-4 border border-border bg-surface-card p-5 transition-colors hover:border-border-strong hover:bg-surface-card-alt"
          >
            <ClientAvatar name={c.name} />
            <div>
              <div className="font-display text-lg text-ink-primary">{c.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">{c.industry}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
