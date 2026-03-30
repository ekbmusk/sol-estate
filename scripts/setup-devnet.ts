import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

const KZTE_MINT = new anchor.web3.PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;
  const authority = provider.wallet;

  const projects = [
    {
      id: "ses-yasavi",
      name: "СЭС Университета Ахмеда Ясави",
      projectType: { solar: {} },
      totalCredits: new BN(36),
      totalShares: new BN(360),
      pricePerShare: new BN(10000_000000), // 10,000 KZTE
    },
    {
      id: "wind-yereymentau",
      name: "Ветропарк Ерейментау",
      projectType: { wind: {} },
      totalCredits: new BN(12000),
      totalShares: new BN(12000),
      pricePerShare: new BN(5000_000000), // 5,000 KZTE
    },
    {
      id: "forest-burabay",
      name: "Лесовосстановление Бурабай",
      projectType: { forest: {} },
      totalCredits: new BN(3000),
      totalShares: new BN(3000),
      pricePerShare: new BN(15000_000000), // 15,000 KZTE
    },
    {
      id: "arcelor-temirtau",
      name: "ArcelorMittal Теміртау",
      projectType: { industrial: {} },
      totalCredits: new BN(8000),
      totalShares: new BN(8000),
      pricePerShare: new BN(8000_000000), // 8,000 KZTE
    },
  ];

  const documentHash = Array(32).fill(1);

  for (const proj of projects) {
    const [projectPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(proj.id)],
      program.programId
    );
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(proj.id)],
      program.programId
    );
    const vaultTokenAccount = await getAssociatedTokenAddress(KZTE_MINT, vaultPda, true);

    try {
      const tx = await program.methods
        .initializeProject(
          proj.id,
          proj.name,
          proj.projectType as any,
          proj.totalCredits,
          proj.totalShares,
          proj.pricePerShare,
          documentHash
        )
        .accounts({
          authority: authority.publicKey,
          kzteMint: KZTE_MINT,
          vaultTokenAccount: vaultTokenAccount,
        } as any)
        .rpc();

      console.log(`✓ ${proj.name} initialized: ${tx}`);

      // Verify the project
      const verifyTx = await program.methods
        .verifyProject(documentHash)
        .accounts({
          verifier: authority.publicKey,
          project: projectPda,
        } as any)
        .rpc();

      console.log(`  ✓ Verified: ${verifyTx}`);
    } catch (err: any) {
      if (err.message?.includes("already in use")) {
        console.log(`⊘ ${proj.name} already exists, skipping`);
      } else {
        console.error(`✗ ${proj.name} failed:`, err.message?.slice(0, 200));
      }
    }
  }

  console.log("\nDone! Projects initialized and verified on devnet.");
  console.log("Program ID:", program.programId.toString());
  console.log("KZTE Mint:", KZTE_MINT.toString());
}

main().catch(console.error);
