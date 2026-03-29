import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { SolEstate } from "../target/types/sol_estate";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

const KZTE_MINT = new anchor.web3.PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solEstate as Program<SolEstate>;
  const authority = provider.wallet;

  const properties = [
    {
      id: "expo-city",
      name: 'ЖК "Expo City"',
      totalShares: new BN(10000),
      pricePerShare: new BN(5000_000000), // 5000 KZTE
    },
    {
      id: "al-farabi",
      name: 'БЦ "Аль-Фараби"',
      totalShares: new BN(5000),
      pricePerShare: new BN(10000_000000), // 10000 KZTE
    },
    {
      id: "burabay-residence",
      name: 'Курорт "Бурабай Резиденс"',
      totalShares: new BN(2000),
      pricePerShare: new BN(25000_000000), // 25000 KZTE
    },
  ];

  const documentHash = Array(32).fill(1);

  for (const prop of properties) {
    const [propertyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(prop.id)],
      program.programId
    );
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(prop.id)],
      program.programId
    );
    const [shareMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(prop.id)],
      program.programId
    );
    const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);

    try {
      const tx = await program.methods
        .initializeProperty(prop.id, prop.name, prop.totalShares, prop.pricePerShare, documentHash)
        .accounts({
          authority: authority.publicKey,
          property: propertyPda,
          vault: vaultPda,
          shareMint: shareMintPda,
          kzteMint: KZTE_MINT,
          vaultTokenAccount: vaultTokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log(`✓ ${prop.name} initialized: ${tx}`);
    } catch (err: any) {
      if (err.message?.includes("already in use")) {
        console.log(`⊘ ${prop.name} already exists, skipping`);
      } else {
        console.error(`✗ ${prop.name} failed:`, err.message);
      }
    }
  }

  console.log("\nDone! Properties initialized on devnet.");
  console.log("Program ID:", program.programId.toString());
  console.log("KZTE Mint:", KZTE_MINT.toString());
}

main().catch(console.error);
