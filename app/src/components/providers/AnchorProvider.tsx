"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { AnchorProvider as AnchorSolanaProvider, Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

interface AnchorContextValue {
  provider: AnchorSolanaProvider | null;
}

const AnchorContext = createContext<AnchorContextValue>({ provider: null });

export function useAnchorProvider() {
  const ctx = useContext(AnchorContext);
  return ctx.provider;
}

export default function AnchorProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }

    return new AnchorSolanaProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction as <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>,
        signAllTransactions: wallet.signAllTransactions as <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>,
      },
      { commitment: "confirmed" }
    );
  }, [connection, wallet]);

  return (
    <AnchorContext.Provider value={{ provider }}>
      {children}
    </AnchorContext.Provider>
  );
}
