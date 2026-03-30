"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCarbonProgram } from "./useCarbonProgram";
import { PROGRAM_ID, KZTE_DECIMALS } from "@/lib/constants";
import type { OnChainProject } from "./useProjects";

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

export function useProject(projectId: string) {
  const program = useCarbonProgram();
  const [project, setProject] = useState<OnChainProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!program || !projectId) return;
    setLoading(true);
    setError(null);

    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("project"), Buffer.from(projectId)],
        PROGRAM_ID
      );

      const acc = await (program.account as any).carbonProject.fetch(pda);

      setProject({
        id: acc.projectId,
        name: acc.name,
        authority: acc.authority.toString(),
        projectType: parseProjectType(acc.projectType),
        carbonMint: acc.carbonMint.toString(),
        shareMint: acc.shareMint.toString(),
        totalCredits: Number(acc.totalCredits),
        creditsRetired: Number(acc.creditsRetired),
        totalShares: Number(acc.totalShares),
        sharesSold: Number(acc.sharesSold),
        pricePerShare: Number(acc.pricePerShare) / 10 ** KZTE_DECIMALS,
        verified: acc.verified,
        status: parseStatus(acc.status),
        documentHash: Array.from(acc.documentHash),
        totalDividendsPerShare: acc.totalDividendsPerShare.toString(),
        listingCount: Number(acc.listingCount),
        pda: pda.toString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project not found");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [program, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error, refetch: fetchProject };
}
