import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "AtqkY8tyT9AwUe7JPDFnGuFoFtfXcj264AVEJWtMnL2u"
);

export const KZTE_MINT = new PublicKey(
  "tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE"
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
