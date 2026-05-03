"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { simulateTransaction } from "@/lib/utils";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import type { Project } from "@/lib/mockData";
import { localeToBcp47 } from "@/lib/format";

export default function InvestModal({ property }: { property: Project }) {
  const t = useTranslations("invest");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const fmt = (n: number) => n.toLocaleString(bcp);
  const [shares, setShares] = useState(1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const totalCost = shares * property.pricePerShare;
  const remainingShares = property.totalShares - property.sharesSold;

  const handleInvest = async () => {
    if (!connected || !publicKey) {
      toast.error(t("toasts.connectFirst"));
      return;
    }

    if (!program) {
      toast.error(t("toasts.notInitialized"));
      return;
    }

    setLoading(true);

    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(property.id)],
        PROGRAM_ID
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), Buffer.from(property.id)],
        PROGRAM_ID
      );

      const [shareMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("share_mint"), Buffer.from(property.id)],
        PROGRAM_ID
      );

      const [investorRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor"),
          projectPda.toBuffer(),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      const investorKzteAta = await getAssociatedTokenAddress(KZTE_MINT, publicKey);
      const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);
      const investorShareAccount = await getAssociatedTokenAddress(shareMintPda, publicKey);

      const accounts = {
        investor: publicKey,
        project: projectPda,
        vault: vaultPda,
        shareMint: shareMintPda,
        investorRecord: investorRecordPda,
        investorKzteAccount: investorKzteAta,
        vaultTokenAccount: vaultTokenAccount,
        investorShareAccount: investorShareAccount,
        kzteMint: KZTE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      };

      const tx = await program.methods.invest(new BN(shares)).accounts(accounts).transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods.invest(new BN(shares)).accounts(accounts).rpc();

      const explorerUrl = `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

      toast.success(t("toasts.success"), {
        description: t("toasts.successDesc", { count: shares }),
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });

      setOpen(false);
      setShares(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("toasts.unknownError");
      toast.error(t("toasts.error"), { description: message });
      console.error("Invest error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
      >
        {t("trigger")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { name: property.name })}</DialogTitle>
          <DialogDescription>
            {t("description", { price: fmt(property.pricePerShare) })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="shares-input">
              {t("sharesLabel")}
            </label>
            <input
              id="shares-input"
              type="number"
              min={1}
              max={remainingShares}
              value={shares}
              onChange={(e) =>
                setShares(Math.max(1, Math.min(remainingShares, Number(e.target.value))))
              }
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              {t("available", { count: fmt(remainingShares) })}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("total")}</span>
              <span className="text-lg font-bold">
                {fmt(totalCost)} ₸
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleInvest}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? t("processing") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
