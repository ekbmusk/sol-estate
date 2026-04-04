"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);

  const fetchPortfolio = useCallback(async () => {
    if (!publicKey || !program) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    const currentGen = ++fetchGenRef.current;

    try {
      // Fetch all investor records for this wallet
      const records = await (program.account as any).investorRecord.all([
        { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
      ]);

      if (currentGen !== fetchGenRef.current) return; // stale fetch

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
        } catch (err) {
          console.warn(`usePortfolio: skipped project ${record.project.toString()}:`, err);
        }
      }

      if (currentGen !== fetchGenRef.current) return; // stale fetch
      setItems(portfolioItems);
    } catch (err) {
      if (currentGen !== fetchGenRef.current) return;
      console.error("usePortfolio error:", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
      setItems([]);
    } finally {
      if (currentGen === fetchGenRef.current) {
        setLoading(false);
      }
    }
  }, [publicKey, program]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { items, loading, error, refetch: fetchPortfolio };
}
