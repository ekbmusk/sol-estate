"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { simulateTransaction } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import { localeToBcp47 } from "@/lib/format";

interface DividendWidgetProps {
  projectId: string;
  totalDividendsPerShare: number;
  claimableAmount: number;
  lastClaimed: number;
}

export default function DividendWidget({
  projectId,
  totalDividendsPerShare,
  claimableAmount,
  lastClaimed,
}: DividendWidgetProps) {
  const t = useTranslations("dividend");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(bcp, opts);
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const handleClaim = async () => {
    if (!connected || !publicKey) {
      toast.error(t("toasts.connectFirst"));
      return;
    }
    if (!program) {
      toast.error(t("toasts.error"));
      return;
    }

    setLoading(true);

    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), Buffer.from(projectId)],
        PROGRAM_ID
      );
      const [investorRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("investor"), projectPda.toBuffer(), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);
      const investorKzteAccount = await getAssociatedTokenAddress(KZTE_MINT, publicKey);

      const accounts = {
        investor: publicKey,
        project: projectPda,
        vault: vaultPda,
        investorRecord: investorRecordPda,
        vaultTokenAccount,
        investorKzteAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      };

      const tx = await program.methods.claimDividends().accounts(accounts).transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods.claimDividends().accounts(accounts).rpc();

      toast.success(t("toasts.success"), {
        description: t("toasts.successDesc", { amount: fmt(claimableAmount, { maximumFractionDigits: 2 }) }),
        action: {
          label: "Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("toasts.unknownError");
      toast.error(t("toasts.error"), { description: message });
      console.error("Claim dividends error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("totalPerShare")}</span>
            <span className="font-medium">
              {fmt(totalDividendsPerShare, { maximumFractionDigits: 4 })} ₸
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("claimable")}</span>
            <span className="text-lg font-bold text-green-600">
              {fmt(claimableAmount, { maximumFractionDigits: 2 })} ₸
            </span>
          </div>
          {lastClaimed > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("lastClaimed")}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(lastClaimed * 1000).toLocaleDateString(bcp)}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={handleClaim}
          variant="outline"
          className="w-full"
          disabled={claimableAmount <= 0 || loading}
        >
          {loading
            ? t("claiming")
            : claimableAmount > 0
              ? `${t("claim")} — ${fmt(claimableAmount, { maximumFractionDigits: 2 })} ₸`
              : t("noneYet")}
        </Button>
      </CardContent>
    </Card>
  );
}
