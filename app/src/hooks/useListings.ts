"use client";

import { useCallback, useEffect, useState } from "react";
import { useCarbonProgram } from "./useCarbonProgram";
import { KZTE_DECIMALS } from "@/lib/constants";

export interface OnChainListing {
  seller: string;
  project: string;
  listingId: number;
  amount: number;
  pricePerShare: number;
  active: boolean;
  pda: string;
}

export function useListings() {
  const program = useCarbonProgram();
  const [listings, setListings] = useState<OnChainListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!program) return;
    setLoading(true);
    setError(null);

    try {
      const accounts = await (program.account as any).listing.all();
      const parsed: OnChainListing[] = accounts
        .map((acc: any) => ({
          seller: acc.account.seller.toString(),
          project: acc.account.project.toString(),
          listingId: Number(acc.account.listingId),
          amount: Number(acc.account.amount),
          pricePerShare: Number(acc.account.pricePerShare) / 10 ** KZTE_DECIMALS,
          active: acc.account.active,
          pda: acc.publicKey.toString(),
        }))
        .filter((l: OnChainListing) => l.active);
      setListings(parsed);
    } catch (err) {
      console.error("useListings error:", err);
      setError(err instanceof Error ? err.message : "Failed to load listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}
