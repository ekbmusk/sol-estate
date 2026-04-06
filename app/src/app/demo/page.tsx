"use client";

import { useState } from "react";
import Link from "next/link";
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

const steps = [
  { id: 1, label: "Проблема", icon: AlertTriangle, color: "#F97316" },
  { id: 2, label: "Решение", icon: Layers, color: "#34D399" },
  { id: 3, label: "Проекты", icon: TrendingUp, color: "#FBBF24" },
  { id: 4, label: "Инвестиции", icon: Wallet, color: "#60A5FA" },
  { id: 5, label: "Дивиденды", icon: Coins, color: "#A78BFA" },
  { id: 6, label: "Retire", icon: Flame, color: "#F97316" },
  { id: 7, label: "Итог", icon: Code2, color: "#34D399" },
];

function StepIndicator({ current, onSelect }: { current: number; onSelect: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((s) => {
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
              {s.label}
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

// ════════════════════════════════════════════
// STEP CONTENT COMPONENTS
// ════════════════════════════════════════════

function Step1() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#F97316]">Проблема</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          Казахстан входит в топ-10 стран мира по углеродоёмкости ВВП
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat value="349M т" label="CO₂ / год" color="text-[#F97316]" />
        <Stat value="17.5 т" label="на человека" />
        <Stat value="$1" label="цена / тонна" color="text-[#F87171]" />
        <Stat value="$91" label="EU ETS" color="text-[#34D399]" />
      </div>

      <div className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/5 p-5 sm:p-6">
        <p className="text-[15px] text-[#B0BDB7] leading-[1.8]">
          Рынок углеродных кредитов существует с 2013 года (KZ ETS), но фактически мёртв:
          <strong className="text-[#F0F5F3]"> $1 за тонну при $91 в Евросоюзе</strong>.
          Всего 135 участников, только спот, без деривативов.
          Банки и финансовые институты <strong className="text-[#F0F5F3]">не допущены</strong> к торгам.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
          <p className="font-mono-data text-[18px] font-bold text-[#FBBF24]">$50/т</p>
          <p className="text-[12px] text-[#8A9B94] mt-1">цель к 2030 (×50 рост)</p>
        </div>
        <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
          <p className="font-mono-data text-[18px] font-bold text-[#60A5FA]">$4.8M</p>
          <p className="text-[12px] text-[#8A9B94] mt-1">World Bank грант (март 2025)</p>
        </div>
        <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
          <p className="font-mono-data text-[18px] font-bold text-[#34D399]">0</p>
          <p className="text-[12px] text-[#8A9B94] mt-1">блокчейн-проектов в ЦА</p>
        </div>
      </div>
    </div>
  );
}

function Step2() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#34D399]">Решение</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          CarbonKZ — первый маркетплейс токенизированных углеродных кредитов в ЦА
        </h2>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 sm:p-8">
        <div className="grid sm:grid-cols-4 gap-6 text-center">
          {[
            { step: "1", title: "Верификация", desc: "doc_hash on-chain", color: "#34D399" },
            { step: "2", title: "Инвестирование", desc: "KZTE → vault, share tokens", color: "#60A5FA" },
            { step: "3", title: "Дивиденды", desc: "выручка → инвесторам", color: "#A78BFA" },
            { step: "4", title: "Retire", desc: "burn + immutable proof", color: "#F97316" },
          ].map((s) => (
            <div key={s.step}>
              <div
                className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-[15px] font-bold mb-3"
                style={{ background: s.color, color: "#060A08" }}
              >
                {s.step}
              </div>
              <p className="text-[14px] font-semibold text-[#F0F5F3]">{s.title}</p>
              <p className="text-[12px] text-[#5A6D65] mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`} external>
          Контракт в Explorer
        </ActionLink>
        <ActionLink href="https://github.com/ekbmusk/sol-estate" external>
          GitHub
        </ActionLink>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {["Anchor 0.32", "Solana Devnet", "SPL Token", "Next.js 16", "React 19", "Tailwind 4", "KZTE (₸)"].map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-md bg-[#1A2320] text-[12px] text-[#8A9B94] font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#FBBF24]">Реальные проекты</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          4 верифицированных проекта на devnet
        </h2>
        <p className="text-[15px] text-[#8A9B94] mt-3">
          Данные основаны на реальных зелёных проектах Казахстана. On-chain с mock fallback.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {mockProjects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <ActionLink href="/">Открыть каталог</ActionLink>
    </div>
  );
}

function Step4() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#60A5FA]">Попробуйте сами</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          Инвестирование за KZTE
        </h2>
      </div>

      <div className="space-y-4">
        {[
          { n: "1", title: "Подключите Phantom кошелёк", desc: "Нажмите кнопку кошелька в правом верхнем углу. Сеть — Devnet.", color: "#34D399" },
          { n: "2", title: "Получите тестовые KZTE", desc: "Перейдите в Портфель и нажмите «Получить KZTE» — 100,000 ₸ на кошелёк.", color: "#FBBF24" },
          { n: "3", title: "Выберите проект и инвестируйте", desc: "Откройте любой проект → «Инвестировать» → укажите количество долей → подтвердите.", color: "#60A5FA" },
          { n: "4", title: "Проверьте в кошельке", desc: "Share tokens (sYSV, sBRB, sAMT) появятся в Phantom. Транзакция видна в Explorer.", color: "#A78BFA" },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5 flex gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
              style={{ background: s.color, color: "#060A08" }}
            >
              {s.n}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#F0F5F3]">{s.title}</p>
              <p className="text-[13px] text-[#8A9B94] mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href="/portfolio">Портфель (KZTE Faucet)</ActionLink>
        <ActionLink href="/project/ses-yasavi">СЭС Ясави</ActionLink>
        <ActionLink href="/project/wind-yereymentau">Ветропарк Ерейментау</ActionLink>
      </div>
    </div>
  );
}

function Step5() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#A78BFA]">Пассивный доход</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          Дивиденды от продажи кредитов
        </h2>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
        <p className="label-upper mb-4">Как работает</p>
        <div className="space-y-4 text-[14px] text-[#B0BDB7] leading-[1.7]">
          <p>
            <strong className="text-[#F0F5F3]">1.</strong> Загрязнитель (КазМунайГаз, ArcelorMittal) покупает углеродные кредиты у проекта за KZTE.
          </p>
          <p>
            <strong className="text-[#F0F5F3]">2.</strong> Владелец проекта вызывает <code className="font-mono-data text-[#34D399] text-[12px]">distribute_revenue</code> — KZTE уходит в vault, обновляется <code className="font-mono-data text-[#34D399] text-[12px]">total_dividends_per_share</code>.
          </p>
          <p>
            <strong className="text-[#F0F5F3]">3.</strong> Инвестор заходит в Портфель и нажимает «Получить» — забирает свою долю дивидендов.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 p-5">
        <p className="label-upper mb-3 text-[#A78BFA]">Формула</p>
        <code className="font-mono-data text-[13px] text-[#F0F5F3] block leading-[2]">
          PRECISION = 10<sup>12</sup><br />
          claimable = (total_dps - last_claimed) × shares / PRECISION
        </code>
        <p className="text-[12px] text-[#5A6D65] mt-3">
          Gas платит инвестор, не владелец → масштабируемо. Double-claim невозможен через last_claimed.
        </p>
      </div>

      <ActionLink href="/portfolio">Перейти в Портфель</ActionLink>
    </div>
  );
}

function Step6() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#F97316]">Killer Feature</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          Retire — гашение кредитов навсегда
        </h2>
      </div>

      <div className="rounded-xl border border-[#F97316]/30 bg-[#1A0F08] p-6 sm:p-8">
        <div className="space-y-6">
          {[
            { n: "1", title: "Купить Carbon Tokens", desc: "Загрязнитель приобретает углеродные кредиты проекта", color: "#FBBF24" },
            { n: "2", title: "SPL Token BURN", desc: "Токены уничтожаются навсегда — исчезают из обращения", color: "#F97316" },
            { n: "3", title: "RetireRecord PDA", desc: "Immutable proof on-chain: кто, сколько, когда, зачем", color: "#F97316" },
            { n: "4", title: "NFT Сертификат", desc: "Mint NFT с metadata — видно в Phantom, скачиваемый SVG", color: "#34D399" },
          ].map((s) => (
            <div key={s.n} className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                style={{ background: s.color, color: "#060A08" }}
              >
                {s.n}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#F0F5F3]">{s.title}</p>
                <p className="text-[13px] text-[#8A9B94] mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="text-[14px] text-[#B0BDB7] leading-[1.8]">
          <strong className="text-[#F97316]">Почему это важно:</strong> Сожжённый токен не существует.
          Double counting невозможен. RetireRecord PDA — immutable proof для аудиторов.
          Любой может проверить через Solana Explorer.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionLink href="/retire">Попробовать Retire</ActionLink>
      </div>
    </div>
  );
}

function Step7() {
  return (
    <div className="space-y-8">
      <div>
        <p className="label-upper mb-4 text-[#34D399]">Архитектура и итог</p>
        <h2 className="font-heading text-[28px] sm:text-[36px] font-bold tracking-[-0.02em] leading-[1.15]">
          Полноценный DeFi продукт на Solana
        </h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat value="14" label="инструкций" color="text-[#34D399]" />
        <Stat value="5" label="PDA accounts" />
        <Stat value="16/16" label="тестов" color="text-[#34D399]" />
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">On-chain инструкции</p>
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
        <p className="label-upper mb-3">Безопасность</p>
        <div className="space-y-2 text-[13px] text-[#8A9B94]">
          {[
            "checked_add / checked_mul / checked_div — везде",
            "Vault PDA — единственный authority над KZTE ATA",
            "Burn ПЕРЕД state mutation (reentrancy protection)",
            "RetireRecord PDA uniqueness — double-retire невозможен",
            "Escrow owner validation в buy_shares",
          ].map((s) => (
            <div key={s} className="flex items-start gap-2">
              <span className="text-[#34D399] mt-0.5">✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#34D399]/20 bg-[#34D399]/5 p-6 sm:p-8 text-center">
        <p className="font-heading text-[20px] sm:text-[24px] font-bold text-[#F0F5F3] mb-2">
          CarbonKZ решает три проблемы
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {[
            { label: "Прозрачность", color: "#34D399" },
            { label: "Ликвидность", color: "#60A5FA" },
            { label: "Верификация", color: "#A78BFA" },
          ].map((p) => (
            <span key={p.label} className="px-4 py-2 rounded-full text-[13px] font-semibold" style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30` }}>
              {p.label}
            </span>
          ))}
        </div>
        <p className="text-[14px] text-[#8A9B94] mt-5">
          Solana — быстро и дёшево. Казахстан — первый в ЦА.
        </p>
      </div>

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
        <p className="label-upper mb-3">Команда Zerde</p>
        <p className="text-[14px] text-[#8A9B94]">
          г. Павлодар, г. Туркестан · Decentrathon 5.0 · Кейс 1 (RWA)
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
          Explorer
        </ActionLink>
        <ActionLink href="https://github.com/ekbmusk/sol-estate" external>
          GitHub
        </ActionLink>
        <ActionLink href="/">Каталог проектов</ActionLink>
      </div>
    </div>
  );
}

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6, Step7];

// ════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════

export default function DemoPage() {
  const [step, setStep] = useState(1);
  const StepContent = STEP_COMPONENTS[step - 1];

  return (
    <div className="min-h-[calc(100vh-64px)] relative">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-30 pointer-events-none" />

      {/* Sticky progress */}
      <div className="sticky top-16 z-40 border-b border-[#1E2B26] bg-[#060A08]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[960px] px-6 py-3 flex items-center justify-between">
          <StepIndicator current={step} onSelect={setStep} />
          <span className="text-[11px] text-[#5A6D65] font-mono-data hidden sm:block">
            {step}/7
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-[2px] bg-[#1E2B26]">
          <div
            className="h-full bg-[#34D399] transition-all duration-500 ease-out"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[960px] px-6 py-10 sm:py-16">
        <StepContent />
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t border-[#1E2B26] bg-[#060A08]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[960px] px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-[#8A9B94] hover:text-[#F0F5F3] hover:bg-[#1A2320] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8A9B94] transition-colors cursor-pointer disabled:cursor-default"
          >
            <ArrowLeft size={14} />
            Назад
          </button>

          <span className="text-[12px] text-[#5A6D65]">
            {steps[step - 1].label}
          </span>

          <button
            onClick={() => setStep(Math.min(7, step + 1))}
            disabled={step === 7}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/20 disabled:opacity-30 disabled:hover:bg-[#34D399]/10 transition-colors cursor-pointer disabled:cursor-default"
          >
            Далее
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
