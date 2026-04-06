"use client";

import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import idl from "@/idl/carbon_kz.json";

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
        const signatures = await connection.getSignaturesForAddress(
          PROGRAM_ID,
          { limit: 30 },
          "confirmed"
        );

        const coder = new BorshCoder(idl as any);
        const eventParser = new EventParser(PROGRAM_ID, coder);

        const results: TradeItem[] = [];

        for (const sig of signatures) {
          if (cancelled || results.length >= 20) break;
          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            if (!tx?.meta?.logMessages) continue;

            // Check if this is a BuyShares tx
            const hasBuyLog = tx.meta.logMessages.some(
              (log) => log.includes("Bought") && log.includes("shares for")
            );
            if (!hasBuyLog) continue;

            // Parse Anchor events from logs
            const events = Array.from(eventParser.parseLogs(tx.meta.logMessages));
            const buyEvent = events.find((e) => e.name === "sharesBought");

            if (buyEvent) {
              results.push({
                signature: sig.signature,
                buyer: (buyEvent.data.buyer as PublicKey).toString(),
                seller: (buyEvent.data.seller as PublicKey).toString(),
                amount: Number(buyEvent.data.amount),
                totalCost: Number(buyEvent.data.totalCost),
                projectId: buyEvent.data.projectId as string,
                timestamp: sig.blockTime ?? 0,
              });
            }
          } catch {
            // Skip
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
