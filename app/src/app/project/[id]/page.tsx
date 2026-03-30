"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import InvestModal from "@/components/InvestModal";
import DividendWidget from "@/components/DividendWidget";
import { mockProjects } from "@/lib/mockData";

const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  solar: { label: "Солнечная", bg: "rgba(251,191,36,0.12)", text: "#FBBF24" },
  wind: { label: "Ветровая", bg: "rgba(96,165,250,0.12)", text: "#60A5FA" },
  forest: { label: "Лес", bg: "rgba(52,211,153,0.12)", text: "#34D399" },
  industrial: { label: "Промышл.", bg: "rgba(167,139,250,0.12)", text: "#A78BFA" },
  other: { label: "Другое", bg: "rgba(148,163,184,0.12)", text: "#94A3B8" },
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = mockProjects.find((p) => p.id === id);
  if (!project) notFound();

  const progress = Math.round((project.sharesSold / project.totalShares) * 100);
  const retireProgress = project.totalCredits > 0
    ? Math.round((project.creditsRetired / project.totalCredits) * 100) : 0;
  const type = typeConfig[project.projectType];

  const stats = [
    { label: "Цена / доля", value: `${project.pricePerShare.toLocaleString("ru-RU")} \u20B8`, accent: false },
    { label: "CO\u2082 / год", value: `${project.totalCredits.toLocaleString("ru-RU")} т`, accent: true },
    { label: "Погашено", value: `${project.creditsRetired.toLocaleString("ru-RU")} т`, accent: false },
    { label: "Всего долей", value: project.totalShares.toLocaleString("ru-RU"), accent: false },
    { label: "Продано", value: project.sharesSold.toLocaleString("ru-RU"), accent: false },
    { label: "Статус", value: project.verified ? "Верифицирован" : "На проверке", accent: project.verified },
  ];

  return (
    <div className="relative">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
    <div className="relative mx-auto max-w-[1280px] px-6 py-8">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[13px] text-[#5A6D65] hover:text-[#8A9B94] transition-colors mb-8"
      >
        <ChevronLeft size={14} strokeWidth={1.5} />
        Проекты
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main — 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title section */}
          <div className="animate-in">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-[0.05em]"
                style={{ background: type.bg, color: type.text }}
              >
                {type.label}
              </span>
              {project.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[rgba(52,211,153,0.08)] text-[11px] font-medium text-[#34D399] uppercase tracking-[0.05em]">
                  Верифицирован
                </span>
              )}
            </div>
            <h1 className="font-heading text-[32px] sm:text-[36px] font-bold tracking-[-0.02em]">
              {project.name}
            </h1>
            <p className="text-[14px] text-[#5A6D65] mt-1">{project.location}</p>
            <p className="text-[15px] text-[#8A9B94] leading-[1.6] mt-4 max-w-[640px]">
              {project.description}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in delay-1">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-4">
                <p className="label-upper mb-2">{stat.label}</p>
                <p className={`font-mono-data text-[20px] font-medium ${stat.accent ? "text-[#34D399]" : "text-[#F0F5F3]"}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-5 animate-in delay-2">
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em]">Углеродный след</h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#8A9B94]">Прогресс инвестиций</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[13px] text-[#F0F5F3]">
                    {project.sharesSold.toLocaleString("ru-RU")} / {project.totalShares.toLocaleString("ru-RU")}
                  </span>
                  <span className="font-mono-data text-[12px] text-[#34D399]">{progress}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#1E2B26] overflow-hidden">
                <div className="h-full rounded-full bg-[#34D399] animate-progress" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#8A9B94]">Кредиты погашены</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[13px] text-[#F0F5F3]">
                    {project.creditsRetired.toLocaleString("ru-RU")} / {project.totalCredits.toLocaleString("ru-RU")}
                  </span>
                  <span className="font-mono-data text-[12px] text-[#FBBF24]">{retireProgress}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#1E2B26] overflow-hidden">
                <div className="h-full rounded-full bg-[#FBBF24] animate-progress" style={{ width: `${retireProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Document hash */}
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] px-5 py-3.5 flex items-center justify-between animate-in delay-3">
            <span className="label-upper">Хеш документа</span>
            <code className="font-mono-data text-[12px] text-[#5A6D65] truncate max-w-[240px]">
              {project.documentHash}
            </code>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#2A3832] bg-[#131A17] p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.2)]">
            <p className="label-upper">Инвестировать в проект</p>
            <div className="text-center py-3">
              <p className="font-mono-data text-[32px] font-medium text-[#F0F5F3]">
                {project.pricePerShare.toLocaleString("ru-RU")}
                <span className="text-[16px] text-[#5A6D65] ml-1">{"\u20B8"}</span>
              </p>
              <p className="text-[12px] text-[#5A6D65] mt-1">за долю</p>
            </div>
            <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] px-4 py-3 text-center">
              <p className="label-upper mb-0.5">Доступно</p>
              <p className="font-mono-data text-[18px] font-medium text-[#34D399]">
                {(project.totalShares - project.sharesSold).toLocaleString("ru-RU")}
              </p>
            </div>
            <InvestModal property={project} />
          </div>

          <DividendWidget
            projectId={project.id}
            totalDividendsPerShare={250}
            claimableAmount={3750}
            lastClaimed={1700000000}
          />
        </div>
      </div>
    </div>
    </div>
  );
}
