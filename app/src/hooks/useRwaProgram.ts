"use client";

import { useMemo } from "react";
import { useAnchorProvider } from "@/components/providers/AnchorProvider";
import { Program } from "@coral-xyz/anchor";
import idl from "@/idl/sol_estate.json";

export function useRwaProgram() {
  const provider = useAnchorProvider();

  const program = useMemo(() => {
    if (!provider) return null;

    return new Program(idl as any, provider);
  }, [provider]);

  return program;
}
