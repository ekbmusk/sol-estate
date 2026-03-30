"use client";

import { useCallback, useEffect, useState } from "react";
import { useCarbonProgram } from "./useCarbonProgram";

export interface RetireRecordItem {
  buyer: string;
  project: string;
  amountRetired: number;
  timestamp: number;
  purpose: string;
  pda: string;
}

export function useRetireRecords() {
  const program = useCarbonProgram();
  const [records, setRecords] = useState<RetireRecordItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!program) return;
    setLoading(true);

    try {
      const accounts = await (program.account as any).retireRecord.all();
      const parsed: RetireRecordItem[] = accounts
        .map((acc: any) => ({
          buyer: acc.account.buyer.toString(),
          project: acc.account.project.toString(),
          amountRetired: Number(acc.account.amountRetired),
          timestamp: Number(acc.account.timestamp),
          purpose: acc.account.purpose,
          pda: acc.publicKey.toString(),
        }))
        .sort((a: RetireRecordItem, b: RetireRecordItem) => b.timestamp - a.timestamp);
      setRecords(parsed);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, refetch: fetchRecords };
}
