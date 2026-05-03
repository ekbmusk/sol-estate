"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeftRight, BookOpen, BarChart3, History } from "lucide-react";
import { useTradeHistory } from "@/hooks/useTradeHistory";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";
import { useProjects } from "@/hooks/useProjects";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { simulateTransaction } from "@/lib/utils";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import { localeToBcp47 } from "@/lib/format";

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const program = useCarbonProgram();
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { projects } = useProjects();
  const [buyingPda, setBuyingPda] = useState<string | null>(null);
  const { trades, loading: tradesLoading } = useTradeHistory();

  const features = [
    { icon: ArrowLeftRight, titleKey: "p2pTitle", descKey: "p2pDesc" },
    { icon: BookOpen, titleKey: "orderbookTitle", descKey: "orderbookDesc" },
    { icon: BarChart3, titleKey: "pricingTitle", descKey: "pricingDesc" },
  ] as const;

  const tenge = tCommon("units.tenge");
  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(bcp, opts);

  const getProjectName = (projectPda: string) => {
    const p = projects.find((pr) => pr.pda === projectPda);
    return p?.name ?? projectPda.slice(0, 8) + "...";
  };

  const getProjectId = (projectPda: string) => {
    return projects.find((pr) => pr.pda === projectPda)?.id ?? null;
  };

  const handleBuy = async (listing: (typeof listings)[0]) => {
    if (!connected || !publicKey || !program) {
      toast.error(t("toasts.connectWallet"));
      return;
    }

    const projectId = getProjectId(listing.project);
    if (!projectId) {
      toast.error(t("toasts.projectNotFound"));
      return;
    }

    setBuyingPda(listing.pda);
    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), Buffer.from(projectId)],
        PROGRAM_ID
      );
      const [shareMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("share_mint"), Buffer.from(projectId)],
        PROGRAM_ID
      );

      const sellerPubkey = new PublicKey(listing.seller);
      const listingPda = new PublicKey(listing.pda);

      const buyerKzteAta = await getAssociatedTokenAddress(KZTE_MINT, publicKey);
      const sellerKzteAta = await getAssociatedTokenAddress(KZTE_MINT, sellerPubkey);
      const escrowShareAta = await getAssociatedTokenAddress(shareMintPda, listingPda, true);
      const buyerShareAta = await getAssociatedTokenAddress(shareMintPda, publicKey);

      const [buyerRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("investor"), projectPda.toBuffer(), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [sellerRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("investor"), projectPda.toBuffer(), sellerPubkey.toBuffer()],
        PROGRAM_ID
      );

      const accounts = {
        buyer: publicKey,
        seller: sellerPubkey,
        project: projectPda,
        vault: vaultPda,
        listing: listingPda,
        buyerKzteAccount: buyerKzteAta,
        sellerKzteAccount: sellerKzteAta,
        escrowShareAccount: escrowShareAta,
        buyerShareAccount: buyerShareAta,
        shareMint: shareMintPda,
        buyerRecord: buyerRecordPda,
        sellerRecord: sellerRecordPda,
        systemProgram: PublicKey.default,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      };

      const tx = await program.methods.buyShares().accounts(accounts).transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods.buyShares().accounts(accounts).rpc();

      toast.success(t("toasts.buySuccess"), {
        description: t("toasts.buySuccessDesc", { amount: listing.amount }),
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
        },
      });
      refetchListings();
    } catch (err) {
      toast.error(t("toasts.buyError"), {
        description: err instanceof Error ? err.message : t("toasts.unknownError"),
      });
    } finally {
      setBuyingPda(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 sm:py-16 relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />

      <div className="relative max-w-[640px] mx-auto text-center mb-8 sm:mb-14">
        <h1 className="font-heading text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] mb-3">
          {t("title")}
        </h1>
        <p className="text-[15px] text-[#8A9B94] leading-[1.6]">
          {t("subtitle")}
        </p>
      </div>

      <div className="relative grid sm:grid-cols-3 gap-5 max-w-[900px] mx-auto mb-12">
        {features.map((f) => (
          <div key={f.titleKey} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <div className="w-9 h-9 rounded-lg bg-[rgba(52,211,153,0.08)] flex items-center justify-center mb-4">
              <f.icon size={18} strokeWidth={1.5} className="text-[#34D399]" />
            </div>
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em] mb-2">{t(`features.${f.titleKey}`)}</h3>
            <p className="text-[13px] text-[#8A9B94] leading-[1.6]">{t(`features.${f.descKey}`)}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-[900px] mx-auto">
        <h2 className="font-heading text-xl font-bold tracking-[-0.01em] mb-6">
          {t("activeListings")}
        </h2>

        {listingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl skeleton" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-10 text-center">
            <ArrowLeftRight size={32} className="text-[#2A3832] mx-auto mb-4" />
            <p className="text-[14px] text-[#5A6D65] mb-1">{t("noListings")}</p>
            <p className="text-[12px] text-[#3D5048]">
              {publicKey
                ? t("noListingsHintConnected")
                : t("noListingsHintDisconnected")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2">
              <span className="label-upper">{t("table.project")}</span>
              <span className="label-upper">{t("table.seller")}</span>
              <span className="label-upper text-right">{t("table.amount")}</span>
              <span className="label-upper text-right">{t("table.pricePerShare")}</span>
              <span className="label-upper text-right">{t("table.total")}</span>
            </div>

            {listings.map((listing) => {
              const total = listing.amount * listing.pricePerShare;
              const isSelf = publicKey?.toString() === listing.seller;

              return (
                <div
                  key={listing.pda}
                  className="rounded-xl border border-[#1E2B26] bg-[#0C1210] px-5 py-4"
                >
                  <div className="hidden sm:grid grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-[13px] font-medium truncate">{getProjectName(listing.project)}</p>
                    </div>
                    <div>
                      <a
                        href={`https://explorer.solana.com/address/${listing.seller}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-data text-[12px] text-[#5A6D65] hover:text-[#34D399] transition-colors"
                      >
                        {listing.seller.slice(0, 4)}...{listing.seller.slice(-4)}
                        {isSelf && <span className="text-[#34D399] ml-1">{t("you")}</span>}
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data text-[13px]">{fmt(listing.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data text-[13px]">{fmt(listing.pricePerShare)} {tenge}</p>
                    </div>
                    <div className="text-right flex items-center justify-end gap-3">
                      <p className="font-mono-data text-[13px] font-medium text-[#34D399]">
                        {fmt(total)} {tenge}
                      </p>
                      {!isSelf && connected && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#34D399]/30 text-[#34D399] hover:bg-[#34D399]/10 text-[11px] h-7 px-3 cursor-pointer"
                          disabled={buyingPda === listing.pda}
                          onClick={() => handleBuy(listing)}
                        >
                          {buyingPda === listing.pda ? "..." : t("buyButton")}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-medium truncate">{getProjectName(listing.project)}</p>
                      <a
                        href={`https://explorer.solana.com/address/${listing.seller}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-data text-[11px] text-[#5A6D65] hover:text-[#34D399] transition-colors"
                      >
                        {listing.seller.slice(0, 4)}...{listing.seller.slice(-4)}
                        {isSelf && <span className="text-[#34D399] ml-1">{t("you")}</span>}
                      </a>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">{t("table.amount")}</p>
                        <p className="font-mono-data text-[13px] mt-0.5">{fmt(listing.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">{t("table.price")}</p>
                        <p className="font-mono-data text-[13px] mt-0.5">{fmt(listing.pricePerShare)} {tenge}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">{t("table.total")}</p>
                        <p className="font-mono-data text-[13px] font-medium text-[#34D399] mt-0.5">{fmt(total)} {tenge}</p>
                      </div>
                    </div>
                    {!isSelf && connected && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-[#34D399]/30 text-[#34D399] hover:bg-[#34D399]/10 text-[12px] h-8 cursor-pointer"
                        disabled={buyingPda === listing.pda}
                        onClick={() => handleBuy(listing)}
                      >
                        {buyingPda === listing.pda ? "..." : t("buyButton")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(trades.length > 0 || tradesLoading) && (
        <div className="relative max-w-[900px] mx-auto mt-12">
          <div className="flex items-center gap-2 mb-6">
            <History size={18} className="text-[#5A6D65]" />
            <h2 className="font-heading text-xl font-bold tracking-[-0.01em]">
              {t("tradesTitle")}
            </h2>
          </div>

          {tradesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-20 rounded skeleton" />
                      <div className="h-4 w-24 rounded skeleton" />
                      <div className="h-3 w-4 rounded skeleton" />
                      <div className="h-4 w-24 rounded skeleton" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-16 rounded skeleton" />
                      <div className="h-4 w-20 rounded skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="space-y-2">
            {trades.map((trade) => {
              const isBuyer = publicKey?.toString() === trade.buyer;
              const isSeller = publicKey?.toString() === trade.seller;
              const costDisplay = fmt(trade.totalCost / 1_000_000);
              const time = trade.timestamp
                ? new Date(trade.timestamp * 1000).toLocaleDateString(bcp, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div key={trade.signature} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] px-5 py-4">
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] text-[#5A6D65]">{time}</span>
                      <span className="font-mono-data text-[12px] text-[#8A9B94]">
                        {trade.buyer.slice(0, 4)}...{trade.buyer.slice(-4)}
                        {isBuyer && <span className="text-[#34D399] ml-1">{t("you")}</span>}
                      </span>
                      <span className="text-[11px] text-[#5A6D65]">→</span>
                      <span className="font-mono-data text-[12px] text-[#8A9B94]">
                        {trade.seller.slice(0, 4)}...{trade.seller.slice(-4)}
                        {isSeller && <span className="text-[#34D399] ml-1">{t("you")}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {trade.projectId && (
                        <span className="text-[12px] text-[#8A9B94]">{trade.projectId}</span>
                      )}
                      <span className="font-mono-data text-[13px]">{trade.amount} {t("shares")}</span>
                      <span className="font-mono-data text-[13px] font-medium text-[#34D399]">{costDisplay} {tenge}</span>
                      <a
                        href={`https://explorer.solana.com/tx/${trade.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5A6D65] hover:text-[#34D399] transition-colors text-[11px]"
                      >
                        Explorer ↗
                      </a>
                    </div>
                  </div>

                  <div className="sm:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#5A6D65]">{time}</span>
                      <span className="font-mono-data text-[13px] font-medium text-[#34D399]">{costDisplay} {tenge}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-mono-data text-[#8A9B94]">
                        {trade.buyer.slice(0, 4)}...{trade.buyer.slice(-4)}
                        {isBuyer && <span className="text-[#34D399] ml-1">{t("you")}</span>}
                      </span>
                      <span className="text-[#5A6D65]">→</span>
                      <span className="font-mono-data text-[#8A9B94]">
                        {trade.seller.slice(0, 4)}...{trade.seller.slice(-4)}
                        {isSeller && <span className="text-[#34D399] ml-1">{t("you")}</span>}
                      </span>
                      <a
                        href={`https://explorer.solana.com/tx/${trade.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-[#5A6D65] hover:text-[#34D399] text-[11px]"
                      >
                        ↗
                      </a>
                    </div>
                    <span className="font-mono-data text-[12px] text-[#8A9B94]">{trade.amount} {t("shares")}</span>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
