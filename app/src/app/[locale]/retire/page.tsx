"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check, Flame, ExternalLink, Award, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import RetirePanel from "@/components/RetirePanel";
import RetireCertificate from "@/components/RetireCertificate";
import CarbonCounter from "@/components/CarbonCounter";
import { useProjects } from "@/hooks/useProjects";
import { useRetireRecords } from "@/hooks/useRetireRecords";
import { useWallet } from "@solana/wallet-adapter-react";
import { localeToBcp47 } from "@/lib/format";

export default function RetirePage() {
  const t = useTranslations("retire");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const { publicKey } = useWallet();
  const { projects, loading, refetch } = useProjects();
  const { records: retireRecords, refetch: refetchRecords } = useRetireRecords();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [certRecordPda, setCertRecordPda] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(10);
  const [buyingCarbon, setBuyingCarbon] = useState(false);

  const fmt = (n: number) => n.toLocaleString(bcp);

  const handleBuyCarbon = async () => {
    if (!publicKey || !selectedId) return;
    setBuyingCarbon(true);
    try {
      const res = await fetch("/api/carbon-faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString(), projectId: selectedId, amount: buyAmount }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(t("toasts.buyError"), { description: data.error }); return; }
      toast.success(t("toasts.buySuccess", { count: data.amount }), {
        action: { label: "Explorer", onClick: () => window.open(data.explorer, "_blank") },
      });
      refetch();
    } catch (err) {
      toast.error(t("toasts.buyError"), { description: err instanceof Error ? err.message : t("toasts.unknownError") });
    } finally {
      setBuyingCarbon(false);
    }
  };

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
    <div className="mx-auto max-w-[960px] px-6 py-8 sm:py-16 relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />

      <div className="relative mb-12">
        <h1 className="font-heading text-[32px] font-bold tracking-[-0.02em] mb-3">
          {t("title")}
        </h1>
        <p className="text-[15px] text-[#8A9B94] max-w-[520px]">
          {t("subtitle")}
        </p>
      </div>

      {totalRetired > 0 && (
        <div className="relative rounded-xl border border-[#1E2B26] bg-[#0C1210] p-8 mb-10">
          <CarbonCounter target={totalRetired} label={t("counterLabel")} />
        </div>
      )}

      <div className="relative grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <p className="label-upper mb-4">{t("selectProject")}</p>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg skeleton" />
                ))}
              </div>
            ) : !publicKey ? (
              <div className="rounded-lg bg-[#060A08] border border-[#2A3832] p-6 text-center">
                <p className="text-[13px] text-[#5A6D65]">{t("connectToLoad")}</p>
              </div>
            ) : verifiedProjects.length === 0 ? (
              <div className="rounded-lg bg-[#060A08] border border-[#2A3832] p-6 text-center">
                <p className="text-[13px] text-[#5A6D65]">
                  {projects.length === 0
                    ? t("noProjectsBlockchain")
                    : t("noVerified")}
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
                            {t("retiredOf", { retired: fmt(p.creditsRetired), total: fmt(p.totalCredits) })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono-data text-[14px] font-medium text-[#F97316]">
                            {fmt(available)} {t("tonneShort")}
                          </p>
                          <p className="text-[10px] text-[#5A6D65]">{t("available")}</p>
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

          {selectedProject && publicKey && (
            <div className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={16} className="text-[#F97316]" />
                <p className="text-[14px] font-medium">{t("buyHeader")}</p>
              </div>
              <p className="text-[12px] text-[#8A9B94] mb-4">
                {t("buyHint", { name: selectedProject.name })}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={selectedProject.totalCredits - selectedProject.creditsRetired}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(Math.max(1, Number(e.target.value)))}
                  className="flex h-9 w-24 rounded-md border border-[#1E2B26] bg-[#060A08] px-3 text-sm font-mono-data text-[#F0F5F3] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F97316]/50"
                />
                <span className="text-[12px] text-[#5A6D65]">{t("tonnesCO2")}</span>
                <button
                  onClick={handleBuyCarbon}
                  disabled={buyingCarbon}
                  className="ml-auto flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-semibold text-[#060A08] hover:bg-[#EA580C] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
                >
                  {buyingCarbon ? "..." : t("buyCta")}
                </button>
              </div>
            </div>
          )}

          {selectedProject ? (
            <RetirePanel project={selectedProject} onSuccess={handleRetireSuccess} />
          ) : publicKey ? (
            <div className="rounded-xl border border-dashed border-[#2A3832] p-8 text-center">
              <Flame size={24} className="text-[#5A6D65] mx-auto mb-3" />
              <p className="text-[13px] text-[#5A6D65]">{t("selectToRetire")}</p>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em] mb-5">{t("howTitle")}</h3>
            <div className="space-y-4">
              {([
                { n: "1", titleKey: "step1Title", descKey: "step1Desc", orange: false },
                { n: "2", titleKey: "step2Title", descKey: "step2Desc", orange: false },
                { n: "3", titleKey: "step3Title", descKey: "step3Desc", orange: true },
                { n: "4", titleKey: "step4Title", descKey: "step4Desc", orange: true },
              ] as const).map((s) => (
                <div key={s.n} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-[11px] font-bold
                    ${s.orange
                      ? "bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]"
                      : "bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399]"
                    }`}>
                    {s.n}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{t(`steps.${s.titleKey}`)}</p>
                    <p className="text-[11px] text-[#5A6D65]">{t(`steps.${s.descKey}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 space-y-3">
            <h3 className="font-heading text-[14px] font-semibold text-[#34D399]">{t("whyTitle")}</h3>
            <ul className="space-y-2.5">
              {([
                ["noDoubleTitle", "noDoubleDesc"],
                ["immutableTitle", "immutableDesc"],
                ["verifiableTitle", "verifiableDesc"],
              ] as const).map(([titleKey, descKey]) => (
                <li key={titleKey} className="flex items-start gap-2.5 text-[13px] leading-[1.5]">
                  <Check size={14} strokeWidth={2} className="text-[#34D399] mt-0.5 shrink-0" />
                  <span className="text-[#8A9B94]">
                    <strong className="text-[#F0F5F3]">{t(`why.${titleKey}`)}</strong> — {t(`why.${descKey}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-4 text-center">
              <p className="font-mono-data text-xl font-bold text-[#F97316]">{fmt(totalRetired)}</p>
              <p className="label-upper mt-1" style={{ fontSize: "9px" }}>{t("statsRetired")}</p>
            </div>
            <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-4 text-center">
              <p className="font-mono-data text-xl font-bold">{verifiedProjects.length}</p>
              <p className="label-upper mt-1" style={{ fontSize: "9px" }}>{t("statsProjects")}</p>
            </div>
          </div>
        </div>
      </div>

      {retireRecords.length > 0 && (
        <div className="relative mt-12">
          <h2 className="font-heading text-xl font-bold tracking-[-0.01em] mb-6">
            {t("historyTitle")}
          </h2>
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_1fr_40px_40px] gap-4 px-5 py-3 border-b border-[#1E2B26]">
              {[t("history.project"), t("history.who"), t("history.tonnes"), t("history.purpose"), "", ""].map((h, i) => (
                <span key={i} className="label-upper">{h}</span>
              ))}
            </div>

            {retireRecords.map((rec, i) => (
              <div key={rec.pda}>
                <div className={`px-5 py-3.5 ${i > 0 ? "border-t border-[#1E2B26]" : ""}`}>
                  <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_1fr_40px_40px] gap-4 items-center">
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
                      title={t("history.certificate")}
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

                  <div className="sm:hidden space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium truncate">{getProjectName(rec.project)}</span>
                      <span className="font-mono-data text-[14px] font-medium text-[#F97316]">
                        {rec.amountRetired} {t("tonneShort")}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8A9B94]">{rec.purpose}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-data text-[11px] text-[#5A6D65]">
                        {rec.buyer.slice(0, 4)}...{rec.buyer.slice(-4)}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCertRecordPda(certRecordPda === rec.pda ? null : rec.pda)}
                          className={`transition-colors ${certRecordPda === rec.pda ? "text-[#34D399]" : "text-[#5A6D65] hover:text-[#34D399]"}`}
                          title={t("history.certificate")}
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
                    </div>
                  </div>
                </div>

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
