"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { simulateTransaction } from "@/lib/utils";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useKzte } from "@/hooks/useKzte";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowUpRight, Wallet, Droplets } from "lucide-react";
import ListSharesModal from "@/components/ListSharesModal";
import CreditsPieChart from "@/components/CreditsPieChart";
import { useProjects } from "@/hooks/useProjects";
import { type Project } from "@/lib/mockData";
import { localeToBcp47 } from "@/lib/format";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const program = useCarbonProgram();
  const { items, loading, refetch } = usePortfolio();
  const { balance: kzteBalance } = useKzte();
  const { projects: onChainProjects } = useProjects();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const totalValue = items.reduce((s, i) => s + i.sharesOwned * i.pricePerShare, 0);
  const totalClaimable = items.reduce((s, i) => s + i.claimableDividends, 0);

  const investedProjects: Project[] = items
    .map((item) => {
      const p = onChainProjects.find((pr) => pr.id === item.projectId);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        location: "",
        description: "",
        projectType: p.projectType as Project["projectType"],
        totalCredits: item.sharesOwned,
        creditsRetired: 0,
        totalShares: p.totalShares,
        sharesSold: p.sharesSold,
        pricePerShare: p.pricePerShare,
        verified: p.verified,
        status: p.status as Project["status"],
        imageUrl: "",
        documentHash: "",
      };
    })
    .filter((p): p is Project => p !== null);

  const tenge = tCommon("units.tenge");
  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(bcp, opts);

  const handleClaim = async (projectId: string) => {
    if (!connected || !publicKey || !program) return;
    setClaimingId(projectId);
    try {
      const [projectPda] = PublicKey.findProgramAddressSync([Buffer.from("project"), Buffer.from(projectId)], PROGRAM_ID);
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(projectId)], PROGRAM_ID);
      const [investorRecordPda] = PublicKey.findProgramAddressSync([Buffer.from("investor"), projectPda.toBuffer(), publicKey.toBuffer()], PROGRAM_ID);
      const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);
      const investorKzteAccount = await getAssociatedTokenAddress(KZTE_MINT, publicKey);

      const accounts = {
        investor: publicKey, project: projectPda, vault: vaultPda,
        investorRecord: investorRecordPda, vaultTokenAccount, investorKzteAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any;

      const tx = await program.methods.claimDividends().accounts(accounts).transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods.claimDividends().accounts(accounts).rpc();

      toast.success(t("toasts.claimSuccess"), {
        action: { label: "Explorer", onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank") },
      });
      refetch();
    } catch (err) {
      toast.error(t("toasts.claimError"), { description: err instanceof Error ? err.message : t("toasts.txFailed") });
    } finally {
      setClaimingId(null);
    }
  };

  const handleFaucet = async () => {
    if (!publicKey) return;
    setFaucetLoading(true);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toString() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t("toasts.faucetTitle"), { description: data.error });
        return;
      }
      toast.success(t("toasts.faucetReceived"), {
        action: {
          label: "Explorer",
          onClick: () => window.open(data.explorer, "_blank"),
        },
      });
    } catch (err) {
      toast.error(t("toasts.faucetError"), {
        description: err instanceof Error ? err.message : t("toasts.unknownError"),
      });
    } finally {
      setFaucetLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-24 text-center relative overflow-hidden">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
        <div className="w-12 h-12 rounded-xl border border-[#1E2B26] bg-[#0C1210] flex items-center justify-center mx-auto mb-5">
          <Wallet size={20} strokeWidth={1.5} className="text-[#5A6D65]" />
        </div>
        <h1 className="font-heading text-[24px] font-bold tracking-[-0.02em] mb-2">{t("title")}</h1>
        <p className="text-[14px] text-[#5A6D65]">{t("connectHint")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] sm:text-[32px] font-bold tracking-[-0.02em]">{t("title")}</h1>
        <div className="flex items-center gap-3">
          {kzteBalance !== null && (
            <div className="rounded-lg border border-[#1E2B26] bg-[#0C1210] px-4 py-2">
              <p className="label-upper mb-0.5">{t("balanceLabel")}</p>
              <p className="font-mono-data text-[16px] font-medium text-[#34D399]">
                {fmt(kzteBalance)} {tenge}
              </p>
            </div>
          )}
          <button
            onClick={handleFaucet}
            disabled={faucetLoading}
            className="flex items-center gap-2 rounded-lg border border-[#34D399]/30 bg-[#34D399]/5 px-4 py-2.5 text-[13px] font-medium text-[#34D399] hover:bg-[#34D399]/10 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default"
          >
            <Droplets size={14} />
            {faucetLoading ? "..." : t("faucetCta")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: t("summary.totalValue"), value: `${fmt(totalValue)} ${tenge}`, color: "" },
          { label: t("summary.investments"), value: `${items.length}`, color: "" },
          { label: t("summary.claimable"), value: `${fmt(totalClaimable, { maximumFractionDigits: 2 })} ${tenge}`, color: "text-[#34D399]" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
            <p className="label-upper mb-2">{c.label}</p>
            <p className={`font-mono-data text-[22px] font-medium ${c.color || "text-[#F0F5F3]"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {investedProjects.length > 0 && (
        <div className="mb-10 max-w-[360px]">
          <CreditsPieChart projects={investedProjects} />
        </div>
      )}

      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[14px] text-[#5A6D65] mb-1">{t("noInvestments")}</p>
            <p className="text-[12px] text-[#3D5048]">
              {t("goToCatalog")} <Link href="/" className="text-[#34D399] hover:underline">{t("catalogLink")}</Link> {t("toStart")}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px_80px] gap-4 px-5 py-3 border-b border-[#1E2B26]">
              {[t("tableHeaders.project"), t("tableHeaders.shares"), t("tableHeaders.value"), t("tableHeaders.claimable"), "", ""].map((h, i) => (
                <span key={i} className="label-upper">{h}</span>
              ))}
            </div>

            {items.map((item, i) => (
              <div
                key={item.projectId}
                className={`px-5 py-4 ${i > 0 ? "border-t border-[#1E2B26]" : ""} hover:bg-[#1A2320] transition-colors`}
              >
                <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_80px_80px] gap-4 items-center">
                  <div>
                    <Link href={`/project/${item.projectId}`} className="text-[14px] font-medium hover:text-[#34D399] transition-colors inline-flex items-center gap-1">
                      {item.projectName}
                      <ArrowUpRight size={12} strokeWidth={2} className="opacity-40" />
                    </Link>
                  </div>
                  <span className="font-mono-data text-[13px]">{fmt(item.sharesOwned)}</span>
                  <span className="font-mono-data text-[13px]">{fmt(item.sharesOwned * item.pricePerShare)} {tenge}</span>
                  <span className="font-mono-data text-[13px] text-[#34D399]">
                    {item.claimableDividends > 0
                      ? `${fmt(item.claimableDividends, { maximumFractionDigits: 2 })} ${tenge}`
                      : "—"}
                  </span>
                  <button
                    onClick={() => handleClaim(item.projectId)}
                    disabled={item.claimableDividends <= 0 || claimingId === item.projectId}
                    className="text-[12px] font-medium text-[#34D399] hover:underline disabled:text-[#5A6D65] disabled:no-underline cursor-pointer disabled:cursor-default transition-colors"
                  >
                    {claimingId === item.projectId ? "..." : t("claimButton")}
                  </button>
                  {item.sharesOwned > 0 && (
                    <ListSharesModal
                      projectId={item.projectId}
                      projectName={item.projectName}
                      sharesOwned={item.sharesOwned}
                      currentPrice={item.pricePerShare}
                      onSuccess={refetch}
                    />
                  )}
                </div>

                <div className="sm:hidden space-y-3">
                  <Link href={`/project/${item.projectId}`} className="text-[14px] font-medium hover:text-[#34D399] transition-colors inline-flex items-center gap-1">
                    {item.projectName}
                    <ArrowUpRight size={12} strokeWidth={2} className="opacity-40" />
                  </Link>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">{t("tableHeaders.shares")}</p>
                      <p className="font-mono-data text-[13px] mt-0.5">{fmt(item.sharesOwned)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">{t("tableHeaders.value")}</p>
                      <p className="font-mono-data text-[13px] mt-0.5">{fmt(item.sharesOwned * item.pricePerShare)} {tenge}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">{t("tableHeaders.claimable")}</p>
                      <p className="font-mono-data text-[13px] text-[#34D399] mt-0.5">
                        {item.claimableDividends > 0
                          ? `${fmt(item.claimableDividends, { maximumFractionDigits: 2 })} ${tenge}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClaim(item.projectId)}
                      disabled={item.claimableDividends <= 0 || claimingId === item.projectId}
                      className="flex-1 rounded-lg border border-[#34D399]/30 py-1.5 text-[12px] font-medium text-[#34D399] hover:bg-[#34D399]/10 disabled:text-[#5A6D65] disabled:border-[#1E2B26] cursor-pointer disabled:cursor-default transition-colors"
                    >
                      {claimingId === item.projectId ? "..." : t("claimButton")}
                    </button>
                    {item.sharesOwned > 0 && (
                      <ListSharesModal
                        projectId={item.projectId}
                        projectName={item.projectName}
                        sharesOwned={item.sharesOwned}
                        currentPrice={item.pricePerShare}
                        onSuccess={refetch}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
