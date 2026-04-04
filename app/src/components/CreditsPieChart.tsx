"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Project } from "@/lib/mockData";

const TYPE_COLORS: Record<string, string> = {
  solar: "#FBBF24",
  wind: "#60A5FA",
  forest: "#34D399",
  industrial: "#A78BFA",
  other: "#94A3B8",
};

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#1E2B26] bg-[#131A17] px-3 py-2 text-[12px] shadow-xl">
      <p className="text-[#8A9B94] mb-0.5">{d.name}</p>
      <p className="font-mono-data text-[#F0F5F3] font-medium">
        {d.value.toLocaleString("ru-RU")} тонн CO₂
      </p>
    </div>
  );
}

export default function CreditsPieChart({ projects }: { projects: Project[] }) {
  const data = projects.map((p) => ({
    name: p.name,
    value: p.totalCredits,
    color: TYPE_COLORS[p.projectType] ?? TYPE_COLORS.other,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
      <p className="label-upper mb-4">Кредиты по проектам</p>
      <div className="h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={78}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="font-mono-data text-[18px] font-semibold text-[#F0F5F3]">
              {total.toLocaleString("ru-RU")}
            </p>
            <p className="text-[10px] text-[#5A6D65]">тон�� CO₂</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-[#8A9B94] truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
