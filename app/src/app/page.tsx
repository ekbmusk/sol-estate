"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Flame, CircleDollarSign } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import CarbonCounter from "@/components/CarbonCounter";
import { mockProjects, type Project } from "@/lib/mockData";
import { useProjects } from "@/hooks/useProjects";
import { KZTE_DECIMALS } from "@/lib/constants";

const projectTypes = [
  { key: "all", label: "Все" },
  { key: "solar", label: "Солнечная" },
  { key: "wind", label: "Ветровая" },
  { key: "forest", label: "Лес" },
  { key: "industrial", label: "Промышленность" },
];

const platformStats = [
  { value: 28000, suffix: " tCO\u2082", label: "\u0412\u0441\u0435\u0433\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432" },
  { value: 3920, suffix: " tCO\u2082", label: "\u041F\u043E\u0433\u0430\u0448\u0435\u043D\u043E" },
  { value: 4, suffix: "", label: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432" },
  { value: 224, suffix: "M \u20B8", label: "\u0418\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E" },
];

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const lastTarget = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === lastTarget.current) return;
    lastTarget.current = target;

    // If already visible or target changed, animate immediately
    const runAnimation = () => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { value, ref } = useCountUp(target);
  return (
    <div ref={ref} className="py-8 px-6 text-center">
      <p className="font-mono-data text-2xl sm:text-[28px] font-medium text-[#F0F5F3]">
        {value.toLocaleString("ru-RU")}{suffix}
      </p>
      <p className="label-upper mt-1.5">{label}</p>
    </div>
  );
}

const steps = [
  {
    icon: ShieldCheck,
    num: "01",
    title: "Верификация",
    desc: "Зелёный проект проходит проверку документов. Doc-hash фиксируется on-chain.",
  },
  {
    icon: CircleDollarSign,
    num: "02",
    title: "Инвестирование",
    desc: "Покупайте доли проекта за KZTE. Share-токены минтятся на ваш кошелёк.",
  },
  {
    icon: TrendingUp,
    num: "03",
    title: "Доход",
    desc: "Выручка от продажи кредитов распределяется пропорционально вашим долям.",
  },
  {
    icon: Flame,
    num: "04",
    title: "Retire",
    desc: "Кредиты сжигаются навсегда. RetireRecord on-chain — proof для аудиторов.",
  },
];

