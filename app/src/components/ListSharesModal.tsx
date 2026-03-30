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
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";

interface ListSharesModalProps {
  projectId: string;
  projectName: string;
  sharesOwned: number;
  currentPrice: number; // display price per share (KZTE, not lamports)
  onSuccess?: () => void;
}

export default function ListSharesModal({
  projectId,
  projectName,
  sharesOwned,
  currentPrice,
  onSuccess,
}: ListSharesModalProps) {
  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState(currentPrice);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleList = async () => {
    if (!connected || !publicKey || !program) {
      toast.error("Подключите кошелек");
      return;
    }

    setLoading(true);
    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );

      // Fetch project to get listing_count and share_mint
      const projectAccount = await (program.account as any).carbonProject.fetch(projectPda);
      const listingCount = projectAccount.listingCount;
      const shareMint = projectAccount.shareMint;

      const [investorRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("investor"), projectPda.toBuffer(), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [listingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          projectPda.toBuffer(),
          publicKey.toBuffer(),
          listingCount.toArrayLike(Buffer, "le", 8),
        ],
        PROGRAM_ID
      );

      const sellerShareAta = await getAssociatedTokenAddress(shareMint, publicKey);
      const escrowShareAta = await getAssociatedTokenAddress(shareMint, listingPda, true);

      // Create escrow ATA if it doesn't exist — add as pre-instruction
      const escrowAtaInfo = await connection.getAccountInfo(escrowShareAta);
      const preInstructions = [];
      if (!escrowAtaInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            escrowShareAta,
            listingPda,
            shareMint
          )
        );
      }

      const priceLamports = new BN(price * 1_000_000); // KZTE has 6 decimals

      const sig = await program.methods
        .listShares(new BN(amount), priceLamports)
        .accounts({
          seller: publicKey,
          project: projectPda,
          investorRecord: investorRecordPda,
          listing: listingPda,
          sellerShareAccount: sellerShareAta,
          escrowShareAccount: escrowShareAta,
          systemProgram: PublicKey.default,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .preInstructions(preInstructions)
        .rpc();

      toast.success(`${amount} долей выставлено на продажу!`, {
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
        },
      });

      setOpen(false);
      setAmount(1);
      onSuccess?.();
    } catch (err) {
      toast.error("Ошибка листинга", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-[12px] font-medium text-[#FBBF24] hover:underline cursor-pointer transition-colors">
        Продать
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Продать доли — {projectName}</DialogTitle>
          <DialogDescription>
            Доли будут переведены в escrow. Покупатель заплатит KZTE напрямую вам.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="list-amount">
              Количество долей
            </label>
            <input
              id="list-amount"
              type="number"
              min={1}
              max={sharesOwned}
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(1, Math.min(sharesOwned, Number(e.target.value))))
              }
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Доступно: {sharesOwned} долей
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="list-price">
              Цена за долю (KZTE)
            </label>
            <input
              id="list-price"
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Итого за {amount} долей</span>
              <span className="font-bold">
                {(amount * price).toLocaleString("ru-RU")} &#x20B8;
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleList}
            className="w-full sm:w-auto"
            disabled={loading || sharesOwned <= 0}
          >
            {loading ? "Обработка..." : "Выставить на продажу"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
