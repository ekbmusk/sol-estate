"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
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

// Decode SharesBought event from "Program data:" base64 log
// Layout: discriminator(8) + project_id(4+len) + buyer(32) + seller(32) + amount(8) + total_cost(8)
function decodeSharesBought(base64Data: string): TradeItem | null {
  try {
    const data = Buffer.from(base64Data, "base64");
    let offset = 8; // skip discriminator

    // project_id: borsh string = u32 length + utf8 bytes
    const strLen = data.readUInt32LE(offset);
    offset += 4;
    const projectId = data.subarray(offset, offset + strLen).toString("utf8");
    offset += strLen;

    // buyer: 32 bytes pubkey
    const buyer = new PublicKey(data.subarray(offset, offset + 32)).toString();
    offset += 32;

    // seller: 32 bytes pubkey
    const seller = new PublicKey(data.subarray(offset, offset + 32)).toString();
    offset += 32;

    // amount: u64 LE
    const amount = Number(data.readBigUInt64LE(offset));
    offset += 8;

    // total_cost: u64 LE
    const totalCost = Number(data.readBigUInt64LE(offset));

    return { signature: "", buyer, seller, amount, totalCost, projectId, timestamp: 0 };
  } catch {
    return null;
  }
}

export function useTradeHistory() {
  const { connection } = useConnection();
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    try {
      const signatures = await connection.getSignaturesForAddress(
        PROGRAM_ID,
        { limit: 30 },
        "confirmed"
      );

      const results: TradeItem[] = [];

      for (const sig of signatures) {
        if (results.length >= 20) break;
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
          });
          if (!tx?.meta?.logMessages) continue;

          // Find "Program data:" log line (Anchor event)
          const dataLog = tx.meta.logMessages.find(
            (log: string) => log.startsWith("Program data:")
          );
          // Also check it's a BuyShares tx
          const hasBuy = tx.meta.logMessages.some(
            (log: string) => log.includes("Bought") && log.includes("shares for")
          );
          if (!dataLog || !hasBuy) continue;

          const base64 = dataLog.replace("Program data: ", "");
          const trade = decodeSharesBought(base64);
          if (!trade) continue;

          trade.signature = sig.signature;
          trade.timestamp = sig.blockTime ?? 0;
          results.push(trade);
        } catch {
          // Skip
        }
      }

      setTrades(results);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, loading };
}
