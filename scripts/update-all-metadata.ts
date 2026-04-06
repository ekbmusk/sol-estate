import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import { PublicKey } from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const BASE_URL = "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets";

const tokens = [
  // Share tokens
  { id: "ses-yasavi", type: "share", name: "СЭС Ясави Доля", symbol: "sYSV", image: `${BASE_URL}/share-solar.png` },
  { id: "wind-yereymentau", type: "share", name: "ВЭС Ерейментау Доля", symbol: "sYRM", image: `${BASE_URL}/share-wind.png` },
  { id: "forest-burabay", type: "share", name: "Бурабай Доля", symbol: "sBRB", image: `${BASE_URL}/share-forest.png` },
  { id: "arcelor-temirtau", type: "share", name: "ArcelorMittal Доля", symbol: "sAMT", image: `${BASE_URL}/share-industrial.png` },
  // Carbon tokens
  { id: "ses-yasavi", type: "carbon", name: "Carbon СЭС Ясави", symbol: "cYSV", image: `${BASE_URL}/carbon.png` },
  { id: "wind-yereymentau", type: "carbon", name: "Carbon Ерейментау", symbol: "cYRM", image: `${BASE_URL}/carbon.png` },
  { id: "forest-burabay", type: "carbon", name: "Carbon Бурабай", symbol: "cBRB", image: `${BASE_URL}/carbon.png` },
  { id: "arcelor-temirtau", type: "carbon", name: "Carbon ArcelorMittal", symbol: "cAMT", image: `${BASE_URL}/carbon.png` },
];

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.carbonKz as Program<CarbonKz>;

  for (const t of tokens) {
    const mintSeed = t.type === "share" ? "share_mint" : "carbon_mint";
    const [projectPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(t.id)],
      program.programId
    );
    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(mintSeed), Buffer.from(t.id)],
      program.programId
    );
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintPda.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Check if metadata exists
    const info = await provider.connection.getAccountInfo(metadataPda);

    try {
      if (!info) {
        // Create first if doesn't exist (only works for share mints via create_share_metadata)
        if (t.type === "share") {
          await (program.methods as any)
            .createShareMetadata(t.name, t.symbol)
            .accounts({
              authority: provider.wallet.publicKey,
              project: projectPda,
              shareMint: mintPda,
              metadata: metadataPda,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();
          console.log(`✓ Created ${t.name} (${t.symbol})`);
        } else {
          // Create carbon metadata via on-chain instruction
          const [cProjectPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("project"), Buffer.from(t.id)],
            program.programId
          );
          await (program.methods as any)
            .createCarbonMetadata(t.name, t.symbol, t.image)
            .accounts({
              authority: provider.wallet.publicKey,
              project: cProjectPda,
              carbonMint: mintPda,
              metadata: metadataPda,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();
          console.log(`✓ Created ${t.name} (${t.symbol}) with icon`);
          continue;
        }
      }

      // Now update with URI
      const tx = await (program.methods as any)
        .updateTokenMetadata(t.name, t.symbol, t.image)
        .accounts({
          authority: provider.wallet.publicKey,
          project: projectPda,
          tokenMint: mintPda,
          metadata: metadataPda,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();

      console.log(`✓ ${t.name} (${t.symbol}) — updated with icon`);
      console.log(`  https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (err: any) {
      console.error(`✗ ${t.name}:`, err.message?.slice(0, 200));
    }
  }

  console.log("\nDone! Check Phantom wallet in ~5 minutes for icons.");
}

main().catch(console.error);
