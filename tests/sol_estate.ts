import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolEstate } from "../target/types/sol_estate";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("sol_estate", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solEstate as Program<SolEstate>;

  // Test accounts
  const authority = provider.wallet;
  const investor = anchor.web3.Keypair.generate();

  // Property params
  const propertyId = "expo-city-001";
  const propertyName = "ЖК Expo City, Астана";
  const totalShares = new anchor.BN(10000);
  const pricePerShare = new anchor.BN(5000_000000); // 5000 KZTE (6 decimals)
  const documentHash = Array(32).fill(1); // dummy hash

  let kzteMint: anchor.web3.PublicKey;
  let propertyPda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let shareMint: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to investor
    const sig = await provider.connection.requestAirdrop(
      investor.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Create KZTE mint (authority controls it for testing)
    kzteMint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      6 // KZTE decimals
    );

    // Mint KZTE to investor for testing
    const investorKzteAta = await createAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
      kzteMint,
      investor.publicKey
    );

    await mintTo(
      provider.connection,
      (authority as any).payer,
      kzteMint,
      investorKzteAta,
      authority.publicKey,
      100_000_000_000 // 100,000 KZTE
    );

    // Derive PDAs
    [propertyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(propertyId)],
      program.programId
    );

    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(propertyId)],
      program.programId
    );
  });

  it("Initializes a property", async () => {
    // Test initialize_property instruction
    // This will create PropertyAccount, VaultAccount, share_mint, vault_token_account
    // TODO: fill in once IDL is generated after anchor build
  });

  it("Investor buys shares", async () => {
    // Test invest instruction
    // Transfer KZTE from investor to vault, mint shares to investor
  });

  it("Authority distributes dividends", async () => {
    // Test distribute_dividends instruction
    // Authority sends KZTE to vault, updates total_dividends_per_share
  });

  it("Investor claims dividends", async () => {
    // Test claim_dividends instruction
    // Investor receives proportional KZTE from vault
  });

  it("Full E2E cycle: init → invest → distribute → claim", async () => {
    // Complete flow test with assertions on balances
  });
});
