import type { Idl } from "@coral-xyz/anchor";
import rawIdl from "@/idl/carbon_kz.json";

// Pyth SDK types (PriceUpdateV2, VerificationLevel, PriceFeedMessage) leak into
// the Anchor IDL via idl-build. The Anchor JS client can't deserialize them,
// causing "variant mismatch" errors. Strip all Pyth-related entries.
const PYTH_TYPES = new Set([
  "PriceUpdateV2",
  "PriceFeedMessage",
  "VerificationLevel",
]);

// New instructions/accounts that reference Pyth or Token-2022 types
const STRIP_INSTRUCTIONS = new Set([
  "update_price",
  "mint_retire_certificate_v2",
]);

const STRIP_ACCOUNTS = new Set([
  "OracleConfig",
]);

function cleanIdl(idl: any): any {
  return {
    ...idl,
    accounts: (idl.accounts ?? []).filter(
      (a: any) => !PYTH_TYPES.has(a.name) && !STRIP_ACCOUNTS.has(a.name)
    ),
    types: (idl.types ?? []).filter(
      (t: any) => !PYTH_TYPES.has(t.name) && !STRIP_ACCOUNTS.has(t.name)
    ),
    instructions: (idl.instructions ?? []).filter(
      (i: any) => !STRIP_INSTRUCTIONS.has(i.name)
    ),
  };
}

export const idl: Idl = cleanIdl(rawIdl) as Idl;
