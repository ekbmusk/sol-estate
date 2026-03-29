"use client";

import { useMemo } from "react";
import { useAnchorProvider } from "@/components/providers/AnchorProvider";
import { Program } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/constants";

// TODO: Import the actual IDL once generated from the Anchor program
// import { IDL, type RwaTokenization } from "@/lib/idl/rwa_tokenization";

// Placeholder IDL — replace with the real one after `anchor build`
const PLACEHOLDER_IDL = {
  version: "0.1.0",
  name: "rwa_tokenization",
  instructions: [],
  accounts: [],
} as const;

export function useRwaProgram() {
  const provider = useAnchorProvider();

  const program = useMemo(() => {
    if (!provider) return null;

    // TODO: Replace PLACEHOLDER_IDL with actual IDL
    // return new Program<RwaTokenization>(IDL, PROGRAM_ID, provider);
    return new Program(PLACEHOLDER_IDL as never, provider);
  }, [provider]);

  return program;
}
