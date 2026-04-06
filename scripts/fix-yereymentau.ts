import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import { PublicKey } from "@solana/web3.js";

const TMP = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const BASE_URL = "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.carbonKz as Program<CarbonKz>;

  const id = "wind-yereymentau";
  const [projectPda] = PublicKey.findProgramAddressSync([Buffer.from("project"), Buffer.from(id)], program.programId);
  const [shareMint] = PublicKey.findProgramAddressSync([Buffer.from("share_mint"), Buffer.from(id)], program.programId);
  const [metadataPda] = PublicKey.findProgramAddressSync([Buffer.from("metadata"), TMP.toBuffer(), shareMint.toBuffer()], TMP);

  const info = await provider.connection.getAccountInfo(metadataPda);
  console.log("Metadata exists:", !!info);

  if (info) {
    const tx = await (program.methods as any)
      .updateTokenMetadata("ВЭС Ерейментау Доля", "sYRM", `${BASE_URL}/share-wind.png`)
      .accounts({
        authority: provider.wallet.publicKey,
        project: projectPda,
        tokenMint: shareMint,
        metadata: metadataPda,
        tokenMetadataProgram: TMP,
      })
      .rpc();
    console.log(`✓ Updated: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } else {
    console.log("No metadata — creating...");
    const tx = await (program.methods as any)
      .createShareMetadata("ВЭС Ерейментау Доля", "sYRM")
      .accounts({
        authority: provider.wallet.publicKey,
        project: projectPda,
        shareMint: shareMint,
        metadata: metadataPda,
        tokenMetadataProgram: TMP,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log(`✓ Created: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  }
}

main().catch((e) => console.error("Error:", e.message?.slice(0, 300)));
