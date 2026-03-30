"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/mockData";

const typeConfig: Record<Project["projectType"], { label: string; bg: string; text: string; glow: string }> = {
  solar: { label: "Солнечная", bg: "rgba(251,191,36,0.12)", text: "#FBBF24", glow: "rgba(251,191,36,0.08)" },
  wind: { label: "Ветровая", bg: "rgba(96,165,250,0.12)", text: "#60A5FA", glow: "rgba(96,165,250,0.08)" },
  forest: { label: "Лес", bg: "rgba(52,211,153,0.12)", text: "#34D399", glow: "rgba(52,211,153,0.08)" },
  industrial: { label: "Промышл.", bg: "rgba(167,139,250,0.12)", text: "#A78BFA", glow: "rgba(167,139,250,0.08)" },
  other: { label: "Другое", bg: "rgba(148,163,184,0.12)", text: "#94A3B8", glow: "rgba(148,163,184,0.08)" },
};

const statusConfig: Record<Project["status"], { label: string; color: string }> = {
  active: { label: "Активный", color: "#34D399" },
  funded: { label: "Собран", color: "#FBBF24" },
  retired: { label: "Завершён", color: "#5A6D65" },
};

export default function ProjectCard({ project }: { project: Project }) {
  const progress = Math.round((project.sharesSold / project.totalShares) * 100);
  const type = typeConfig[project.projectType];
  const status = statusConfig[project.status];

  return (
    <Link href={`/project/${project.id}`}>
      <div
        className="group rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5 transition-all duration-200 hover:border-[#2A3832] hover:-translate-y-0.5"
        style={{ ["--type-glow" as string]: type.glow }}
      >
        {/* Header: type badge + status */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-[0.05em]"
            style={{ background: type.bg, color: type.text }}
          >
            {type.label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
            <span className="text-[11px] font-medium" style={{ color: status.color }}>{status.label}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-[16px] font-semibold tracking-[-0.01em] mb-1 group-hover:text-[#F0F5F3] transition-colors">
          {project.name}
        </h3>
        <p className="text-[12px] text-[#5A6D65] mb-5">
          {project.location}
        </p>

        {/* Data grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] px-3 py-2.5">
            <p className="label-upper mb-1">Цена/доля</p>
            <p className="font-mono-data text-[14px] font-medium text-[#F0F5F3]">
              {project.pricePerShare.toLocaleString("ru-RU")} &#x20B8;
            </p>
          </div>
          <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] px-3 py-2.5">
            <p className="label-upper mb-1">CO&#x2082;/year</p>
            <p className="font-mono-data text-[14px] font-medium text-[#34D399]">
              {project.totalCredits.toLocaleString("ru-RU")} t
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#5A6D65]">
              {project.sharesSold.toLocaleString("ru-RU")} / {project.totalShares.toLocaleString("ru-RU")}
            </span>
            <span className="font-mono-data text-[11px] text-[#8A9B94]">{progress}%</span>
          </div>
          <div className="h-[3px] rounded-full bg-[#1E2B26] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#34D399] animate-progress"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-[13px] font-medium text-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Инвестировать
          <ArrowUpRight size={14} strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}
