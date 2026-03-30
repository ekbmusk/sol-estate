"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import type { OnChainProject } from "@/hooks/useProjects";

interface RetirePanelProps {
  project: OnChainProject;
  onSuccess?: () => void;
}

export default function RetirePanel({ project, onSuccess }: RetirePanelProps) {
  const [amount, setAmount] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();

  const maxRetirable = project.totalCredits - project.creditsRetired;

  const handleRetire = async () => {
    if (!connected || !publicKey) {
      toast.error("Подключите кошелек");
      return;
    }
    if (!program) {
      toast.error("Программа не инициализирована");
      return;
    }
    if (!purpose.trim()) {
      toast.error("Укажите цель гашения");
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

      const buyerCarbonAta = await getAssociatedTokenAddress(
        carbonMintPda,
        publicKey
      );

      // Generate unique retire_id
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

      const sig = await program.methods
        .retireCredits(Array.from(retireId), new BN(amount), purpose.trim())
        .accounts({
          buyer: publicKey,
          project: projectPda,
          carbonMint: carbonMintPda,
          buyerCarbonAccount: buyerCarbonAta,
          retireRecord: retireRecordPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: PublicKey.default,
        })
        .rpc();

      toast.success(`${amount} углеродных кредитов погашено!`, {
        description: "Токены сожжены навсегда. RetireRecord создан on-chain.",
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
              "_blank"
            ),
        },
      });

      setAmount(1);
      setPurpose("");
      onSuccess?.();
    } catch (err) {
      toast.error("Ошибка гашения", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
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
          <h3 className="text-sm font-semibold">Гашение кредитов</h3>
          <p className="text-xs text-muted-foreground">Burn + On-chain Proof</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Количество кредитов (тонн CO₂)
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
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Доступно: {maxRetirable.toLocaleString("ru-RU")} тонн
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Цель гашения
          </label>
          <input
            type="text"
            maxLength={128}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="напр. КазМунайГаз ESG offset Q1 2026"
            disabled={loading}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
      </div>

      <div className="rounded-lg bg-orange-500/5 border border-orange-500/10 p-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Токены будут сожжены</span>
          <span className="font-medium text-orange-400">{amount} CarbonToken</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">RetireRecord PDA</span>
          <span className="font-medium text-emerald-400">создаётся on-chain</span>
        </div>
      </div>

      <Button
        onClick={handleRetire}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
        disabled={loading || !connected || maxRetirable <= 0}
      >
        {loading ? "Гашение..." : `Погасить ${amount} тонн CO₂`}
      </Button>
    </div>
  );
}
