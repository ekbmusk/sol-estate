"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
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
}

/**
 * Fetches the InvestorRecord PDA for the current wallet + property
 */
export function useInvestor(propertyId: string): UseInvestorResult {
  const { publicKey } = useWallet();
  const [investor, setInvestor] = useState<InvestorRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !propertyId) {
      setInvestor(null);
      return;
    }

    async function fetchInvestor() {
      setLoading(true);
      setError(null);

      try {
        // Derive PDA for investor record
        // TODO: Replace with actual PDA derivation once program is deployed
        const [investorPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("investor"),
            publicKey!.toBuffer(),
            Buffer.from(propertyId),
          ],
          PROGRAM_ID
        );

        // TODO: Fetch from chain using the program
        // const record = await program.account.investorRecord.fetch(investorPda);

        // For now, return null (no on-chain data yet)
        setInvestor(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки данных инвестора"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInvestor();
  }, [publicKey, propertyId]);

  return { investor, loading, error };
}
