"use client";

import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
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
        const coder = new BorshCoder(idl as any);
        const eventParser = new EventParser(PROGRAM_ID, coder);

        const signatures = await connection.getSignaturesForAddress(
          PROGRAM_ID,
          { limit: 20 },
          "confirmed"
        );

        const results: TradeItem[] = [];

        for (const sig of signatures) {
          if (cancelled || results.length >= 10) break;
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: "confirmed",
            });
            if (!tx?.meta?.logMessages) continue;

            // Quick filter — only process BuyShares txs
            const isBuyTx = tx.meta.logMessages.some(
              (l: string) => l.includes("Instruction: BuyShares")
            );
            if (!isBuyTx) continue;

            // Parse events
            const events: any[] = [];
            for (const event of eventParser.parseLogs(tx.meta.logMessages)) {
              events.push(event);
            }

            const buyEvent = events.find((e) => e.name === "SharesBought" || e.name === "sharesBought");
            if (!buyEvent) continue;

            const d = buyEvent.data;
            results.push({
              signature: sig.signature,
              buyer: d.buyer?.toString() ?? "",
              seller: d.seller?.toString() ?? "",
              amount: typeof d.amount === "object" ? d.amount.toNumber() : Number(d.amount),
              totalCost: typeof d.totalCost === "object" ? d.totalCost.toNumber() : Number(d.totalCost),
              projectId: d.projectId ?? "",
              timestamp: sig.blockTime ?? 0,
            });
          } catch {
            // skip individual tx
          }
        }

        if (!cancelled) {
          setTrades(results);
          setLoading(false);
        }
      } catch (err) {
        console.error("Trade history error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrades();
    return () => { cancelled = true; };
  }, [connection]);

  return { trades, loading };
}
