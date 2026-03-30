"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCarbonProgram } from "./useCarbonProgram";
import { KZTE_DECIMALS } from "@/lib/constants";

const PRECISION = BigInt("1000000000000"); // 10^12, must match contract

export interface PortfolioItem {
  projectId: string;
  projectName: string;
  projectPda: string;
  sharesOwned: number;
  kzteInvested: number;
  pricePerShare: number;
  claimableDividends: number;
  totalDividendsPerShare: bigint;
  lastClaimed: bigint;
}

export function usePortfolio() {
  const { publicKey } = useWallet();
  const program = useCarbonProgram();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!publicKey || !program) {
      setItems([]);
      return;
    }
    setLoading(true);

    try {
      // Fetch all investor records for this wallet
      const records = await (program.account as any).investorRecord.all([
        { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
      ]);

      const portfolioItems: PortfolioItem[] = [];

      for (const rec of records) {
        const record = rec.account;
        if (Number(record.sharesOwned) === 0 && !record.isInitialized) continue;

        try {
          // Fetch the project for this record
          const project = await (program.account as any).carbonProject.fetch(
            record.project
          );

          const totalDPS = BigInt(project.totalDividendsPerShare.toString());
          const lastClaimed = BigInt(record.lastClaimed.toString());
          const sharesOwned = BigInt(record.sharesOwned.toString());

          const unclaimedPerShare = totalDPS - lastClaimed;
          // Divide before multiply to match contract (prevent overflow)
          const claimableRaw = (unclaimedPerShare / PRECISION) * sharesOwned;
          const claimable = Number(claimableRaw) / 10 ** KZTE_DECIMALS;

          portfolioItems.push({
            projectId: project.projectId,
            projectName: project.name,
            projectPda: record.project.toString(),
            sharesOwned: Number(record.sharesOwned),
            kzteInvested: Number(record.kzteInvested) / 10 ** KZTE_DECIMALS,
            pricePerShare: Number(project.pricePerShare) / 10 ** KZTE_DECIMALS,
            claimableDividends: claimable,
            totalDividendsPerShare: totalDPS,
            lastClaimed,
          });
        } catch {
          // Skip if project fetch fails
        }
      }

      setItems(portfolioItems);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, program]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { items, loading, refetch: fetchPortfolio };
}
