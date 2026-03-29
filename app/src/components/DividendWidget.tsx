"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { KZTE_MINT, PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();

  const handleClaim = async () => {
    if (!connected || !publicKey) {
      toast.error("Подключите кошелек для получения дивидендов");
      return;
    }

    if (!program) {
      toast.error("Программа не инициализирована. Проверьте подключение кошелька.");
      return;
    }

    setLoading(true);

    try {
      // Derive PDAs
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), Buffer.from(projectId)],
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

      // Get Associated Token Accounts
      const vaultTokenAccount = await getAssociatedTokenAddress(
        KZTE_MINT,
        vaultPda,
        true // allowOwnerOffCurve for PDA
      );

      const investorKzteAccount = await getAssociatedTokenAddress(
        KZTE_MINT,
        publicKey
      );

      // Call the claimDividends instruction
      const sig = await program.methods
        .claimDividends()
        .accounts({
          investor: publicKey,
          project: projectPda,
          vault: vaultPda,
          investorRecord: investorRecordPda,
          vaultTokenAccount: vaultTokenAccount,
          investorKzteAccount: investorKzteAccount,
          kzteMint: KZTE_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: PublicKey.default,
        })
        .rpc();

      const explorerUrl = `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=http://localhost:8899`;

      toast.success("Дивиденды получены!", {
        description: `${claimableAmount.toLocaleString("ru-RU")} ₸ отправлено на ваш кошелек`,
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Неизвестная ошибка транзакции";
      toast.error("Ошибка получения дивидендов", { description: message });
      console.error("Claim dividends error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дивиденды</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Дивиденд на долю</span>
            <span className="font-medium">
              {totalDividendsPerShare.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">К получению</span>
            <span className="text-lg font-bold text-green-600">
              {claimableAmount.toLocaleString("ru-RU")} ₸
            </span>
          </div>
          {lastClaimed > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Последний вывод</span>
              <span className="text-xs text-muted-foreground">
                {new Date(lastClaimed * 1000).toLocaleDateString("ru-RU")}
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
            ? "Обработка..."
            : claimableAmount > 0
              ? `Получить ${claimableAmount.toLocaleString("ru-RU")} ₸`
              : "Нет доступных дивидендов"}
        </Button>
      </CardContent>
    </Card>
  );
}
