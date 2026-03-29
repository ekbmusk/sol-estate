"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { KZTE_MINT } from "@/lib/constants";

interface UseKzteResult {
  balance: number | null;
  loading: boolean;
}

/**
 * Fetches the KZTE token balance for the connected wallet.
 */
export function useKzte(): UseKzteResult {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    // Skip if KZTE_MINT is still the placeholder
    if (KZTE_MINT.equals(PublicKey.default)) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const ata = await getAssociatedTokenAddress(KZTE_MINT, publicKey);
      const accountInfo = await connection.getTokenAccountBalance(ata);
      setBalance(Number(accountInfo.value.uiAmount));
    } catch {
      // Token account doesn't exist yet — balance is 0
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading };
}