export default function LandingPage() {
  const [activeType, setActiveType] = useState("all");
  const { projects: onChainProjects, loading: projectsLoading } = useProjects();

  // Map on-chain projects to the Project type used by ProjectCard, fallback to mock
  const displayProjects: Project[] = useMemo(() => {
    if (onChainProjects.length === 0) return mockProjects;
    return onChainProjects.map((p) => {
      // Try to find matching mock for location/description/image
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

  const liveStats = [
    { value: totalCredits, suffix: " tCO\u2082", label: "\u0412\u0441\u0435\u0433\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432" },
    { value: totalRetired, suffix: " tCO\u2082", label: "\u041F\u043E\u0433\u0430\u0448\u0435\u043D\u043E" },
    { value: displayProjects.length, suffix: "", label: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432" },
    { value: Math.round(totalInvested), suffix: " \u20B8", label: "\u0418\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E" },
  ];

  const filtered = activeType === "all"
    ? displayProjects
    : displayProjects.filter((p) => p.projectType === activeType);

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0" />
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-5 gap-16 items-center">
            {/* Left — 3/5 */}
            <div className="lg:col-span-3">
              <div className="animate-in">
                <h1 className="font-heading text-[44px] sm:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em]">
                  Углеродный рынок<br />Казахстана.<br />
                  <span className="text-[#34D399]">Прозрачный. Токенизированный.</span>
                </h1>
              </div>

              <p className="animate-in delay-1 mt-6 text-[17px] leading-[1.6] text-[#8A9B94] max-w-[480px]">
                Покупайте, продавайте и погашайте верифицированные углеродные кредиты через смарт-контракты Solana
              </p>

              <div className="animate-in delay-2 mt-10 flex flex-wrap gap-3">
                <a
                  href="#projects"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-5 py-2.5 text-[14px] font-semibold text-[#060A08] hover:bg-[#059669] active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  Начать инвестировать
                  <ArrowRight size={15} strokeWidth={2} />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2A3832] px-5 py-2.5 text-[14px] font-medium text-[#8A9B94] hover:text-[#F0F5F3] hover:bg-[#1A2320] active:scale-[0.98] transition-all duration-200"
                >
                  Как это работает
                </a>
              </div>
            </div>

            {/* Right — 2/5: Live data widget */}
            <div className="lg:col-span-2 animate-in delay-3">
              <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="label-upper">Обзор платформы</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                    <span className="text-[11px] text-[#34D399] font-medium">Онлайн</span>
                  </span>
                </div>
                {[
                  { label: "Всего кредитов", value: `${totalCredits.toLocaleString("ru-RU")} tCO\u2082`, change: "" },
                  { label: "Погашено", value: `${totalRetired.toLocaleString("ru-RU")} tCO\u2082`, change: "" },
                  { label: "Активных проектов", value: `${displayProjects.length}`, change: "" },
                  { label: "Инвестировано", value: `${Math.round(totalInvested).toLocaleString("ru-RU")} \u20B8`, change: "" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-t border-[#1E2B26]">
                    <span className="text-[13px] text-[#8A9B94]">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-data text-[14px] text-[#F0F5F3]">{item.value}</span>
                      {item.change && (
                        <span className="text-[11px] font-medium text-[#34D399]">{item.change}</span>
                      )}
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
                Зелёные проекты
              </h2>
              <p className="mt-2 text-[15px] text-[#8A9B94]">
                Верифицированные проекты по сокращению CO&#x2082; в Казахстане
              </p>
            </div>

            <div className="flex gap-1 p-1 rounded-lg border border-[#1E2B26] bg-[#0C1210]">
              {projectTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 cursor-pointer
                    ${activeType === type.key
                      ? "bg-[rgba(16,185,129,0.1)] text-[#34D399]"
                      : "text-[#5A6D65] hover:text-[#8A9B94]"
                    }`}
                >
                  {type.label}
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
      <section id="how-it-works" className="py-20 border-t border-[#1E2B26] relative overflow-hidden">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-60 pointer-events-none" />
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-14">
            <h2 className="font-heading text-[28px] sm:text-[32px] font-bold tracking-[-0.02em]">
              Как это работает
            </h2>
            <p className="mt-2 text-[15px] text-[#8A9B94] max-w-[480px]">
              От верификации до гашения — полный цикл на Solana
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="group rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 transition-all duration-200 hover:border-[#2A3832] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(16,185,129,0.08)] flex items-center justify-center">
                    <step.icon size={18} strokeWidth={1.5} className="text-[#34D399]" />
                  </div>
                  <span className="text-[11px] font-medium text-[#5A6D65] tracking-widest">{step.num}</span>
                </div>
                <h3 className="font-heading text-[15px] font-semibold tracking-[-0.01em] mb-2">
                  {step.title}
                </h3>
                <p className="text-[13px] text-[#8A9B94] leading-[1.6]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#1E2B26] py-10 relative overflow-hidden">
        <div className="dot-grid-subtle dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
        <div className="mx-auto max-w-[1280px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-heading text-[14px] font-bold tracking-[-0.01em]">
            Carbon<span className="text-[#34D399]">KZ</span>
          </span>
          <div className="flex items-center gap-5 text-[12px] text-[#5A6D65]">
            <span>Solana</span>
            <span className="w-px h-3 bg-[#1E2B26]" />
            <span>KZTE Stablecoin</span>
            <span className="w-px h-3 bg-[#1E2B26]" />
            <span>Decentrathon 5.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
