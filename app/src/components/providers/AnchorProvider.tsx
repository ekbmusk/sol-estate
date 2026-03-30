"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { AnchorProvider as AnchorSolanaProvider, Program, Wallet } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

interface AnchorContextValue {
  provider: AnchorSolanaProvider | null;
}

const AnchorContext = createContext<AnchorContextValue>({ provider: null });

// Dummy wallet for readonly access (no signing)
const READONLY_WALLET: Wallet = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: async () => { throw new Error("Readonly"); },
  signAllTransactions: async () => { throw new Error("Readonly"); },
  payer: Keypair.generate(),
};

export function useAnchorProvider() {
  const ctx = useContext(AnchorContext);
  return ctx.provider;
}

export default function AnchorProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    // If wallet connected — full provider with signing
    if (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions) {
      return new AnchorSolanaProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction as <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>,
          signAllTransactions: wallet.signAllTransactions as <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>,
        },
        { commitment: "confirmed" }
      );
    }

    // No wallet — readonly provider (can fetch accounts, cannot sign)
    return new AnchorSolanaProvider(
      connection,
      READONLY_WALLET,
      { commitment: "confirmed" }
    );
  }, [connection, wallet]);

  return (
    <AnchorContext.Provider value={{ provider }}>
      {children}
    </AnchorContext.Provider>
  );
}
