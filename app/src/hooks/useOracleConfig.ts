"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCarbonProgram } from "./useCarbonProgram";
import { PROGRAM_ID, KZTE_DECIMALS } from "@/lib/constants";

export interface OracleData {
  projectPda: string;
  feedId: string;
  cachedPrice: number;     // in KZTE (human-readable)
  lastUpdate: number;      // unix timestamp
  usdToKztRate: number;    // rate × 100
  isStale: boolean;        // older than 5 minutes
}

export function useOracleConfig(projectPda: string | undefined) {
  const program = useCarbonProgram();
  const [oracle, setOracle] = useState<OracleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOracle = useCallback(async () => {
    if (!program || !projectPda) return;
    setLoading(true);
    setError(null);

    try {
      const projectKey = new PublicKey(projectPda);
      const [oraclePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("oracle"), projectKey.toBuffer()],
        PROGRAM_ID
      );

      const account = await (program.account as any).oracleConfig.fetch(oraclePda);
      const now = Math.floor(Date.now() / 1000);

      setOracle({
        projectPda,
        feedId: Buffer.from(account.feedId).toString("hex"),
        cachedPrice: Number(account.cachedPrice) / 10 ** KZTE_DECIMALS,
        lastUpdate: Number(account.lastUpdate),
        usdToKztRate: Number(account.usdToKztRate),
        isStale: now - Number(account.lastUpdate) > 300, // 5 min
      });
    } catch (err: any) {
      if (err?.message?.includes("Account does not exist")) {
        // OracleConfig not initialized for this project — expected
        setOracle(null);
      } else {
        console.error("useOracleConfig error:", err);
        setError(err instanceof Error ? err.message : "Failed to load oracle config");
        setOracle(null);
      }
    } finally {
      setLoading(false);
    }
  }, [program, projectPda]);

  useEffect(() => {
    fetchOracle();
  }, [fetchOracle]);

  return { oracle, loading, error, refetch: fetchOracle };
}
