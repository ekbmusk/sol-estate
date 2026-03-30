import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Mint carbon tokens for a project to a recipient wallet.
 * Used to set up retire demo — you can't burn what you don't have.
 *
 * Usage:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/mint-carbon-tokens.ts <project-id> <recipient-pubkey> <amount>
 *
 * Example:
 *   npx ts-node scripts/mint-carbon-tokens.ts ses-yasavi GH7kR...abc 36
 */

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log("Usage: npx ts-node scripts/mint-carbon-tokens.ts <project-id> <recipient> <amount>");
    console.log("\nAvailable projects on devnet:");
    console.log("  ses-yasavi (36 credits)");
    console.log("  wind-yereymentau (12000 credits)");
    console.log("  forest-burabay (3000 credits)");
    console.log("  arcelor-temirtau (8000 credits)");
    process.exit(1);
  }

  const [projectId, recipientStr, amountStr] = args;
  const amount = parseInt(amountStr, 10);

  if (isNaN(amount) || amount <= 0) {
    console.error("Amount must be a positive integer");
    process.exit(1);
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;
  const authority = provider.wallet;
  const recipient = new anchor.web3.PublicKey(recipientStr);

  const [projectPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("project"), Buffer.from(projectId)],
    program.programId
  );

  const [carbonMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("carbon_mint"), Buffer.from(projectId)],
    program.programId
  );

  const recipientAta = await getAssociatedTokenAddress(carbonMintPda, recipient);

  try {
    const tx = await program.methods
      .mintCarbonTokens(new BN(amount))
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        carbonMint: carbonMintPda,
        recipientTokenAccount: recipientAta,
        recipient: recipient,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      } as any)
      .rpc();

    console.log(`✓ Minted ${amount} carbon tokens for project "${projectId}"`);
    console.log(`  Recipient: ${recipient.toString()}`);
    console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err: any) {
    console.error(`✗ Failed:`, err.message?.slice(0, 300));
  }
}

main().catch(console.error);
