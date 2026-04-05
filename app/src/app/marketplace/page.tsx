"use client";

import { useState } from "react";
import { ArrowLeftRight, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/useListings";
import { useProjects } from "@/hooks/useProjects";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { simulateTransaction } from "@/lib/utils";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";

const features = [
  {
    icon: ArrowLeftRight,
    title: "P2P Торговля",
    desc: "Выставляйте доли на продажу и покупайте напрямую у других инвесторов с escrow on-chain.",
  },
  {
    icon: BookOpen,
    title: "Книга заявок",
    desc: "Просматривайте все активные листинги с ценами, объёмами и историей сделок.",
  },
  {
    icon: BarChart3,
    title: "Ценообразование",
    desc: "Рыночное ценообразование через конкуренцию покупателей и продавцов.",
  },
];

export default function MarketplacePage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const program = useCarbonProgram();
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { projects } = useProjects();
  const [buyingPda, setBuyingPda] = useState<string | null>(null);

  const getProjectName = (projectPda: string) => {
    const p = projects.find((pr) => pr.pda === projectPda);
    return p?.name ?? projectPda.slice(0, 8) + "...";
  };

  const getProjectId = (projectPda: string) => {
    return projects.find((pr) => pr.pda === projectPda)?.id ?? null;
  };

  const handleBuy = async (listing: (typeof listings)[0]) => {
    if (!connected || !publicKey || !program) {
      toast.error("Подключите кошелек");
      return;
    }

    const projectId = getProjectId(listing.project);
    if (!projectId) {
      toast.error("Проект не найден");
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

      // Simulate before sending
      const tx = await program.methods.buyShares().accounts(accounts).transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods.buyShares().accounts(accounts).rpc();

      toast.success("Доли куплены!", {
        description: `${listing.amount} долей приобретено`,
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
        },
      });
      refetchListings();
    } catch (err) {
      toast.error("Ошибка покупки", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    } finally {
      setBuyingPda(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-16 relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="relative max-w-[640px] mx-auto text-center mb-14">
        <h1 className="font-heading text-[32px] font-bold tracking-[-0.02em] mb-3">
          Маркетплейс
        </h1>
        <p className="text-[15px] text-[#8A9B94] leading-[1.6]">
          Вторичный рынок токенизированных долей углеродных кредитов
        </p>
      </div>

      {/* Features */}
      <div className="relative grid sm:grid-cols-3 gap-5 max-w-[900px] mx-auto mb-12">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <div className="w-9 h-9 rounded-lg bg-[rgba(52,211,153,0.08)] flex items-center justify-center mb-4">
              <f.icon size={18} strokeWidth={1.5} className="text-[#34D399]" />
            </div>
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
            <p className="text-[13px] text-[#8A9B94] leading-[1.6]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Active listings */}
      <div className="relative max-w-[900px] mx-auto">
        <h2 className="font-heading text-xl font-bold tracking-[-0.01em] mb-6">
          Активные листинги
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
            <p className="text-[14px] text-[#5A6D65] mb-1">Нет активных листингов</p>
            <p className="text-[12px] text-[#3D5048]">
              {publicKey
                ? "Листинги появятся когда инвесторы выставят свои доли на продажу"
                : "Подключите кошелек для просмотра листингов"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table header — desktop */}
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-2">
              <span className="label-upper">Проект</span>
              <span className="label-upper">Продавец</span>
              <span className="label-upper text-right">Кол-во</span>
              <span className="label-upper text-right">Цена/доля</span>
              <span className="label-upper text-right">Итого</span>
            </div>

            {listings.map((listing) => {
              const total = listing.amount * listing.pricePerShare;
              const isSelf = publicKey?.toString() === listing.seller;

              return (
                <div
                  key={listing.pda}
                  className="rounded-xl border border-[#1E2B26] bg-[#0C1210] px-5 py-4"
                >
                  {/* Desktop row */}
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
                        {isSelf && <span className="text-[#34D399] ml-1">(вы)</span>}
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data text-[13px]">{listing.amount.toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-data text-[13px]">{listing.pricePerShare.toLocaleString("ru-RU")} &#x20B8;</p>
                    </div>
                    <div className="text-right flex items-center justify-end gap-3">
                      <p className="font-mono-data text-[13px] font-medium text-[#34D399]">
                        {total.toLocaleString("ru-RU")} &#x20B8;
                      </p>
                      {!isSelf && connected && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#34D399]/30 text-[#34D399] hover:bg-[#34D399]/10 text-[11px] h-7 px-3 cursor-pointer"
                          disabled={buyingPda === listing.pda}
                          onClick={() => handleBuy(listing)}
                        >
                          {buyingPda === listing.pda ? "..." : "Купить"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile card */}
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
                        {isSelf && <span className="text-[#34D399] ml-1">(вы)</span>}
                      </a>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">Кол-во</p>
                        <p className="font-mono-data text-[13px] mt-0.5">{listing.amount.toLocaleString("ru-RU")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">Цена</p>
                        <p className="font-mono-data text-[13px] mt-0.5">{listing.pricePerShare.toLocaleString("ru-RU")} &#x20B8;</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#5A6D65] uppercase tracking-wider">Итого</p>
                        <p className="font-mono-data text-[13px] font-medium text-[#34D399] mt-0.5">{total.toLocaleString("ru-RU")} &#x20B8;</p>
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
                        {buyingPda === listing.pda ? "..." : "Купить"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
