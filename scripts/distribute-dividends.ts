import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { SolEstate } from "../target/types/sol_estate";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

const KZTE_MINT = new anchor.web3.PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solEstate as Program<SolEstate>;
  const authority = provider.wallet;

  // Distribute dividends to expo-city (the property with investments)
  const propertyId = "expo-city";
  const dividendAmount = new BN(10_000_000000); // 10,000 KZTE

  const [propertyPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("property"), Buffer.from(propertyId)],
    program.programId
  );
  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), Buffer.from(propertyId)],
    program.programId
  );

  const authorityKzteAta = await getAssociatedTokenAddress(KZTE_MINT, authority.publicKey);
  const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);

  // Check current state
  const property = await program.account.propertyAccount.fetch(propertyPda);
  console.log(`Property: ${property.name}`);
  console.log(`Shares sold: ${property.sharesSold.toNumber()}`);
  console.log(`Current dividends/share: ${property.totalDividendsPerShare.toNumber()}`);

  if (property.sharesSold.toNumber() === 0) {
    console.log("No shares sold yet — cannot distribute dividends");
    return;
  }

  try {
    const tx = await program.methods
      .distributeDividends(dividendAmount)
      .accounts({
        authority: authority.publicKey,
        property: propertyPda,
        vault: vaultPda,
        authorityKzteAccount: authorityKzteAta,
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const perShare = dividendAmount.toNumber() / property.sharesSold.toNumber();
    console.log(`\n✓ Distributed ${dividendAmount.toNumber() / 1_000_000} KZTE`);
    console.log(`  Per share: ${perShare / 1_000_000} KZTE`);
    console.log(`  TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err: any) {
    console.error("✗ Failed:", err.message);
  }
}

main().catch(console.error);
