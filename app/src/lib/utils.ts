import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simulate a transaction before sending.
 * Throws with a readable error message if simulation fails.
 */
export async function simulateTransaction(
  connection: Connection,
  tx: Transaction | VersionedTransaction
): Promise<void> {
  const result = await connection.simulateTransaction(tx as any);
  if (result.value.err) {
    const logs = result.value.logs?.join("\n") ?? "";
    const anchorError = logs.match(/Error Message: (.+)/)?.[1];
    throw new Error(anchorError ?? `Simulation failed: ${JSON.stringify(result.value.err)}`);
  }
}
