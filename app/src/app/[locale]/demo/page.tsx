"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Layers,
  TrendingUp,
  Wallet,
  Coins,
  Flame,
  Code2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { mockProjects } from "@/lib/mockData";

const PROGRAM_ID = "3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg";
const EXPLORER_BASE = "https://explorer.solana.com";

const STEPS_META = [
  { id: 1, key: "problem", icon: AlertTriangle, color: "#F97316" },
  { id: 2, key: "solution", icon: Layers, color: "#34D399" },
  { id: 3, key: "projects", icon: TrendingUp, color: "#FBBF24" },
  { id: 4, key: "investments", icon: Wallet, color: "#60A5FA" },
  { id: 5, key: "dividends", icon: Coins, color: "#A78BFA" },
  { id: 6, key: "retire", icon: Flame, color: "#F97316" },
  { id: 7, key: "summary", icon: Code2, color: "#34D399" },
] as const;

function StepIndicator({ current, onSelect }: { current: number; onSelect: (n: number) => void }) {
  const t = useTranslations("demo.stepLabels");
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEPS_META.map((s) => {
        const Icon = s.icon;
        const isActive = s.id === current;
        const isPast = s.id < current;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="flex items-center gap-1.5 group cursor-pointer transition-all"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300
                ${isActive ? "scale-110" : "scale-100 hover:scale-105"}`}
              style={{
                background: isActive ? s.color : isPast ? `${s.color}30` : "#1E2B26",
                color: isActive ? "#060A08" : isPast ? s.color : "#5A6D65",
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
            </div>
            <span
              className={`hidden lg:block text-[11px] font-medium transition-colors
                ${isActive ? "text-[#F0F5F3]" : "text-[#5A6D65] group-hover:text-[#8A9B94]"}`}
            >
              {t(s.key)}
            </span>
            {s.id < 7 && (
              <ChevronRight size={12} className="text-[#1E2B26] hidden sm:block" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-4 sm:p-5">
      <p className={`font-mono-data text-[20px] sm:text-[24px] font-bold ${color ?? "text-[#F0F5F3]"}`}>
        {value}
      </p>
      <p className="text-[11px] text-[#5A6D65] mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ActionLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls = "inline-flex items-center gap-2 rounded-lg border border-[#34D399]/30 bg-[#34D399]/5 px-4 py-2.5 text-[13px] font-medium text-[#34D399] hover:bg-[#34D399]/10 transition-colors";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <ExternalLink size={12} />
      </a>
    );
  }
  return <Link href={href} className={cls}>{children}<ArrowRight size={12} /></Link>;
}

function Step1() {
  const t = useTranslations("demo.step1");
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#F97316]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat value="349M т" label={t("stats.co2Year")} color="text-[#F97316]" />
        <Stat value="17.5 т" label={t("stats.perPerson")} />
        <Stat value="$1" label={t("stats.pricePerTonne")} color="text-[#F87171]" />
        <Stat value="$91" label={t("stats.euEts")} color="text-[#34D399]" />
      </div>

      <div className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/5 p-5 sm:p-6">
        <p className="text-[15px] text-[#B0BDB7] leading-[1.8]">
          {t("deadMarket")}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
          <p className="font-mono-data text-[18px] font-bold text-[#FBBF24]">$50/т</p>
          <p className="text-[12px] text-[#8A9B94] mt-1">{t("target2030")}</p>
        </div>
        <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
          <p className="font-mono-data text-[18px] font-bold text-[#60A5FA]">$4.8M</p>
          <p className="text-[12px] text-[#8A9B94] mt-1">{t("wbGrant")}</p>
        </div>
        <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
          <p className="font-mono-data text-[18px] font-bold text-[#34D399]">0</p>
          <p className="text-[12px] text-[#8A9B94] mt-1">{t("noBlockchain")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
          <p className="text-[13px] font-semibold text-[#FBBF24] uppercase tracking-wider">{t("personalLabel")}</p>
          <a href="https://t.me/callmebekaa" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#34D399] hover:underline">
            @callmebekaa
          </a>
        </div>
        <p className="text-[15px] text-[#B0BDB7] leading-[1.8]">
          {t("personalText")}
        </p>
      </div>
    </div>
  );
}

function Step2() {
  const t = useTranslations("demo.step2");
  const blocks = [
    { step: "1", titleKey: "verifyTitle", descKey: "verifyDesc", color: "#34D399" },
    { step: "2", titleKey: "investTitle", descKey: "investDesc", color: "#60A5FA" },
    { step: "3", titleKey: "dividendsTitle", descKey: "dividendsDesc", color: "#A78BFA" },
    { step: "4", titleKey: "retireTitle", descKey: "retireDesc", color: "#F97316" },
  ] as const;
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#34D399]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 sm:p-8">
        <div className="grid sm:grid-cols-4 gap-6 text-center">
          {blocks.map((s) => (
            <div key={s.step}>
              <div
                className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-[15px] font-bold mb-3"
                style={{ background: s.color, color: "#060A08" }}
              >
                {s.step}
              </div>
              <p className="text-[14px] font-semibold text-[#F0F5F3]">{t(`blocks.${s.titleKey}`)}</p>
              <p className="text-[12px] text-[#5A6D65] mt-1">{t(`blocks.${s.descKey}`)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`} external>
          {t("ctaContract")}
        </ActionLink>
        <ActionLink href="https://github.com/ekbmusk/sol-estate" external>
          {t("ctaGithub")}
        </ActionLink>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">{t("techStack")}</p>
        <div className="flex flex-wrap gap-2">
          {["Anchor 0.32", "Solana Devnet", "SPL Token", "Next.js 16", "React 19", "Tailwind 4", "KZTE (₸)"].map((x) => (
            <span key={x} className="px-2.5 py-1 rounded-md bg-[#1A2320] text-[12px] text-[#8A9B94] font-medium">
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3() {
  const t = useTranslations("demo.step3");
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#FBBF24]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
        <p className="text-[15px] text-[#8A9B94] mt-3">
          {t("subtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-5 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded bg-[#FBBF24]/20 text-[10px] font-bold text-[#FBBF24] uppercase tracking-wider">{t("liveBadge")}</span>
          <span className="text-[14px] font-semibold text-[#F0F5F3]">{t("liveTitle")}</span>
        </div>
        <p className="text-[13px] text-[#8A9B94] leading-[1.7]">
          {t("liveDesc")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {mockProjects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <ActionLink href="/">{t("openCatalog")}</ActionLink>
    </div>
  );
}

function Step4() {
  const t = useTranslations("demo.step4");
  const items = [
    { n: "1", titleKey: "step1Title", descKey: "step1Desc", color: "#34D399" },
    { n: "2", titleKey: "step2Title", descKey: "step2Desc", color: "#FBBF24" },
    { n: "3", titleKey: "step3Title", descKey: "step3Desc", color: "#60A5FA" },
    { n: "4", titleKey: "step4Title", descKey: "step4Desc", color: "#A78BFA" },
  ] as const;
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#60A5FA]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
      </div>

      <div className="space-y-4">
        {items.map((s) => (
          <div key={s.n} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5 flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
              style={{ background: s.color, color: "#060A08" }}
            >
              {s.n}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#F0F5F3]">{t(s.titleKey)}</p>
              <p className="text-[13px] text-[#8A9B94] mt-1">{t(s.descKey)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href="/portfolio">{t("ctaPortfolio")}</ActionLink>
        <ActionLink href="/project/ses-yasavi">{t("ctaSesYasavi")}</ActionLink>
        <ActionLink href="/project/wind-yereymentau">{t("ctaWind")}</ActionLink>
      </div>
    </div>
  );
}

function Step5() {
  const t = useTranslations("demo.step5");
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#A78BFA]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
        <p className="label-upper mb-4">{t("howTitle")}</p>
        <div className="space-y-4 text-[14px] text-[#B0BDB7] leading-[1.7]">
          <p>
            <strong className="text-[#F0F5F3]">1.</strong> {t("howStep1")}
          </p>
          <p>
            <strong className="text-[#F0F5F3]">2.</strong> {t("howStep2_part1")} <code className="font-mono-data text-[#34D399] text-[12px]">distribute_revenue</code> {t("howStep2_part2")} <code className="font-mono-data text-[#34D399] text-[12px]">total_dividends_per_share</code>.
          </p>
          <p>
            <strong className="text-[#F0F5F3]">3.</strong> {t("howStep3")}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-5">
        <p className="label-upper mb-3 text-[#A78BFA]">{t("exampleTitle")}</p>
        <div className="grid grid-cols-3 gap-4 text-center mt-3">
          <div>
            <p className="font-mono-data text-[18px] font-bold text-[#8A9B94]">$500</p>
            <p className="text-[11px] text-[#5A6D65] mt-1">{t("income1")}</p>
          </div>
          <div>
            <p className="font-mono-data text-[18px] font-bold text-[#FBBF24]">$7 500</p>
            <p className="text-[11px] text-[#5A6D65] mt-1">{t("income2")}</p>
          </div>
          <div>
            <p className="font-mono-data text-[18px] font-bold text-[#34D399]">$25 000</p>
            <p className="text-[11px] text-[#5A6D65] mt-1">{t("income3")}</p>
          </div>
        </div>
        <p className="text-[12px] text-[#5A6D65] mt-4">
          {t("exampleNote")}
        </p>
      </div>

      <ActionLink href="/portfolio">{t("ctaPortfolio")}</ActionLink>
    </div>
  );
}

function Step6() {
  const t = useTranslations("demo.step6");
  const items = [
    { n: "1", titleKey: "step1Title", descKey: "step1Desc", color: "#FBBF24" },
    { n: "2", titleKey: "step2Title", descKey: "step2Desc", color: "#F97316" },
    { n: "3", titleKey: "step3Title", descKey: "step3Desc", color: "#F97316" },
    { n: "4", titleKey: "step4Title", descKey: "step4Desc", color: "#34D399" },
  ] as const;
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#F97316]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
      </div>

      <div className="rounded-xl border border-[#F97316]/30 bg-[#1A0F08] p-6 sm:p-8">
        <div className="space-y-6">
          {items.map((s) => (
            <div key={s.n} className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                style={{ background: s.color, color: "#060A08" }}
              >
                {s.n}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#F0F5F3]">{t(s.titleKey)}</p>
                <p className="text-[13px] text-[#8A9B94] mt-0.5">{t(s.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="text-[14px] text-[#B0BDB7] leading-[1.8]">
          <strong className="text-[#F97316]">{t("whyImportantLabel")}</strong> {t("whyImportantText")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href="/retire">{t("ctaTry")}</ActionLink>
      </div>
    </div>
  );
}

function Step7() {
  const t = useTranslations("demo.step7");
  const tags = ["transparency", "liquidity", "verification"] as const;
  const tagColors = { transparency: "#34D399", liquidity: "#60A5FA", verification: "#A78BFA" };
  const securityKeys = ["checked", "vault", "burn", "uniqueness", "escrow"] as const;
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#34D399]">{t("label")}</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          {t("headline")}
        </h2>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <Stat value="14" label={t("stats.instructions")} color="text-[#34D399]" />
        <Stat value="16/16" label={t("stats.tests")} color="text-[#34D399]" />
        <Stat value="1-2%" label={t("stats.fee")} color="text-[#FBBF24]" />
        <Stat value="×50" label={t("stats.roi")} color="text-[#34D399]" />
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">{t("instructionsTitle")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            "initialize_project", "verify_project", "invest",
            "distribute_revenue", "claim_dividends", "retire_credits",
            "mint_carbon_tokens", "list_shares", "buy_shares",
            "cancel_listing", "create_share_metadata", "create_carbon_metadata",
            "update_token_metadata", "mint_retire_certificate",
          ].map((ix) => (
            <code key={ix} className="font-mono-data text-[11px] text-[#8A9B94] bg-[#060A08] border border-[#1E2B26] rounded px-2 py-1.5 truncate">
              {ix}
            </code>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">{t("securityTitle")}</p>
        <div className="space-y-2 text-[13px] text-[#8A9B94]">
          {securityKeys.map((k) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-[#34D399] mt-0.5">✓</span>
              <span>{t(`security.${k}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#34D399]/20 bg-[#34D399]/5 p-6 sm:p-8 text-center">
        <p className="font-heading text-[20px] sm:text-[24px] font-bold text-[#F0F5F3] mb-2">
          {t("summaryHeadline")}
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {tags.map((k) => (
            <span key={k} className="px-4 py-2 rounded-full text-[13px] font-semibold" style={{ background: `${tagColors[k]}15`, color: tagColors[k], border: `1px solid ${tagColors[k]}30` }}>
              {t(`tags.${k}`)}
            </span>
          ))}
        </div>
        <p className="text-[14px] text-[#8A9B94] mt-5">
          {t("summaryFooter")}
        </p>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">{t("teamLabel")}</p>
        <p className="text-[14px] text-[#8A9B94]">
          {t("teamDesc")}
        </p>
        <div className="flex gap-4 mt-3">
          <a href="https://t.me/callmebekaa" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#34D399] hover:underline">
            @callmebekaa
          </a>
          <a href="https://t.me/kimjjk" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#34D399] hover:underline">
            @kimjjk
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`} external>
          {t("ctaExplorer")}
        </ActionLink>
        <ActionLink href="https://github.com/ekbmusk/sol-estate" external>
          {t("ctaGithub")}
        </ActionLink>
        <ActionLink href="/">{t("ctaCatalog")}</ActionLink>
      </div>
    </div>
  );
}

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6, Step7];

export default function DemoPage() {
  const t = useTranslations("demo");
  const tLabels = useTranslations("demo.stepLabels");
  const [step, setStep] = useState(1);
  const StepContent = STEP_COMPONENTS[step - 1];

  return (
    <div className="min-h-[calc(100vh-64px)] relative">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-30 pointer-events-none" />

      <div className="sticky top-16 z-40 border-b border-[#1E2B26] bg-[#060A08]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[960px] px-6 py-3 flex items-center justify-between">
          <StepIndicator current={step} onSelect={setStep} />
          <span className="text-[11px] text-[#5A6D65] font-mono-data hidden sm:block">
            {step}/7
          </span>
        </div>
        <div className="h-[2px] bg-[#1E2B26]">
          <div
            className="h-full bg-[#34D399] transition-all duration-500 ease-out"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-[960px] px-6 py-10 sm:py-16">
        <StepContent />
      </div>

      <div className="sticky bottom-0 border-t border-[#1E2B26] bg-[#060A08]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[960px] px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-[#8A9B94] hover:text-[#F0F5F3] hover:bg-[#1A2320] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8A9B94] transition-colors cursor-pointer disabled:cursor-default"
          >
            <ArrowLeft size={14} />
            {t("back")}
          </button>

          <span className="text-[12px] text-[#5A6D65]">
            {tLabels(STEPS_META[step - 1].key)}
          </span>

          <button
            onClick={() => setStep(Math.min(7, step + 1))}
            disabled={step === 7}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/20 disabled:opacity-30 disabled:hover:bg-[#34D399]/10 transition-colors cursor-pointer disabled:cursor-default"
          >
            {t("next")}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
