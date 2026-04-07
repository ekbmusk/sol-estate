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

// removed — replaced with inline sections in how-it-works

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

  const filteredRaw = activeType === "all"
    ? displayProjects
    : displayProjects.filter((p) => p.projectType === activeType);
  // Always put ses-yasavi first
  const filtered = [...filteredRaw].sort((a, b) => {
    if (a.id === "ses-yasavi") return -1;
    if (b.id === "ses-yasavi") return 1;
    return 0;
  });

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0" />
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-[1280px] px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            {/* Left — 3/5 */}
            <div className="lg:col-span-3">
              <div className="animate-in">
                <h1 className="font-heading text-[32px] sm:text-[44px] md:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.02em]">
                  Углеродный рынок<br className="hidden sm:block" /> Казахстана.<br />
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

            <div className="flex gap-1 p-1 rounded-lg border border-[#1E2B26] bg-[#0C1210] overflow-x-auto">
              {projectTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap
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
      <section id="how-it-works" className="py-16 sm:py-24 border-t border-[#1E2B26] relative overflow-hidden">
        {/* Subtle radial glow instead of dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(16,185,129,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(249,115,22,0.03) 0%, transparent 70%)"
        }} />

        <div className="relative mx-auto max-w-[1280px] px-6 space-y-16 sm:space-y-24">

          {/* --- Проблема --- */}
          <div className="max-w-[800px]">
            <p className="label-upper mb-5 text-[#F97316]">Проблема</p>
            <h2 className="font-heading text-[24px] sm:text-[32px] md:text-[40px] font-bold tracking-[-0.02em] leading-[1.15] mb-6 sm:mb-8">
              Казахстан входит в топ-10 стран мира по углеродоёмкости ВВП
            </h2>
            <p className="text-[15px] sm:text-[17px] text-[#B0BDB7] leading-[1.8] mb-5">
              349 млн тонн CO₂ в год. 17.5 тонн на человека — почти в 3 раза выше среднего по ОЭСР.
              Рынок углеродных кредитов существует с 2013 года (KZ ETS), но фактически мёртв:
              $1 за тонну при $91 в Евросоюзе, всего 135 участников, только спот, без деривативов.
            </p>
            <p className="text-[15px] sm:text-[17px] text-[#B0BDB7] leading-[1.8]">
              Цель правительства — $50 за тонну к 2030 году (×50 рост).
              World Bank выделил $4.8 млн на развитие рынка. Но банки и финансовые институты
              не допущены к торгам на Caspy Exchange — по закону участвовать могут только промышленные
              эмитенты. Прозрачность нулевая. Двойной учёт кредитов — норма.
            </p>
          </div>

          {/* --- Для кого --- */}
          <div>
            <p className="label-upper mb-8 text-[#34D399]">Для кого</p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center mb-5">
                  <CircleDollarSign size={24} strokeWidth={1.5} className="text-[#34D399]" />
                </div>
                <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold mb-3">Инвесторы</h3>
                <p className="text-[14px] sm:text-[15px] text-[#B0BDB7] leading-[1.7]">
                  Покупайте доли зелёных проектов за тенге. Получайте дивиденды от продажи углеродных кредитов.
                  Цена кредита $1 сегодня → цель $50 к 2030. Потенциальный ROI — ×50. Комиссия платформы — 1.5%.
                </p>
              </div>
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mb-5">
                  <Flame size={24} strokeWidth={1.5} className="text-[#F97316]" />
                </div>
                <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold mb-3">Компании-загрязнители</h3>
                <p className="text-[14px] sm:text-[15px] text-[#B0BDB7] leading-[1.7]">
                  КазМунайГаз, ArcelorMittal, угольные ТЭЦ — 135 предприятий обязаны
                  компенсировать выбросы. Прозрачная покупка и гашение кредитов с доказательством на блокчейне.
                </p>
              </div>
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center mb-5">
                  <ShieldCheck size={24} strokeWidth={1.5} className="text-[#60A5FA]" />
                </div>
                <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold mb-3">Зелёные проекты</h3>
                <p className="text-[14px] sm:text-[15px] text-[#B0BDB7] leading-[1.7]">
                  Солнечные станции, ветропарки, лесовосстановление — получают финансирование
                  напрямую от инвесторов. Верификация и все расчёты прозрачны.
                </p>
              </div>
            </div>
          </div>

          {/* --- Как работает --- */}
          <div>
            <p className="label-upper mb-8">Как это работает</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-9 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#34D399] text-[#060A08] flex items-center justify-center text-[15px] font-bold shrink-0">1</span>
                  <h3 className="font-heading text-[20px] font-semibold">Проект проходит проверку</h3>
                </div>
                <p className="text-[16px] text-[#B0BDB7] leading-[1.8]">
                  Владелец солнечной станции или ветропарка загружает документы.
                  Хеш сертификата записывается на блокчейн — его нельзя подделать или изменить.
                  Независимый верификатор подтверждает проект.
                </p>
              </div>
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-9 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#34D399] text-[#060A08] flex items-center justify-center text-[15px] font-bold shrink-0">2</span>
                  <h3 className="font-heading text-[20px] font-semibold">Инвестор покупает доли</h3>
                </div>
                <p className="text-[16px] text-[#B0BDB7] leading-[1.8]">
                  Вы выбираете проект и покупаете доли за KZTE (1 KZTE = 1 тенге).
                  Деньги уходят в защищённое хранилище проекта. Вам на кошелёк приходят
                  токены-доли — подтверждение вашей инвестиции.
                </p>
              </div>
              <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 sm:p-9 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#34D399] text-[#060A08] flex items-center justify-center text-[15px] font-bold shrink-0">3</span>
                  <h3 className="font-heading text-[20px] font-semibold">Загрязнители платят — вы получаете</h3>
                </div>
                <p className="text-[16px] text-[#B0BDB7] leading-[1.8]">
                  Заводы и ТЭЦ покупают углеродные кредиты у проекта.
                  Выручка автоматически распределяется между всеми инвесторами
                  пропорционально долям. Забираете дивиденды одной кнопкой. До $25 000/год с 10% доли при $50/т.
                </p>
              </div>
              <div className="rounded-2xl border border-[#F97316]/30 bg-[#1A0F08] p-9 space-y-5">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#F97316] text-[#060A08] flex items-center justify-center text-[15px] font-bold shrink-0">4</span>
                  <h3 className="font-heading text-[20px] font-semibold text-[#F97316]">Гашение — доказательство навсегда</h3>
                </div>
                <p className="text-[16px] text-[#B0BDB7] leading-[1.8]">
                  Когда компания компенсирует свои выбросы, углеродные токены сжигаются навсегда.
                  На блокчейне остаётся запись: кто погасил, сколько тонн, когда и зачем.
                  Использовать один кредит дважды невозможно — его просто больше не существует.
                </p>
              </div>
            </div>
          </div>

          {/* --- Почему Solana --- */}
          <div className="max-w-[800px]">
            <p className="label-upper mb-6 text-[#A78BFA]">Почему Solana</p>
            <div className="space-y-6">
              {[
                ["Прозрачность", "Все операции видны на блокчейне. Любой может проверить: сколько кредитов выпущено, кто купил, кто погасил."],
                ["Скорость и стоимость", "Транзакция занимает 0.4 секунды и стоит меньше 1 тенге. Для сравнения — Ethereum: минуты и тысячи тенге."],
                ["Невозможность подделки", "Хеш документа, гашение кредитов, дивиденды — всё записано навечно. Изменить задним числом нельзя."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-5">
                  <div className="w-2 h-2 rounded-full bg-[#A78BFA] mt-2.5 shrink-0" />
                  <div>
                    <p className="text-[17px] font-medium text-[#F0F5F3]">{title}</p>
                    <p className="text-[15px] text-[#B0BDB7] leading-[1.7] mt-1">{desc}</p>
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
