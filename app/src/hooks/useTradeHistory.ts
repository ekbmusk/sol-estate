"use client";

import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID } from "@/lib/constants";

export interface TradeItem {
  signature: string;
  buyer: string;
  seller: string;
  amount: number;
  totalCost: number;
  projectId: string;
  timestamp: number;
}

export function useTradeHistory() {
  const { connection } = useConnection();
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrades() {
      try {
        // Get recent signatures for the program
        const signatures = await connection.getSignaturesForAddress(
          PROGRAM_ID,
          { limit: 50 },
          "confirmed"
        );

        const results: TradeItem[] = [];

        for (const sig of signatures) {
          if (cancelled) break;
          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            if (!tx?.meta?.logMessages) continue;

            // Look for "Bought X shares for Y KZTE" in logs
            const buyLog = tx.meta.logMessages.find((log) =>
              log.includes("Bought") && log.includes("shares for")
            );
            if (!buyLog) continue;

            // Parse: "Bought 100 shares for 500000000000 KZTE"
            const match = buyLog.match(/Bought (\d+) shares for (\d+) KZTE/);
            if (!match) continue;

            // Find project_id from logs
            const projectLog = tx.meta.logMessages.find((log) =>
              log.includes("project_id")
            );

            // Get accounts from transaction
            const accounts = tx.transaction.message.accountKeys;
            const buyer = accounts[0]?.pubkey?.toString() ?? "";
            const seller = accounts.length > 1 ? accounts[1]?.pubkey?.toString() ?? "" : "";

            results.push({
              signature: sig.signature,
              buyer,
              seller,
              amount: parseInt(match[1]),
              totalCost: parseInt(match[2]),
              projectId: "",
              timestamp: sig.blockTime ?? 0,
            });
          } catch {
            // Skip failed tx parse
          }
        }

        if (!cancelled) {
          setTrades(results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrades();
    return () => { cancelled = true; };
  }, [connection]);

  return { trades, loading };
}
