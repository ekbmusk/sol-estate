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
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import { localeToBcp47 } from "@/lib/format";

interface ListSharesModalProps {
  projectId: string;
  projectName: string;
  sharesOwned: number;
  currentPrice: number;
  onSuccess?: () => void;
}

export default function ListSharesModal({
  projectId,
  projectName,
  sharesOwned,
  currentPrice,
  onSuccess,
}: ListSharesModalProps) {
  const t = useTranslations("listShares");
  const locale = useLocale();
  const bcp = localeToBcp47(locale);
  const fmt = (n: number) => n.toLocaleString(bcp);
  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState(currentPrice);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const handleList = async () => {
    if (!connected || !publicKey || !program) {
      toast.error(t("toasts.connectFirst"));
      return;
    }
    if (amount <= 0) { toast.error(t("toasts.invalidAmount")); return; }
    if (price <= 0) { toast.error(t("toasts.invalidPrice")); return; }

    setLoading(true);
    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );

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

      const priceLamports = new BN(price * 1_000_000);

      const accounts = {
        seller: publicKey,
        project: projectPda,
        investorRecord: investorRecordPda,
        listing: listingPda,
        sellerShareAccount: sellerShareAta,
        escrowShareAccount: escrowShareAta,
        systemProgram: PublicKey.default,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any;

      const tx = await program.methods
        .listShares(new BN(amount), priceLamports)
        .accounts(accounts)
        .preInstructions(preInstructions)
        .transaction();
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      await simulateTransaction(connection, tx);

      const sig = await program.methods
        .listShares(new BN(amount), priceLamports)
        .accounts(accounts)
        .preInstructions(preInstructions)
        .rpc();

      toast.success(t("toasts.success"), {
        description: t("toasts.successDesc", { amount, price: fmt(price) }),
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
      toast.error(t("toasts.error"), {
        description: err instanceof Error ? err.message : t("toasts.unknownError"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-[12px] font-medium text-[#FBBF24] hover:underline cursor-pointer transition-colors">
        {t("trigger")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: projectName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="list-amount">
              {t("amountLabel")}
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
              {t("available", { count: fmt(sharesOwned) })}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="list-price">
              {t("priceLabel")}
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
            <p className="text-xs text-muted-foreground">
              {t("currentPrice", { price: fmt(currentPrice) })}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("totalReceive")}</span>
              <span className="font-bold">
                {fmt(amount * price)} ₸
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
            {loading ? t("processing") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
