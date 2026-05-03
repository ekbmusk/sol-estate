"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { simulateTransaction } from "@/lib/utils";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import type { OnChainProject } from "@/hooks/useProjects";
import { localeToBcp47 } from "@/lib/format";

interface RetirePanelProps {
  project: OnChainProject;
  onSuccess?: () => void;
  initialAmount?: number;
}

export default function RetirePanel({ project, onSuccess, initialAmount }: RetirePanelProps) {
  const t = useTranslations("retirePanel");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const fmt = (n: number) => n.toLocaleString(bcp);
  const [amount, setAmount] = useState(initialAmount ?? 1);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const maxRetirable = project.totalCredits - project.creditsRetired;

  const handleRetire = async () => {
    if (!connected || !publicKey) {
      toast.error(t("toasts.connectFirst"));
      return;
    }
    if (!program) {
      toast.error(t("toasts.notInitialized"));
      return;
    }
    if (amount <= 0) {
      toast.error(t("toasts.invalidAmount"));
      return;
    }
    if (!purpose.trim()) {
      toast.error(t("toasts.purposeRequired"));
      return;
    }

    setLoading(true);
    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(project.id)],
        PROGRAM_ID
      );

      const [carbonMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("carbon_mint"), Buffer.from(project.id)],
        PROGRAM_ID
      );

      const buyerCarbonAta = await getAssociatedTokenAddress(carbonMintPda, publicKey);

      const retireId = new Uint8Array(16);
      crypto.getRandomValues(retireId);

      const [retireRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("retire"),
          projectPda.toBuffer(),
          publicKey.toBuffer(),
          Buffer.from(retireId),
        ],
        PROGRAM_ID
      );

      const accounts = {
        buyer: publicKey,
        project: projectPda,
        carbonMint: carbonMintPda,
        buyerCarbonAccount: buyerCarbonAta,
        retireRecord: retireRecordPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      };
      const args = [Array.from(retireId), new BN(amount), purpose.trim()] as const;

      const tx = await program.methods.retireCredits(...args).accounts(accounts).transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods.retireCredits(...args).accounts(accounts).rpc();

      toast.success(t("toasts.success"), {
        description: t("toasts.successDesc", { amount }),
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
        },
      });

      setAmount(1);
      setPurpose("");
      onSuccess?.();
    } catch (err) {
      toast.error(t("toasts.error"), {
        description: err instanceof Error ? err.message : t("toasts.unknownError"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-500/20 bg-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-orange-400">
            <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">Burn + On-chain Proof</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t("amountLabel")}
          </label>
          <input
            type="number"
            min={1}
            max={maxRetirable}
            value={amount}
            onChange={(e) =>
              setAmount(Math.max(1, Math.min(maxRetirable, Number(e.target.value))))
            }
            disabled={loading}
            placeholder={t("amountPlaceholder")}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            {t("available", { count: fmt(maxRetirable) })}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t("purposeLabel")}
          </label>
          <input
            type="text"
            maxLength={128}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t("purposePlaceholder")}
            disabled={loading}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
      </div>

      <Button
        onClick={handleRetire}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
        disabled={loading || !connected || maxRetirable <= 0}
      >
        {loading ? t("processing") : `${t("submit")} — ${amount} t CO₂`}
      </Button>
    </div>
  );
}
