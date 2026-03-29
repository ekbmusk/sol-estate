"use client";

import { useMemo } from "react";
import { useAnchorProvider } from "@/components/providers/AnchorProvider";
import { Program } from "@coral-xyz/anchor";
import idl from "@/idl/carbon_kz.json";

export function useCarbonProgram() {
  const provider = useAnchorProvider();

  const program = useMemo(() => {
    if (!provider) return null;

    return new Program(idl as any, provider);
  }, [provider]);

  return program;
}
