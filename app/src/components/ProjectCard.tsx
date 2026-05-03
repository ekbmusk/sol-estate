"use client";

import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/mockData";
import { localeToBcp47 } from "@/lib/format";

const TYPE_COLORS: Record<Project["projectType"], { bg: string; text: string; glow: string }> = {
  solar: { bg: "rgba(251,191,36,0.12)", text: "#FBBF24", glow: "rgba(251,191,36,0.08)" },
  wind: { bg: "rgba(96,165,250,0.12)", text: "#60A5FA", glow: "rgba(96,165,250,0.08)" },
  forest: { bg: "rgba(52,211,153,0.12)", text: "#34D399", glow: "rgba(52,211,153,0.08)" },
  industrial: { bg: "rgba(167,139,250,0.12)", text: "#A78BFA", glow: "rgba(167,139,250,0.08)" },
  other: { bg: "rgba(148,163,184,0.12)", text: "#94A3B8", glow: "rgba(148,163,184,0.08)" },
};

const STATUS_COLORS: Record<Project["status"], string> = {
  active: "#34D399",
  funded: "#FBBF24",
  retired: "#5A6D65",
};

export default function ProjectCard({ project }: { project: Project }) {
  const t = useTranslations("card");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const fmt = (n: number) => n.toLocaleString(bcp);
  const tenge = tCommon("units.tenge");

  const progress = Math.round((project.sharesSold / project.totalShares) * 100);
  const typeColor = TYPE_COLORS[project.projectType];
  const typeLabel = t(`types.${project.projectType}` as "types.solar");
  const statusColor = STATUS_COLORS[project.status];
  const statusLabel = t(`status.${project.status}` as "status.active");

  return (
    <Link href={`/project/${project.id}`}>
      <div
        className={`group rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden
          ${project.id === "ses-yasavi"
            ? "border border-[#FBBF24]/30 bg-[#0C1210] hover:border-[#FBBF24]/50 ring-1 ring-[#FBBF24]/10"
            : "border border-[#1E2B26] bg-[#0C1210] hover:border-[#2A3832]"}`}
        style={{ ["--type-glow" as string]: typeColor.glow }}
      >
        {project.id === "ses-yasavi" && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(251,191,36,0.06) 0%, transparent 60%)",
          }} />
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-[0.05em]"
              style={{ background: typeColor.bg, color: typeColor.text }}
            >
              {typeLabel}
            </span>
            {project.id === "ses-yasavi" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-[9px] font-semibold text-[#FBBF24] uppercase tracking-[0.05em]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-pulse" />
                {t("liveMonitoring")}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <span className="text-[11px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
          </span>
        </div>

        <h3 className="font-heading text-[16px] font-semibold tracking-[-0.01em] mb-1 group-hover:text-[#F0F5F3] transition-colors">
          {project.name}
        </h3>
        <p className="text-[12px] text-[#5A6D65] mb-5">
          {project.location}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] px-3 py-2.5">
            <p className="label-upper mb-1">{t("pricePerShare")}</p>
            <p className="font-mono-data text-[14px] font-medium text-[#F0F5F3]">
              {fmt(project.pricePerShare)} {tenge}
            </p>
          </div>
          <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] px-3 py-2.5">
            <p className="label-upper mb-1">{t("co2PerYear")}</p>
            <p className="font-mono-data text-[14px] font-medium text-[#34D399]">
              {fmt(project.totalCredits)} {t("tonneShort")}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[#5A6D65]">
              {fmt(project.sharesSold)} / {fmt(project.totalShares)}
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

        {project.id === "ses-yasavi" ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[13px] font-semibold text-[#FBBF24]">
              {t("more")}
              <ArrowUpRight size={14} strokeWidth={2} />
            </div>
            <span className="text-[10px] text-[#FBBF24]/60 uppercase tracking-wider">{t("realProject")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[13px] font-medium text-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {t("invest")}
            <ArrowUpRight size={14} strokeWidth={2} />
          </div>
        )}
      </div>
    </Link>
  );
}
