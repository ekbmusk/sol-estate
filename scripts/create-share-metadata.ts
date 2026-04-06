import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import { PublicKey } from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;

  const shares = [
    { id: "ses-yasavi", name: "СЭС Ясави Доля", symbol: "sYSV" },
    { id: "wind-yereymentau", name: "ВЭС Ерейментау Доля", symbol: "sYRM" },
    { id: "forest-burabay", name: "Бурабай Доля", symbol: "sBRB" },
    { id: "arcelor-temirtau", name: "ArcelorMittal Доля", symbol: "sAMT" },
  ];

  for (const s of shares) {
    const [projectPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(s.id)],
      program.programId
    );
    const [shareMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(s.id)],
      program.programId
    );
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), shareMint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    try {
      const tx = await (program.methods as any)
        .createShareMetadata(s.name, s.symbol)
        .accounts({
          authority: provider.wallet.publicKey,
          project: projectPda,
          shareMint: shareMint,
          metadata: metadataPda,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log(`✓ ${s.name} (${s.symbol}): https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (err: any) {
      if (err.message?.includes("already in use")) {
        console.log(`⊘ ${s.name} — metadata already exists`);
      } else {
        console.error(`✗ ${s.name}:`, err.message?.slice(0, 200));
      }
    }
  }
}

main().catch(console.error);
