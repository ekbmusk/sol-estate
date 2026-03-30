"use client";

import { useCallback, useEffect, useState } from "react";
import { useCarbonProgram } from "./useCarbonProgram";
import { KZTE_DECIMALS } from "@/lib/constants";

export interface OnChainProject {
  id: string;
  name: string;
  authority: string;
  projectType: string;
  carbonMint: string;
  shareMint: string;
  totalCredits: number;
  creditsRetired: number;
  totalShares: number;
  sharesSold: number;
  pricePerShare: number;
  verified: boolean;
  status: string;
  documentHash: number[];
  totalDividendsPerShare: string;
  listingCount: number;
  pda: string;
}

function parseProjectType(pt: Record<string, unknown>): string {
  if ("solar" in pt) return "solar";
  if ("wind" in pt) return "wind";
  if ("forest" in pt) return "forest";
  if ("industrial" in pt) return "industrial";
  return "other";
}

function parseStatus(s: Record<string, unknown>): string {
  if ("active" in s) return "active";
  if ("funded" in s) return "funded";
  if ("retired" in s) return "retired";
  return "active";
}

export function useProjects() {
  const program = useCarbonProgram();
  const [projects, setProjects] = useState<OnChainProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!program) return;
    setLoading(true);
    setError(null);

    try {
      const accounts = await (program.account as any).carbonProject.all();
      const parsed: OnChainProject[] = accounts.map((acc: any) => ({
        id: acc.account.projectId,
        name: acc.account.name,
        authority: acc.account.authority.toString(),
        projectType: parseProjectType(acc.account.projectType),
        carbonMint: acc.account.carbonMint.toString(),
        shareMint: acc.account.shareMint.toString(),
        totalCredits: Number(acc.account.totalCredits),
        creditsRetired: Number(acc.account.creditsRetired),
        totalShares: Number(acc.account.totalShares),
        sharesSold: Number(acc.account.sharesSold),
        pricePerShare: Number(acc.account.pricePerShare) / 10 ** KZTE_DECIMALS,
        verified: acc.account.verified,
        status: parseStatus(acc.account.status),
        documentHash: Array.from(acc.account.documentHash),
        totalDividendsPerShare: acc.account.totalDividendsPerShare.toString(),
        listingCount: Number(acc.account.listingCount),
        pda: acc.publicKey.toString(),
      }));
      setProjects(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}
