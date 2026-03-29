import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

const KZTE_MINT = new anchor.web3.PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;
  const authority = provider.wallet;

  const projectId = "solar-kapchagai";
  const revenueAmount = new BN(10_000_000000); // 10,000 KZTE

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

  const project = await program.account.carbonProject.fetch(projectPda);
  console.log(`Project: ${project.name}`);
  console.log(`Shares sold: ${project.sharesSold.toNumber()}`);
  console.log(`Current dividends/share: ${Number(project.totalDividendsPerShare)}`);

  if (project.sharesSold.toNumber() === 0) {
    console.log("No shares sold yet — cannot distribute revenue");
    return;
  }

  try {
    const tx = await program.methods
      .distributeRevenue(revenueAmount)
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        vault: vaultPda,
        authorityKzteAccount: authorityKzteAta,
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const perShare = revenueAmount.toNumber() / project.sharesSold.toNumber();
    console.log(`\n✓ Distributed ${revenueAmount.toNumber() / 1_000_000} KZTE`);
    console.log(`  Per share: ${perShare / 1_000_000} KZTE`);
    console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err: any) {
    console.error("✗ Failed:", err.message);
  }
}

main().catch(console.error);
