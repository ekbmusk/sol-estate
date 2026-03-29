"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCarbonProgram } from "./useCarbonProgram";
import { PROGRAM_ID } from "@/lib/constants";

interface InvestorRecord {
  sharesOwned: number;
  kzteInvested: number;
  lastClaimed: number;
}

interface UseInvestorResult {
  investor: InvestorRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInvestor(projectId: string): UseInvestorResult {
  const { publicKey } = useWallet();
  const program = useCarbonProgram();
  const [investor, setInvestor] = useState<InvestorRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestor = useCallback(async () => {
    if (!publicKey || !projectId || !program) {
      setInvestor(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [projectPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );

      const [investorPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor"),
          projectPda.toBuffer(),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      const record = await (program.account as any).investorRecord.fetch(investorPda);

      setInvestor({
        sharesOwned: Number(record.sharesOwned),
        kzteInvested: Number(record.kzteInvested),
        lastClaimed: Number(record.lastClaimed),
      });
    } catch (err: any) {
      if (err?.message?.includes("Account does not exist")) {
        setInvestor(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load investor data"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, projectId, program]);

  useEffect(() => {
    fetchInvestor();
  }, [fetchInvestor]);

  return { investor, loading, error, refetch: fetchInvestor };
}
