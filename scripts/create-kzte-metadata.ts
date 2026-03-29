import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const KZTE_MINT = new PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = (provider.wallet as any).payer;

  // Derive metadata PDA
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      KZTE_MINT.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  console.log("Metadata PDA:", metadataPda.toString());

  // CreateMetadataAccountV3 instruction data
  // See: https://github.com/metaplex-foundation/mpl-token-metadata/blob/main/programs/token-metadata/program/src/instruction/metadata.rs
  const name = "KZTE Stablecoin";
  const symbol = "KZTE";
  const uri = ""; // no off-chain metadata needed

  // Serialize the CreateMetadataAccountV3 instruction manually
  // Discriminator for CreateMetadataAccountV3 = 33
  const nameBuffer = Buffer.from(name, "utf-8");
  const symbolBuffer = Buffer.from(symbol, "utf-8");
  const uriBuffer = Buffer.from(uri, "utf-8");

  const data = Buffer.concat([
    Buffer.from([33]), // CreateMetadataAccountV3 discriminator
    // DataV2 struct:
    // name (string: 4-byte len + bytes)
    Buffer.from(new Uint8Array(new Uint32Array([nameBuffer.length]).buffer)),
    nameBuffer,
    // symbol (string)
    Buffer.from(new Uint8Array(new Uint32Array([symbolBuffer.length]).buffer)),
    symbolBuffer,
    // uri (string)
    Buffer.from(new Uint8Array(new Uint32Array([uriBuffer.length]).buffer)),
    uriBuffer,
    // seller_fee_basis_points (u16)
    Buffer.from([0, 0]),
    // creators (Option<Vec<Creator>>): None
    Buffer.from([0]),
    // collection (Option<Collection>): None
    Buffer.from([0]),
    // uses (Option<Uses>): None
    Buffer.from([0]),
    // is_mutable (bool)
    Buffer.from([1]),
    // collection_details (Option<CollectionDetails>): None
    Buffer.from([0]),
  ]);

  const keys = [
    { pubkey: metadataPda, isSigner: false, isWritable: true },        // metadata account
    { pubkey: KZTE_MINT, isSigner: false, isWritable: false },          // mint
    { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false }, // mint authority
    { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },  // payer
    { pubkey: provider.wallet.publicKey, isSigner: false, isWritable: false }, // update authority
    { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: anchor.web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  const ix = new anchor.web3.TransactionInstruction({
    programId: TOKEN_METADATA_PROGRAM_ID,
    keys,
    data,
  });

  const tx = new Transaction().add(ix);

  try {
    const sig = await sendAndConfirmTransaction(
      provider.connection,
      tx,
      [payer],
      { commitment: "confirmed" }
    );
    console.log(`\n✓ KZTE metadata created!`);
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  TX: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  } catch (err: any) {
    if (err.message?.includes("already in use")) {
      console.log("Metadata already exists for KZTE mint");
    } else {
      console.error("✗ Failed:", err.message);
    }
  }
}

main().catch(console.error);
