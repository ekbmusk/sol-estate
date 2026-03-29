"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useRwaProgram } from "./useRwaProgram";
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

/**
 * Fetches the InvestorRecord PDA for the current wallet + property
 */
export function useInvestor(propertyId: string): UseInvestorResult {
  const { publicKey } = useWallet();
  const program = useRwaProgram();
  const [investor, setInvestor] = useState<InvestorRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestor = useCallback(async () => {
    if (!publicKey || !propertyId || !program) {
      setInvestor(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Derive the property PDA first
      const [propertyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("property"), Buffer.from(propertyId)],
        PROGRAM_ID
      );

      // Derive the investor record PDA
      const [investorPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor"),
          propertyPda.toBuffer(),
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
      // Account not found is not a real error — investor just hasn't invested yet
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
  }, [publicKey, propertyId, program]);

  useEffect(() => {
    fetchInvestor();
  }, [fetchInvestor]);

  return { investor, loading, error, refetch: fetchInvestor };
}
