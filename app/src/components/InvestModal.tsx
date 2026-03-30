"use client";

import { useState } from "react";
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

export default function InvestModal({ property }: { property: Project }) {
  const [shares, setShares] = useState(1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();

  const totalCost = shares * property.pricePerShare;
  const remainingShares = property.totalShares - property.sharesSold;

  const handleInvest = async () => {
    if (!connected || !publicKey) {
      toast.error("Подключите кошелек для инвестирования");
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

      // Get Associated Token Accounts
      const investorKzteAta = await getAssociatedTokenAddress(
        KZTE_MINT,
        publicKey
      );

      const vaultTokenAccount = await getAssociatedTokenAddress(
        KZTE_MINT,
        vaultPda,
        true // allowOwnerOffCurve for PDA
      );

      const investorShareAccount = await getAssociatedTokenAddress(
        shareMintPda,
        publicKey
      );

      // Call the invest instruction
      const sig = await program.methods
        .invest(new BN(shares))
        .accounts({
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
        })
        .rpc();

      const explorerUrl = `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

      toast.success("Инвестиция успешна!", {
        description: `${shares} долей приобретено`,
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });

      setOpen(false);
      setShares(1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Неизвестная ошибка транзакции";
      toast.error("Ошибка инвестиции", { description: message });
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
        Инвестировать
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Инвестировать в {property.name}</DialogTitle>
          <DialogDescription>
            Укажите количество долей для покупки. Цена за одну долю:{" "}
            {property.pricePerShare.toLocaleString("ru-RU")} ₸
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="shares-input">
              Количество долей
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
              Доступно: {remainingShares.toLocaleString("ru-RU")} долей
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Итого</span>
              <span className="text-lg font-bold">
                {totalCost.toLocaleString("ru-RU")} ₸
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
            {loading ? "Обработка..." : "Подтвердить инвестицию"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
