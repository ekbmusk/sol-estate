import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const KZTE_MINT = new PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");

// Token metadata with emoji-based SVG data URIs (no external hosting needed)
const TOKEN_CONFIGS = {
  kzte: {
    name: "KZTE Stablecoin",
    symbol: "KZTE",
    // Green tenge symbol on dark background
    image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/kzte.png",
  },
  shares: [
    { id: "ses-yasavi", name: "СЭС Ясави", symbol: "sYSV", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/share-solar.png" },
    { id: "wind-yereymentau", name: "ВЭС Ерейментау", symbol: "sYRM", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/share-wind.png" },
    { id: "forest-burabay", name: "Лес Бурабай", symbol: "sBRB", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/share-forest.png" },
    { id: "arcelor-temirtau", name: "ArcelorMittal", symbol: "sAMT", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/share-industrial.png" },
  ],
  carbons: [
    { id: "ses-yasavi", name: "Carbon СЭС Ясави", symbol: "cYSV", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/carbon.png" },
    { id: "wind-yereymentau", name: "Carbon ВЭС Ерейментау", symbol: "cYRM", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/carbon.png" },
    { id: "forest-burabay", name: "Carbon Бурабай", symbol: "cBRB", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/carbon.png" },
    { id: "arcelor-temirtau", name: "Carbon ArcelorMittal", symbol: "cAMT", image: "https://raw.githubusercontent.com/ekbmusk/sol-estate/main/assets/carbon.png" },
  ],
};

function buildCreateMetadataIx(
  metadataPda: PublicKey,
  mint: PublicKey,
  authority: PublicKey,
  name: string,
  symbol: string,
  uri: string,
) {
  const nameBuffer = Buffer.from(name, "utf-8");
  const symbolBuffer = Buffer.from(symbol, "utf-8");
  const uriBuffer = Buffer.from(uri, "utf-8");

  const data = Buffer.concat([
    Buffer.from([33]), // CreateMetadataAccountV3
    Buffer.from(new Uint8Array(new Uint32Array([nameBuffer.length]).buffer)),
    nameBuffer,
    Buffer.from(new Uint8Array(new Uint32Array([symbolBuffer.length]).buffer)),
    symbolBuffer,
    Buffer.from(new Uint8Array(new Uint32Array([uriBuffer.length]).buffer)),
    uriBuffer,
    Buffer.from([0, 0]), // seller_fee_basis_points
    Buffer.from([0]),     // creators: None
    Buffer.from([0]),     // collection: None
    Buffer.from([0]),     // uses: None
    Buffer.from([1]),     // is_mutable
    Buffer.from([0]),     // collection_details: None
  ]);

  return new anchor.web3.TransactionInstruction({
    programId: TOKEN_METADATA_PROGRAM_ID,
    keys: [
      { pubkey: metadataPda, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: authority, isSigner: false, isWritable: false },
      { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: anchor.web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });
}

function buildUpdateMetadataIx(
  metadataPda: PublicKey,
  authority: PublicKey,
  name: string,
  symbol: string,
  uri: string,
) {
  const nameBuffer = Buffer.from(name, "utf-8");
  const symbolBuffer = Buffer.from(symbol, "utf-8");
  const uriBuffer = Buffer.from(uri, "utf-8");

  // UpdateMetadataAccountV2 discriminator = 15
  const data = Buffer.concat([
    Buffer.from([15]),
    // Option<DataV2>: Some
    Buffer.from([1]),
    // DataV2:
    Buffer.from(new Uint8Array(new Uint32Array([nameBuffer.length]).buffer)),
    nameBuffer,
    Buffer.from(new Uint8Array(new Uint32Array([symbolBuffer.length]).buffer)),
    symbolBuffer,
    Buffer.from(new Uint8Array(new Uint32Array([uriBuffer.length]).buffer)),
    uriBuffer,
    Buffer.from([0, 0]), // seller_fee_basis_points
    Buffer.from([0]),     // creators: None
    Buffer.from([0]),     // collection: None
    Buffer.from([0]),     // uses: None
    // new_update_authority: None
    Buffer.from([0]),
    // primary_sale_happened: None
    Buffer.from([0]),
    // is_mutable: None
    Buffer.from([0]),
  ]);

  return new anchor.web3.TransactionInstruction({
    programId: TOKEN_METADATA_PROGRAM_ID,
    keys: [
      { pubkey: metadataPda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

async function createOrUpdateMetadata(
  provider: anchor.AnchorProvider,
  mint: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  label: string,
) {
  const payer = (provider.wallet as any).payer;
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Check if metadata already exists
  const info = await provider.connection.getAccountInfo(metadataPda);

  let ix;
  if (info) {
    // Update existing
    ix = buildUpdateMetadataIx(metadataPda, provider.wallet.publicKey, name, symbol, uri);
  } else {
    // Create new
    ix = buildCreateMetadataIx(metadataPda, mint, provider.wallet.publicKey, name, symbol, uri);
  }

  const tx = new Transaction().add(ix);
  try {
    const sig = await sendAndConfirmTransaction(provider.connection, tx, [payer], { commitment: "confirmed" });
    console.log(`✓ ${label}: ${name} (${symbol}) — ${info ? "updated" : "created"}`);
    console.log(`  https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  } catch (err: any) {
    console.error(`✗ ${label} failed:`, err.message?.slice(0, 200));
  }
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.carbonKz as Program<CarbonKz>;

  console.log("=== KZTE Metadata ===");
  await createOrUpdateMetadata(
    provider, KZTE_MINT,
    TOKEN_CONFIGS.kzte.name, TOKEN_CONFIGS.kzte.symbol, TOKEN_CONFIGS.kzte.image,
    "KZTE"
  );

  console.log("\n=== Share Token Metadata ===");
  for (const share of TOKEN_CONFIGS.shares) {
    const [shareMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(share.id)],
      program.programId
    );
    await createOrUpdateMetadata(provider, shareMint, share.name, share.symbol, share.image, share.id);
  }

  console.log("\n=== Carbon Token Metadata ===");
  for (const carbon of TOKEN_CONFIGS.carbons) {
    const [carbonMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(carbon.id)],
      program.programId
    );
    await createOrUpdateMetadata(provider, carbonMint, carbon.name, carbon.symbol, carbon.image, carbon.id);
  }

  console.log("\nDone! Tokens should now show names and symbols in Phantom wallet.");
  console.log("Note: Images will appear once PNG files are pushed to GitHub at assets/");
}

main().catch(console.error);
