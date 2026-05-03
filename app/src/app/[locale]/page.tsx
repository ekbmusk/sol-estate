"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, ShieldCheck, Flame, CircleDollarSign } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { mockProjects, type Project } from "@/lib/mockData";
import { useProjects } from "@/hooks/useProjects";
import { localeToBcp47 } from "@/lib/format";

const PROJECT_TYPE_KEYS = ["all", "solar", "wind", "forest", "industrial"] as const;

export default function LandingPage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const [activeType, setActiveType] = useState<typeof PROJECT_TYPE_KEYS[number]>("all");
  const { projects: onChainProjects } = useProjects();

  const displayProjects: Project[] = useMemo(() => {
    if (onChainProjects.length === 0) return mockProjects;
    return onChainProjects.map((p) => {
      const mock = mockProjects.find((m) => m.id === p.id);
      return {
        id: p.id,
        name: p.name,
        location: mock?.location ?? "",
        description: mock?.description ?? "",
        projectType: p.projectType as Project["projectType"],
        totalCredits: p.totalCredits,
        creditsRetired: p.creditsRetired,
        totalShares: p.totalShares,
        sharesSold: p.sharesSold,
        pricePerShare: p.pricePerShare,
        verified: p.verified,
        status: p.status as Project["status"],
        imageUrl: mock?.imageUrl ?? "",
        documentHash: mock?.documentHash ?? "",
      };
    });
  }, [onChainProjects]);

  const totalCredits = displayProjects.reduce((s, p) => s + p.totalCredits, 0);
  const totalRetired = displayProjects.reduce((s, p) => s + p.creditsRetired, 0);
  const totalInvested = displayProjects.reduce((s, p) => s + p.sharesSold * p.pricePerShare, 0);

  const filteredRaw = activeType === "all"
    ? displayProjects
    : displayProjects.filter((p) => p.projectType === activeType);
  const filtered = [...filteredRaw].sort((a, b) => {
    if (a.id === "ses-yasavi") return -1;
    if (b.id === "ses-yasavi") return 1;
    return 0;
  });

  const tco2 = tCommon("units.tco2");
  const tenge = tCommon("units.tenge");
  const fmt = (n: number) => n.toLocaleString(bcp);

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0" />
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <div className="animate-in">
                <h1 className="font-heading text-[32px] sm:text-[44px] md:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em]">
                  {t("hero.title1")}<br className="hidden sm:block" /> {t("hero.title2")}<br />
                  <span className="text-[#34D399]">{t("hero.titleAccent")}</span>
                </h1>
              </div>

              <p className="animate-in delay-1 mt-6 text-[17px] leading-[1.6] text-[#8A9B94] max-w-[480px]">
                {t("hero.subtitle")}
              </p>

              <div className="animate-in delay-2 mt-10 flex flex-wrap gap-3">
                <a
                  href="#projects"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-5 py-2.5 text-[14px] font-semibold text-[#060A08] hover:bg-[#059669] active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  {t("hero.ctaInvest")}
                  <ArrowRight size={15} strokeWidth={2} />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2A3832] px-5 py-2.5 text-[14px] font-medium text-[#8A9B94] hover:text-[#F0F5F3] hover:bg-[#1A2320] active:scale-[0.98] transition-all duration-200"
                >
                  {t("hero.ctaHow")}
                </a>
              </div>
            </div>

            <div className="lg:col-span-2 animate-in delay-3">
              <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="label-upper">{t("stats.overview")}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                    <span className="text-[11px] text-[#34D399] font-medium">{tCommon("online")}</span>
                  </span>
                </div>
                {[
                  { label: t("stats.totalCredits"), value: `${fmt(totalCredits)} ${tco2}` },
                  { label: t("stats.retired"), value: `${fmt(totalRetired)} ${tco2}` },
                  { label: t("stats.activeProjects"), value: `${displayProjects.length}` },
                  { label: t("stats.invested"), value: `${fmt(Math.round(totalInvested))} ${tenge}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-t border-[#1E2B26]">
                    <span className="text-[13px] text-[#8A9B94]">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-data text-[14px] text-[#F0F5F3]">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROJECT CATALOG ═══ */}
      <section id="projects" className="py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-heading text-[28px] sm:text-[32px] font-bold tracking-[-0.02em]">
                {t("projects.title")}
              </h2>
              <p className="mt-2 text-[15px] text-[#8A9B94]">
                {t("projects.subtitle")}
              </p>
            </div>

            <div className="flex gap-1 p-1 rounded-lg border border-[#1E2B26] bg-[#0C1210] overflow-x-auto">
              {PROJECT_TYPE_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveType(key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap
                    ${activeType === key
                      ? "bg-[rgba(16,185,129,0.1)] text-[#34D399]"
                      : "text-[#5A6D65] hover:text-[#8A9B94]"
                    }`}
                >
                  {t(`projects.filters.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((project, i) => (
              <div key={project.id} className="animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-16 sm:py-24 border-t border-[#1E2B26] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(16,185,129,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(249,115,22,0.03) 0%, transparent 70%)"
        }} />

        <div className="relative mx-auto max-w-[1280px] px-6 space-y-16 sm:space-y-24">

          {/* --- Проблема --- */}
          <div className="max-w-[800px]">
            <p className="label-upper mb-5 text-[#F97316]">{t("problem.label")}</p>
            <h2 className="font-heading text-[24px] sm:text-[32px] md:text-[40px] font-bold tracking-[-0.02em] leading-[1.15] mb-6 sm:mb-8">
              {t("problem.headline")}
            </h2>
            <p className="text-[15px] sm:text-[17px] text-[#B0BDB7] leading-[1.8] mb-5">
              {t("problem.p1")}
            </p>
            <p className="text-[15px] sm:text-[17px] text-[#B0BDB7] leading-[1.8]">
              {t("problem.p2")}
            </p>
          </div>

          {/* --- Для кого --- */}
          <div>
            <p className="label-upper mb-8 text-[#34D399]">{t("audience.label")}</p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center mb-5">
                  <CircleDollarSign size={24} strokeWidth={1.5} className="text-[#34D399]" />
                </div>
                <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold mb-3">{t("audience.investors.title")}</h3>
                <p className="text-[14px] sm:text-[15px] text-[#B0BDB7] leading-[1.7]">
                  {t("audience.investors.desc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mb-5">
                  <Flame size={24} strokeWidth={1.5} className="text-[#F97316]" />
                </div>
                <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold mb-3">{t("audience.polluters.title")}</h3>
                <p className="text-[14px] sm:text-[15px] text-[#B0BDB7] leading-[1.7]">
                  {t("audience.polluters.desc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mb-5">
                  <ShieldCheck size={24} strokeWidth={1.5} className="text-[#60A5FA]" />
                </div>
                <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold mb-3">{t("audience.greenProjects.title")}</h3>
                <p className="text-[14px] sm:text-[15px] text-[#B0BDB7] leading-[1.7]">
                  {t("audience.greenProjects.desc")}
                </p>
              </div>
            </div>
          </div>

          {/* --- Как работает --- */}
          <div>
            <p className="label-upper mb-8">{t("how.label")}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-9 space-y-5">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-[#34D399] text-[#060A08] flex items-center justify-center text-[15px] font-bold shrink-0">{n}</span>
                    <h3 className="font-heading text-[20px] font-semibold">{t(`how.step${n}Title` as "how.step1Title")}</h3>
                  </div>
                  <p className="text-[16px] text-[#B0BDB7] leading-[1.8]">
                    {t(`how.step${n}Desc` as "how.step1Desc")}
                  </p>
                </div>
              ))}
              <div className="rounded-2xl border border-[#F97316]/30 bg-[#1A0F08] p-9 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#F97316] text-[#060A08] flex items-center justify-center text-[15px] font-bold shrink-0">4</span>
                  <h3 className="font-heading text-[20px] font-semibold text-[#F97316]">{t("how.step4Title")}</h3>
                </div>
                <p className="text-[16px] text-[#B0BDB7] leading-[1.8]">
                  {t("how.step4Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* --- Почему Solana --- */}
          <div className="max-w-[800px]">
            <p className="label-upper mb-6 text-[#A78BFA]">{t("whySolana.label")}</p>
            <div className="space-y-6">
              {([
                ["transparencyTitle", "transparencyDesc"],
                ["speedTitle", "speedDesc"],
                ["integrityTitle", "integrityDesc"],
              ] as const).map(([titleKey, descKey]) => (
                <div key={titleKey} className="flex gap-5">
                  <div className="w-2 h-2 rounded-full bg-[#A78BFA] mt-2.5 shrink-0" />
                  <div>
                    <p className="text-[17px] font-medium text-[#F0F5F3]">{t(`whySolana.${titleKey}`)}</p>
                    <p className="text-[15px] text-[#B0BDB7] leading-[1.7] mt-1">{t(`whySolana.${descKey}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
