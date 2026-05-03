"use client";

import { useState, useEffect } from "react";

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
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrades() {
      try {
        const res = await fetch("/api/trades");
        const json = await res.json();
        if (cancelled) return;
        setTrades(Array.isArray(json.trades) ? json.trades : []);
      } catch (err) {
        console.error("Trade history error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrades();
    return () => {
      cancelled = true;
    };
  }, []);

  return { trades, loading };
}
