import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const KZTE_MINT = new anchor.web3.PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

/**
 * Usage:
 *   npx ts-node scripts/distribute-revenue.ts <project-id> <amount-kzte>
 *
 * Example:
 *   npx ts-node scripts/distribute-revenue.ts ses-yasavi 50000
 */

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: npx ts-node scripts/distribute-revenue.ts <project-id> <amount-kzte>");
    process.exit(1);
  }

  const [projectId, amountStr] = args;
  const amountKzte = parseInt(amountStr, 10);
  const amountLamports = new BN(amountKzte).mul(new BN(1_000_000)); // 6 decimals

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;
  const authority = provider.wallet;

  const [projectPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("project"), Buffer.from(projectId)],
    program.programId
  );
  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), Buffer.from(projectId)],
    program.programId
  );
  const authorityKzteAta = await getAssociatedTokenAddress(KZTE_MINT, authority.publicKey);
  const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);

  try {
    const tx = await program.methods
      .distributeRevenue(amountLamports)
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        vault: vaultPda,
        authorityKzteAccount: authorityKzteAta,
        vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    console.log(`✓ Distributed ${amountKzte.toLocaleString()} KZTE to project "${projectId}"`);
    console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err: any) {
    console.error(`✗ Failed:`, err.message?.slice(0, 300));
  }
}

main().catch(console.error);
