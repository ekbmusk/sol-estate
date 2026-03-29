"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useRwaProgram } from "./useRwaProgram";
import { PROGRAM_ID } from "@/lib/constants";

interface PropertyData {
  authority: PublicKey;
  propertyId: string;
  name: string;
  totalShares: number;
  sharesSold: number;
  pricePerShare: number;
  shareMint: PublicKey;
  vault: PublicKey;
  totalDividendsPerShare: number;
  documentHash: number[];
  status: Record<string, object>;
  bump: number;
}

interface UsePropertyResult {
  property: PropertyData | null;
  propertyPda: PublicKey | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches a PropertyAccount by PDA or propertyId string.
 * If a string is passed, the PDA is derived from ["property", Buffer.from(propertyId)].
 */
export function useProperty(
  propertyIdOrPda: string | PublicKey
): UsePropertyResult {
  const program = useRwaProgram();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pda =
    typeof propertyIdOrPda === "string"
      ? PublicKey.findProgramAddressSync(
          [Buffer.from("property"), Buffer.from(propertyIdOrPda)],
          PROGRAM_ID
        )[0]
      : propertyIdOrPda;

  const fetchProperty = useCallback(async () => {
    if (!program || !pda) {
      setProperty(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const account = await (program.account as any).propertyAccount.fetch(pda);

      setProperty({
        authority: account.authority,
        propertyId: account.propertyId,
        name: account.name,
        totalShares: Number(account.totalShares),
        sharesSold: Number(account.sharesSold),
        pricePerShare: Number(account.pricePerShare),
        shareMint: account.shareMint,
        vault: account.vault,
        totalDividendsPerShare: Number(account.totalDividendsPerShare),
        documentHash: Array.from(account.documentHash),
        status: account.status,
        bump: account.bump,
      });
    } catch (err: any) {
      if (err?.message?.includes("Account does not exist")) {
        setProperty(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load property data"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [program, pda?.toBase58()]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return { property, propertyPda: pda, loading, error, refetch: fetchProperty };
}
