"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ChevronLeft, Droplets } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import InvestModal from "@/components/InvestModal";
import DividendWidget from "@/components/DividendWidget";
import SolarmanWidget from "@/components/SolarmanWidget";
import ProjectChart from "@/components/ProjectChart";
import { mockProjects, type Project } from "@/lib/mockData";
import { useProject } from "@/hooks/useProject";
import { useInvestor } from "@/hooks/useInvestor";
import { KZTE_DECIMALS } from "@/lib/constants";
import { localeToBcp47 } from "@/lib/format";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  solar: { bg: "rgba(251,191,36,0.12)", text: "#FBBF24" },
  wind: { bg: "rgba(96,165,250,0.12)", text: "#60A5FA" },
  forest: { bg: "rgba(52,211,153,0.12)", text: "#34D399" },
  industrial: { bg: "rgba(167,139,250,0.12)", text: "#A78BFA" },
  other: { bg: "rgba(148,163,184,0.12)", text: "#94A3B8" },
};

const PRECISION = BigInt("1000000000000");

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const { id } = use(params);
  const { publicKey } = useWallet();
  const { project: onChainProject, loading: projectLoading } = useProject(id);
  const { investor } = useInvestor(id);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const tenge = tCommon("units.tenge");
  const fmt = (n: number) => n.toLocaleString(bcp);

  const handleFaucet = async () => {
    if (!publicKey) { toast.error(t("toasts.connectWallet")); return; }
    setFaucetLoading(true);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(t("toasts.faucetTitle"), { description: data.error }); return; }
      toast.success(t("toasts.faucetReceived"), {
        action: { label: "Explorer", onClick: () => window.open(data.explorer, "_blank") },
      });
    } catch (err) {
      toast.error(t("toasts.error"), { description: err instanceof Error ? err.message : t("toasts.unknownError") });
    } finally {
      setFaucetLoading(false);
    }
  };
  const mock = mockProjects.find((p) => p.id === id);

  const project: Project | null = onChainProject
    ? {
        id: onChainProject.id,
        name: onChainProject.name,
        location: mock?.location ?? "",
        description: mock?.description ?? "",
        projectType: onChainProject.projectType as Project["projectType"],
        totalCredits: onChainProject.totalCredits,
        creditsRetired: onChainProject.creditsRetired,
        totalShares: onChainProject.totalShares,
        sharesSold: onChainProject.sharesSold,
        pricePerShare: onChainProject.pricePerShare,
        verified: onChainProject.verified,
        status: onChainProject.status as Project["status"],
        imageUrl: mock?.imageUrl ?? "",
        documentHash: onChainProject.documentHash.map((b) => b.toString(16).padStart(2, "0")).join(""),
      }
    : mock ?? null;

  if (!project && !projectLoading) notFound();

  if (!project) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const progress = Math.round((project.sharesSold / project.totalShares) * 100);
  const retireProgress = project.totalCredits > 0
    ? Math.round((project.creditsRetired / project.totalCredits) * 100) : 0;
  const typeColor = TYPE_COLORS[project.projectType] ?? TYPE_COLORS.other;
  const typeLabel = t(`types.${project.projectType}` as "types.solar");

  let claimableAmount = 0;
  let totalDividendsPerShareDisplay = 0;
  if (onChainProject && investor) {
    const totalDPS = BigInt(onChainProject.totalDividendsPerShare);
    const lastClaimed = BigInt(investor.lastClaimed);
    const sharesOwned = BigInt(investor.sharesOwned);
    const unclaimedPerShare = totalDPS - lastClaimed;
    const claimableRaw = (unclaimedPerShare / PRECISION) * sharesOwned;
    claimableAmount = Number(claimableRaw) / 10 ** KZTE_DECIMALS;
    totalDividendsPerShareDisplay = Number(totalDPS / PRECISION) / 10 ** KZTE_DECIMALS;
  }

  const stats = [
    { label: t("stats.pricePerShare"), value: `${fmt(project.pricePerShare)} ${tenge}`, accent: false },
    { label: t("stats.co2PerYear"), value: `${fmt(project.totalCredits)} ${t("tonneShort")}`, accent: true },
    { label: t("stats.retired"), value: `${fmt(project.creditsRetired)} ${t("tonneShort")}`, accent: false },
    { label: t("stats.totalShares"), value: fmt(project.totalShares), accent: false },
    { label: t("stats.sold"), value: fmt(project.sharesSold), accent: false },
    { label: t("stats.status"), value: project.verified ? t("verified") : t("notVerified"), accent: project.verified },
  ];

  const equipmentItems = [
    { labelKey: "power", valueKey: "powerValue" },
    { labelKey: "generation", valueKey: "generationValue" },
    { labelKey: "factor", valueKey: "factorValue" },
    { labelKey: "insolation", valueKey: "insolationValue" },
  ] as const;

  return (
    <div className="relative">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
    <div className="relative mx-auto max-w-[1280px] px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[13px] text-[#5A6D65] hover:text-[#8A9B94] transition-colors mb-8"
      >
        <ChevronLeft size={14} strokeWidth={1.5} />
        {t("backToProjects")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="animate-in">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-[0.05em]"
                style={{ background: typeColor.bg, color: typeColor.text }}
              >
                {typeLabel}
              </span>
              {project.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[rgba(52,211,153,0.08)] text-[11px] font-medium text-[#34D399] uppercase tracking-[0.05em]">
                  {t("verified")}
                </span>
              )}
              {onChainProject && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(52,211,153,0.05)] text-[10px] font-medium text-[#5A6D65] uppercase tracking-[0.05em]">
                  {t("onChain")}
                </span>
              )}
              {id === "ses-yasavi" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] text-[10px] font-semibold text-[#FBBF24] uppercase tracking-[0.05em]">
                  {t("ourReal")}
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

          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-5 animate-in delay-2">
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em]">{t("carbonFootprint")}</h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#8A9B94]">{t("investmentProgress")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[13px] text-[#F0F5F3]">
                    {fmt(project.sharesSold)} / {fmt(project.totalShares)}
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
                <span className="text-[13px] text-[#8A9B94]">{t("creditsRetired")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[13px] text-[#F0F5F3]">
                    {fmt(project.creditsRetired)} / {fmt(project.totalCredits)}
                  </span>
                  <span className="font-mono-data text-[12px] text-[#FBBF24]">{retireProgress}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#1E2B26] overflow-hidden">
                <div className="h-full rounded-full bg-[#FBBF24] animate-progress" style={{ width: `${retireProgress}%` }} />
              </div>
            </div>
          </div>

          {id === "ses-yasavi" && (
            <div className="rounded-xl border border-[#FBBF24]/20 overflow-hidden animate-in delay-2 relative">
              <div className="absolute inset-0" style={{
                background: "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(251,191,36,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(251,191,36,0.05) 0%, transparent 60%)",
              }} />
              <div className="absolute inset-0 bg-[#0C1210]/80" />
              <div className="relative p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
                  <p className="text-[13px] font-semibold text-[#FBBF24] uppercase tracking-wider">{t("realEquipment")}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {equipmentItems.map((s) => (
                    <div key={s.labelKey} className="rounded-lg bg-[#060A08]/60 border border-[#FBBF24]/10 px-3 py-2.5">
                      <p className="text-[10px] text-[#FBBF24]/60 uppercase tracking-wider">{t(`equipment.${s.labelKey}`)}</p>
                      <p className="font-mono-data text-[15px] font-medium text-[#F0F5F3] mt-0.5">{t(`equipment.${s.valueKey}`)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-[#8A9B94] leading-[1.6]">
                  {t("realEquipmentDesc")}
                </p>
              </div>
            </div>
          )}

          {project.projectType === "solar" && (
            <div className="animate-in delay-3">
              <SolarmanWidget />
            </div>
          )}

          <div className="animate-in delay-3">
            <ProjectChart
              totalCredits={project.totalCredits}
              creditsRetired={project.creditsRetired}
              projectId={project.id}
            />
          </div>

          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] px-5 py-3.5 animate-in delay-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="label-upper">{t("documentHash")}</span>
              <code className="font-mono-data text-[12px] text-[#5A6D65] truncate max-w-full sm:max-w-[240px]">
                {project.documentHash}
              </code>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#2A3832] bg-[#131A17] p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.2)]">
            <p className="label-upper">{t("investSidebar")}</p>
            <div className="text-center py-3">
              <p className="font-mono-data text-[32px] font-medium text-[#F0F5F3]">
                {fmt(project.pricePerShare)}
                <span className="text-[16px] text-[#5A6D65] ml-1">{tenge}</span>
              </p>
              <p className="text-[12px] text-[#5A6D65] mt-1">{t("perShare")}</p>
            </div>
            <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] px-4 py-3 text-center">
              <p className="label-upper mb-0.5">{t("available")}</p>
              <p className="font-mono-data text-[18px] font-medium text-[#34D399]">
                {fmt(project.totalShares - project.sharesSold)}
              </p>
            </div>
            <InvestModal property={project} />
            <button
              onClick={handleFaucet}
              disabled={faucetLoading}
              className="flex items-center justify-center gap-2 w-full rounded-md border border-[#34D399]/30 bg-[#34D399]/5 px-4 py-2.5 text-[13px] font-medium text-[#34D399] hover:bg-[#34D399]/10 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
            >
              <Droplets size={14} />
              {faucetLoading ? "..." : t("faucetCta")}
            </button>
          </div>

          <DividendWidget
            projectId={project.id}
            totalDividendsPerShare={totalDividendsPerShareDisplay}
            claimableAmount={claimableAmount}
            lastClaimed={investor?.lastClaimed ?? 0}
          />
        </div>
      </div>
    </div>
    </div>
  );
}
