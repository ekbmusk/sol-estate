"use client";

import { useState } from "react";
import { Check, Flame, ExternalLink, Award } from "lucide-react";
import RetirePanel from "@/components/RetirePanel";
import RetireCertificate from "@/components/RetireCertificate";
import CarbonCounter from "@/components/CarbonCounter";
import { useProjects } from "@/hooks/useProjects";
import { useRetireRecords } from "@/hooks/useRetireRecords";
import { useWallet } from "@solana/wallet-adapter-react";

export default function RetirePage() {
  const { publicKey } = useWallet();
  const { projects, loading, refetch } = useProjects();
  const { records: retireRecords, loading: recordsLoading, refetch: refetchRecords } = useRetireRecords();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [certRecordPda, setCertRecordPda] = useState<string | null>(null);

  const handleRetireSuccess = () => {
    refetch();
    refetchRecords();
  };

  const getProjectName = (projectPda: string) => {
    return projects.find((p) => p.pda === projectPda)?.name ?? projectPda.slice(0, 8) + "..."
  };

  const totalRetired = projects.reduce((sum, p) => sum + p.creditsRetired, 0);
  const verifiedProjects = projects.filter((p) => p.verified);
  const selectedProject = verifiedProjects.find((p) => p.id === selectedId);

  return (
    <div className="mx-auto max-w-[960px] px-6 py-16 relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="relative mb-12">
        <h1 className="font-heading text-[32px] font-bold tracking-[-0.02em] mb-3">
          Гашение кредитов
        </h1>
        <p className="text-[15px] text-[#8A9B94] max-w-[520px]">
          Гасите углеродные кредиты навсегда. Каждое гашение создаёт immutable proof on-chain.
          Double counting невозможен.
        </p>
      </div>

      {/* Counter */}
      {totalRetired > 0 && (
        <div className="relative rounded-xl border border-[#1E2B26] bg-[#0C1210] p-8 mb-10">
          <CarbonCounter target={totalRetired} label="тонн CO₂ погашено на платформе" />
        </div>
      )}

      <div className="relative grid gap-8 lg:grid-cols-5">
        {/* Left: select project + retire (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Project selector */}
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <p className="label-upper mb-4">Выберите проект для гашения</p>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg skeleton" />
                ))}
              </div>
            ) : !publicKey ? (
              <div className="rounded-lg bg-[#060A08] border border-[#2A3832] p-6 text-center">
                <p className="text-[13px] text-[#5A6D65]">Подключите кошелёк для загрузки проектов</p>
              </div>
            ) : verifiedProjects.length === 0 ? (
              <div className="rounded-lg bg-[#060A08] border border-[#2A3832] p-6 text-center">
                <p className="text-[13px] text-[#5A6D65]">
                  {projects.length === 0
                    ? "Нет проектов на блокчейне. Запустите setup-devnet скрипт."
                    : "Нет верифицированных проектов"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {verifiedProjects.map((p) => {
                  const available = p.totalCredits - p.creditsRetired;
                  const pct = p.totalCredits > 0 ? (p.creditsRetired / p.totalCredits) * 100 : 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left rounded-lg border p-4 transition-all cursor-pointer
                        ${selectedId === p.id
                          ? "border-[#F97316]/40 bg-[#F97316]/5"
                          : "border-[#1E2B26] bg-[#060A08] hover:border-[#2A3832]"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-medium">{p.name}</p>
                          <p className="text-[12px] text-[#5A6D65] mt-0.5">
                            {p.creditsRetired.toLocaleString("ru-RU")} / {p.totalCredits.toLocaleString("ru-RU")} т погашено
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono-data text-[14px] font-medium text-[#F97316]">
                            {available.toLocaleString("ru-RU")} т
                          </p>
                          <p className="text-[10px] text-[#5A6D65]">доступно</p>
                        </div>
                      </div>
                      <div className="mt-2.5 h-[3px] rounded-full bg-[#1E2B26] overflow-hidden">
                        <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Retire panel */}
          {selectedProject ? (
            <RetirePanel project={selectedProject} onSuccess={handleRetireSuccess} />
          ) : publicKey ? (
            <div className="rounded-xl border border-dashed border-[#2A3832] p-8 text-center">
              <Flame size={24} className="text-[#5A6D65] mx-auto mb-3" />
              <p className="text-[13px] text-[#5A6D65]">Выберите проект для гашения кредитов</p>
            </div>
          ) : null}
        </div>

        {/* Right: how it works (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steps */}
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em] mb-5">Как работает</h3>
            <div className="space-y-4">
              {[
                { n: "1", title: "Выберите проект", desc: "Определите проект для гашения", orange: false },
                { n: "2", title: "Количество и цель", desc: "Сколько тонн CO₂ и для чего", orange: false },
                { n: "3", title: "Burn токенов", desc: "SPL Token burn — навсегда", orange: true },
                { n: "4", title: "RetireRecord", desc: "Immutable PDA on-chain proof", orange: true },
              ].map((s) => (
                <div key={s.n} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-[11px] font-bold
                    ${s.orange
                      ? "bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]"
                      : "bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399]"
                    }`}>
                    {s.n}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{s.title}</p>
                    <p className="text-[11px] text-[#5A6D65]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why it matters */}
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-3">
            <h3 className="font-heading text-[14px] font-semibold text-[#34D399]">Почему это важно</h3>
            <ul className="space-y-2.5">
              {[
                ["Double counting невозможен", "сожжённый токен не существует"],
                ["Immutable proof", "RetireRecord PDA: кто, сколько, когда, зачем"],
                ["Верифицируемо", "любой проверит через Solana Explorer"],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.5]">
                  <Check size={14} strokeWidth={2} className="text-[#34D399] mt-0.5 shrink-0" />
                  <span className="text-[#8A9B94]">
                    <strong className="text-[#F0F5F3]">{title}</strong> — {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-4 text-center">
              <p className="font-mono-data text-xl font-bold text-[#F97316]">{totalRetired.toLocaleString("ru-RU")}</p>
              <p className="label-upper mt-1" style={{ fontSize: "9px" }}>тонн погашено</p>
            </div>
            <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-4 text-center">
              <p className="font-mono-data text-xl font-bold">{verifiedProjects.length}</p>
              <p className="label-upper mt-1" style={{ fontSize: "9px" }}>проектов</p>
            </div>
          </div>
        </div>
      </div>

      {/* Retire history */}
      {retireRecords.length > 0 && (
        <div className="relative mt-12">
          <h2 className="font-heading text-xl font-bold tracking-[-0.01em] mb-6">
            История гашений
          </h2>
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_1fr_40px_40px] gap-4 px-5 py-3 border-b border-[#1E2B26]">
              {["Проект", "Кто погасил", "Тонн", "Цель", "", ""].map((h, i) => (
                <span key={i} className="label-upper">{h}</span>
              ))}
            </div>

            {retireRecords.map((rec, i) => (
              <div key={rec.pda}>
                <div
                  className={`grid sm:grid-cols-[1fr_1fr_80px_1fr_40px_40px] gap-4 px-5 py-3.5 items-center
                    ${i > 0 ? "border-t border-[#1E2B26]" : ""}`}
                >
                  <span className="text-[13px] font-medium truncate">{getProjectName(rec.project)}</span>
                  <span className="font-mono-data text-[12px] text-[#5A6D65]">
                    {rec.buyer.slice(0, 4)}...{rec.buyer.slice(-4)}
                  </span>
                  <span className="font-mono-data text-[13px] font-medium text-[#F97316]">
                    {rec.amountRetired}
                  </span>
                  <span className="text-[12px] text-[#8A9B94] truncate">{rec.purpose}</span>
                  <button
                    onClick={() => setCertRecordPda(certRecordPda === rec.pda ? null : rec.pda)}
                    className={`transition-colors ${certRecordPda === rec.pda ? "text-[#34D399]" : "text-[#5A6D65] hover:text-[#34D399]"}`}
                    title="Сертификат"
                  >
                    <Award size={14} />
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${rec.pda}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5A6D65] hover:text-[#34D399] transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Certificate expand */}
                {certRecordPda === rec.pda && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#1E2B26]">
                    <RetireCertificate
                      record={rec}
                      projectName={getProjectName(rec.project)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
