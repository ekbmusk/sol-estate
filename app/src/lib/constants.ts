import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg"
);

export const KZTE_MINT = new PublicKey(
  "tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE"
);

export const KZTE_DECIMALS = 6;

export const NETWORK = "devnet";

export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? "https://api.devnet.solana.com";

/**
 * Converts raw lamport amount to display format with ₸ symbol
 */
export function formatKZTE(lamports: number): string {
  const amount = lamports / 10 ** KZTE_DECIMALS;
  return `${amount.toLocaleString("ru-RU")} ₸`;
}
