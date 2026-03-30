import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const KZTE_MINT = new PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: npx ts-node scripts/mint-kzte.ts <recipient> [amount_kzte]");
    console.log("Default amount: 1,000,000 KZTE");
    process.exit(1);
  }

  const recipient = new PublicKey(args[0]);
  const amountKzte = parseInt(args[1] || "1000000", 10);
  const amountLamports = amountKzte * 1_000_000; // 6 decimals

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = (provider.wallet as any).payer;

  const ata = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    KZTE_MINT,
    recipient
  );

  const sig = await mintTo(
    provider.connection,
    payer,
    KZTE_MINT,
    ata.address,
    provider.wallet.publicKey,
    amountLamports
  );

  console.log(`✓ Minted ${amountKzte.toLocaleString()} KZTE to ${recipient.toString()}`);
  console.log(`  TX: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

main().catch(console.error);
