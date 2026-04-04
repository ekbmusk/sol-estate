"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "И��л", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1E2B26] bg-[#131A17] px-3 py-2 text-[12px] shadow-xl">
      <p className="text-[#8A9B94] mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#F0F5F3] font-mono-data">{p.value} т</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  totalCredits: number;
  creditsRetired: number;
  projectId: string;
}

export default function ProjectChart({ totalCredits, creditsRetired, projectId }: Props) {
  const data = useMemo(() => {
    // Seeded pseudo-random based on projectId for consistent data
    let seed = 0;
    for (let i = 0; i < projectId.length; i++) seed = (seed * 31 + projectId.charCodeAt(i)) | 0;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    const monthlyIssued = totalCredits / 12;
    const monthlyRetired = creditsRetired / 12;

    return MONTHS.map((m) => ({
      month: m,
      issued: Math.round(monthlyIssued * (0.7 + rand() * 0.6)),
      retired: Math.round(monthlyRetired * (0.3 + rand() * 1.4)),
    }));
  }, [totalCredits, creditsRetired, projectId]);

  return (
    <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label-upper">Динамика кредитов</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-[#8A9B94]">Выпущено</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
            <span className="text-[#8A9B94]">Погашено</span>
          </div>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2B26" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#5A6D65", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1E2B26" }}
            />
            <YAxis
              tick={{ fill: "#5A6D65", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(52,211,153,0.05)" }} />
            <Bar dataKey="issued" fill="#34D399" radius={[3, 3, 0, 0]} />
            <Bar dataKey="retired" fill="#FBBF24" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
