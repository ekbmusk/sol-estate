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

            // Parse amount/cost — can be BN, number, or string
            let amount = 0;
            let totalCost = 0;
            try {
              amount = d.amount?.toNumber ? d.amount.toNumber() : Number(d.amount);
            } catch { amount = parseInt(d.amount?.toString() ?? "0"); }
            try {
              totalCost = d.totalCost?.toNumber ? d.totalCost.toNumber() : Number(d.totalCost);
            } catch { totalCost = parseInt(d.totalCost?.toString() ?? "0"); }

            // projectId can be camelCase or snake_case
            const projectId = (d.projectId ?? d.project_id ?? "") as string;

            results.push({
              signature: sig.signature,
              buyer: d.buyer?.toString() ?? "",
              seller: d.seller?.toString() ?? "",
              amount: isNaN(amount) ? 0 : amount,
              totalCost: isNaN(totalCost) ? 0 : totalCost,
              projectId,
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
