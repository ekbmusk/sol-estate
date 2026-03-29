import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import { PublicKey } from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;

  const projects = [
    { id: "solar-kapchagai", name: "Капшагай Доля", symbol: "KPCH" },
    { id: "wind-yereymentau", name: "Ерейментау Доля", symbol: "YRMN" },
    { id: "forest-burabay", name: "Бурабай Доля", symbol: "BRBY" },
    { id: "arcelor-temirtau", name: "ArcelorMittal Доля", symbol: "ARMT" },
  ];

  for (const proj of projects) {
    const [projectPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(proj.id)],
      program.programId
    );
    const [shareMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(proj.id)],
      program.programId
    );
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        shareMintPda.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    try {
      const tx = await (program.methods as any)
        .createShareMetadata(proj.name, proj.symbol)
        .accounts({
          authority: provider.wallet.publicKey,
          project: projectPda,
          shareMint: shareMintPda,
          metadata: metadataPda,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log(`✓ ${proj.name} (${proj.symbol}): https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (err: any) {
      if (err.message?.includes("already in use")) {
        console.log(`⊘ ${proj.name} — metadata already exists`);
      } else {
        console.error(`✗ ${proj.name} failed:`, err.message?.slice(0, 200));
      }
    }
  }
}

main().catch(console.error);
