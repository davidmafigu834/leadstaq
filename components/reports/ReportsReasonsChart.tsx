"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const GRAY = "#e8e6df";
const BAR_FILLS = ["#d4ff4f", "#c8e085", "#b8c49a", "#a8a894", "#989888"];

export function ReportsReasonsChart({ rows }: { rows: Array<{ reason: string; count: number }> }) {
  const top = rows.slice(0, 5);

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="reason"
            width={120}
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              backgroundColor: "var(--surface-sidebar)",
              border: "1px solid var(--surface-sidebar-border)",
              color: "var(--text-on-dark)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
            {top.map((_, i) => (
              <Cell key={i} fill={BAR_FILLS[i] ?? GRAY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
