"use client";

import { useState } from "react";
import { mockPortfolio } from "@/lib/mockData";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowUpRight, Wallet } from "lucide-react";

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const program = useCarbonProgram();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const totalValue = mockPortfolio.reduce((s, i) => s + i.sharesOwned * i.pricePerShare, 0);
  const totalDividends = mockPortfolio.reduce((s, i) => s + i.dividendsClaimed, 0);
  const totalClaimable = mockPortfolio.reduce((s, i) => s + i.claimableDividends, 0);

  const handleClaim = async (projectId: string) => {
    if (!connected || !publicKey || !program) return;
    setClaimingId(projectId);
    try {
      const [projectPda] = PublicKey.findProgramAddressSync([Buffer.from("project"), Buffer.from(projectId)], PROGRAM_ID);
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), Buffer.from(projectId)], PROGRAM_ID);
      const [investorRecordPda] = PublicKey.findProgramAddressSync([Buffer.from("investor"), projectPda.toBuffer(), publicKey.toBuffer()], PROGRAM_ID);
      const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);
      const investorKzteAccount = await getAssociatedTokenAddress(KZTE_MINT, publicKey);

      const sig = await program.methods.claimDividends().accounts({
        investor: publicKey, project: projectPda, vault: vaultPda,
        investorRecord: investorRecordPda, vaultTokenAccount, investorKzteAccount,
        kzteMint: KZTE_MINT, tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: PublicKey.default,
      }).rpc();

      toast.success("Дивиденды получены", {
        action: { label: "Explorer", onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank") },
      });
    } catch (err) {
      toast.error("Ошибка", { description: err instanceof Error ? err.message : "Транзакция не выполнена" });
    } finally {
      setClaimingId(null);
    }
  };

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-24 text-center relative overflow-hidden">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
        <div className="w-12 h-12 rounded-xl border border-[#1E2B26] bg-[#0C1210] flex items-center justify-center mx-auto mb-5">
          <Wallet size={20} strokeWidth={1.5} className="text-[#5A6D65]" />
        </div>
        <h1 className="font-heading text-[24px] font-bold tracking-[-0.02em] mb-2">
          {"\u041C\u043E\u0439 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044C"}
        </h1>
        <p className="text-[14px] text-[#5A6D65]">
          {"\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u043A\u043E\u0448\u0435\u043B\u0451\u043A \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <h1 className="font-heading text-[32px] font-bold tracking-[-0.02em] mb-8">
        {"\u041C\u043E\u0439 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044C"}
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Общая стоимость", value: `${totalValue.toLocaleString("ru-RU")} \u20B8`, color: "" },
          { label: "Получено дивидендов", value: `${totalDividends.toLocaleString("ru-RU")} \u20B8`, color: "" },
          { label: "К получению", value: `${totalClaimable.toLocaleString("ru-RU")} \u20B8`, color: "text-[#34D399]" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
            <p className="label-upper mb-2">{c.label}</p>
            <p className={`font-mono-data text-[22px] font-medium ${c.color || "text-[#F0F5F3]"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Holdings */}
      <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] overflow-hidden">
        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_100px_90px] gap-4 px-5 py-3 border-b border-[#1E2B26]">
          {["Проект", "Доли", "Стоимость", "Получено", "К выплате", ""].map((h) => (
            <span key={h} className="label-upper">{h}</span>
          ))}
        </div>

        {mockPortfolio.map((item, i) => (
          <div
            key={item.projectId}
            className={`grid sm:grid-cols-[1fr_80px_100px_100px_100px_90px] gap-4 px-5 py-4 items-center
              ${i > 0 ? "border-t border-[#1E2B26]" : ""} hover:bg-[#1A2320] transition-colors`}
          >
            <div>
              <Link href={`/project/${item.projectId}`} className="text-[14px] font-medium hover:text-[#34D399] transition-colors inline-flex items-center gap-1">
                {item.projectName}
                <ArrowUpRight size={12} strokeWidth={2} className="opacity-0 group-hover:opacity-100" />
              </Link>
              <p className="text-[12px] text-[#5A6D65] mt-0.5">{item.location}</p>
            </div>
            <span className="font-mono-data text-[13px]">{item.sharesOwned}</span>
            <span className="font-mono-data text-[13px]">{(item.sharesOwned * item.pricePerShare).toLocaleString("ru-RU")} {"\u20B8"}</span>
            <span className="font-mono-data text-[13px] text-[#8A9B94]">{item.dividendsClaimed.toLocaleString("ru-RU")} {"\u20B8"}</span>
            <span className="font-mono-data text-[13px] text-[#34D399]">{item.claimableDividends.toLocaleString("ru-RU")} {"\u20B8"}</span>
            <button
              onClick={() => handleClaim(item.projectId)}
              disabled={item.claimableDividends <= 0 || claimingId === item.projectId}
              className="text-[12px] font-medium text-[#34D399] hover:underline disabled:text-[#5A6D65] disabled:no-underline cursor-pointer disabled:cursor-default transition-colors"
            >
              {claimingId === item.projectId ? "..." : "Получить"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
