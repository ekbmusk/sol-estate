import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "11111111111111111111111111111111" // TODO: Replace with actual program ID
);

export const KZTE_MINT = new PublicKey(
  "11111111111111111111111111111111" // TODO: Replace with actual KZTE mint address
);

export const KZTE_DECIMALS = 6;

export const NETWORK = "devnet";

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

/**
 * Converts raw lamport amount to display format with ₸ symbol
 */
export function formatKZTE(lamports: number): string {
  const amount = lamports / 10 ** KZTE_DECIMALS;
  return `${amount.toLocaleString("ru-RU")} ₸`;
}
