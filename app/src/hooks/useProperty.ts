"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCarbonProgram } from "./useCarbonProgram";
import { PROGRAM_ID } from "@/lib/constants";

interface ProjectData {
  authority: PublicKey;
  projectId: string;
  name: string;
  projectType: Record<string, object>;
  carbonMint: PublicKey;
  totalCredits: number;
  creditsRetired: number;
  totalShares: number;
  sharesSold: number;
  pricePerShare: number;
  shareMint: PublicKey;
  vault: PublicKey;
  totalDividendsPerShare: number;
  documentHash: number[];
  verified: boolean;
  status: Record<string, object>;
  bump: number;
}

interface UseProjectResult {
  project: ProjectData | null;
  projectPda: PublicKey | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProject(
  projectIdOrPda: string | PublicKey
): UseProjectResult {
  const program = useCarbonProgram();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pda =
    typeof projectIdOrPda === "string"
      ? PublicKey.findProgramAddressSync(
          [Buffer.from("project"), Buffer.from(projectIdOrPda)],
          PROGRAM_ID
        )[0]
      : projectIdOrPda;

  const fetchProject = useCallback(async () => {
    if (!program || !pda) {
      setProject(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const account = await (program.account as any).carbonProject.fetch(pda);

      setProject({
        authority: account.authority,
        projectId: account.projectId,
        name: account.name,
        projectType: account.projectType,
        carbonMint: account.carbonMint,
        totalCredits: Number(account.totalCredits),
        creditsRetired: Number(account.creditsRetired),
        totalShares: Number(account.totalShares),
        sharesSold: Number(account.sharesSold),
        pricePerShare: Number(account.pricePerShare),
        shareMint: account.shareMint,
        vault: account.vault,
        totalDividendsPerShare: Number(account.totalDividendsPerShare),
        documentHash: Array.from(account.documentHash),
        verified: account.verified,
        status: account.status,
        bump: account.bump,
      });
    } catch (err: any) {
      if (err?.message?.includes("Account does not exist")) {
        setProject(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load project data"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [program, pda?.toBase58()]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, projectPda: pda, loading, error, refetch: fetchProject };
}
