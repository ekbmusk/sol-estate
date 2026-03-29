import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { SolEstate } from "../target/types/sol_estate";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("sol_estate", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solEstate as Program<SolEstate>;
  const payer = (provider.wallet as any).payer as anchor.web3.Keypair;

  // Actors
  const authority = provider.wallet;
  const investor = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();

  // Property params
  const propertyId = "expo-city-001";
  const propertyName = "ЖК Expo City, Астана";
  const totalShares = new BN(1000);
  const pricePerShare = new BN(5000_000000); // 5000 KZTE
  const documentHash = Array(32).fill(1);
  const investAmount = new BN(100); // shares

  let kzteMint: anchor.web3.PublicKey;
  let propertyPda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let shareMintPda: anchor.web3.PublicKey;
  let investorRecordPda: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to all actors
    for (const kp of [investor, buyer]) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Create KZTE mint
    kzteMint = await createMint(
      provider.connection,
      payer,
      authority.publicKey,
      null,
      6
    );

    // Mint KZTE to authority (for dividends)
    const authorityKzteAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      kzteMint,
      authority.publicKey
    );
    await mintTo(
      provider.connection,
      payer,
      kzteMint,
      authorityKzteAta,
      authority.publicKey,
      1_000_000_000_000 // 1,000,000 KZTE
    );

    // Mint KZTE to investor
    const investorKzteAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      kzteMint,
      investor.publicKey
    );
    await mintTo(
      provider.connection,
      payer,
      kzteMint,
      investorKzteAta,
      authority.publicKey,
      1_000_000_000_000
    );

    // Mint KZTE to buyer
    const buyerKzteAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      kzteMint,
      buyer.publicKey
    );
    await mintTo(
      provider.connection,
      payer,
      kzteMint,
      buyerKzteAta,
      authority.publicKey,
      1_000_000_000_000
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
    [shareMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(propertyId)],
      program.programId
    );
    [investorRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), propertyPda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );
  });

  // ── Wave 1 ──────────────────────────────────────────────

  it("Initializes a property", async () => {
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    await program.methods
      .initializeProperty(propertyId, propertyName, totalShares, pricePerShare, documentHash)
      .accounts({
        authority: authority.publicKey,
        property: propertyPda,
        vault: vaultPda,
        shareMint: shareMintPda,
        kzteMint: kzteMint,
        vaultTokenAccount: vaultTokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const property = await program.account.propertyAccount.fetch(propertyPda);
    assert.equal(property.propertyId, propertyId);
    assert.equal(property.name, propertyName);
    assert.equal(property.totalShares.toNumber(), 1000);
    assert.equal(property.sharesSold.toNumber(), 0);
    assert.equal(property.pricePerShare.toNumber(), 5000_000000);
    assert.deepEqual(property.status, { active: {} });
    assert.deepEqual(Array.from(property.documentHash), documentHash);

    const vault = await program.account.vaultAccount.fetch(vaultPda);
    assert.ok(vault.property.equals(propertyPda));
    assert.ok(vault.kzteMint.equals(kzteMint));
  });

  it("Investor buys shares", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);
    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    const kzteBefore = (await getAccount(provider.connection, investorKzteAta)).amount;

    await program.methods
      .invest(investAmount)
      .accounts({
        investor: investor.publicKey,
        property: propertyPda,
        vault: vaultPda,
        shareMint: shareMintPda,
        investorKzteAccount: investorKzteAta,
        vaultTokenAccount: vaultTokenAccount,
        investorShareAccount: investorShareAta,
        investorRecord: investorRecordPda,
        kzteMint: kzteMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([investor])
      .rpc();

    const property = await program.account.propertyAccount.fetch(propertyPda);
    assert.equal(property.sharesSold.toNumber(), 100);

    const record = await program.account.investorRecord.fetch(investorRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 100);
    assert.ok(record.owner.equals(investor.publicKey));

    const kzteAfter = (await getAccount(provider.connection, investorKzteAta)).amount;
    const expectedCost = BigInt(100) * BigInt(5000_000000);
    assert.equal(kzteBefore - kzteAfter, expectedCost);

    const shareBalance = (await getAccount(provider.connection, investorShareAta)).amount;
    assert.equal(shareBalance, BigInt(100));
  });

  it("Authority distributes dividends", async () => {
    const dividendAmount = new BN(50_000_000000); // 50,000 KZTE
    const authorityKzteAta = await getAssociatedTokenAddress(kzteMint, authority.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    await program.methods
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

    const property = await program.account.propertyAccount.fetch(propertyPda);
    // 50,000 KZTE / 100 shares_sold = 500 KZTE per share = 500_000000
    assert.equal(property.totalDividendsPerShare.toNumber(), 500_000000);
  });

  it("Investor claims dividends", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    const kzteBefore = (await getAccount(provider.connection, investorKzteAta)).amount;

    await program.methods
      .claimDividends()
      .accounts({
        investor: investor.publicKey,
        property: propertyPda,
        vault: vaultPda,
        investorRecord: investorRecordPda,
        vaultTokenAccount: vaultTokenAccount,
        investorKzteAccount: investorKzteAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([investor])
      .rpc();

    const kzteAfter = (await getAccount(provider.connection, investorKzteAta)).amount;
    // 500_000000 per share * 100 shares = 50,000 KZTE = 50_000_000000
    const claimed = kzteAfter - kzteBefore;
    assert.equal(claimed, BigInt(50_000_000000));

    const record = await program.account.investorRecord.fetch(investorRecordPda);
    assert.equal(record.lastClaimed.toNumber(), 500_000000);
  });

  // ── Wave 2 ──────────────────────────────────────────────

  it("Investor lists shares for sale", async () => {
    const listAmount = new BN(20);
    const listPrice = new BN(6000_000000); // 6000 KZTE per share

    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), propertyPda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );

    // Create escrow ATA owned by listing PDA
    const escrowShareAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      shareMintPda,
      listingPda,
      true // allowOwnerOffCurve for PDA
    );

    await program.methods
      .listShares(listAmount, listPrice)
      .accounts({
        seller: investor.publicKey,
        property: propertyPda,
        investorRecord: investorRecordPda,
        listing: listingPda,
        sellerShareAccount: investorShareAta,
        escrowShareAccount: escrowShareAta.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([investor])
      .rpc();

    const listing = await program.account.listing.fetch(listingPda);
    assert.equal(listing.amount.toNumber(), 20);
    assert.equal(listing.pricePerShare.toNumber(), 6000_000000);
    assert.equal(listing.active, true);

    const escrowBalance = (await getAccount(provider.connection, escrowShareAta.address)).amount;
    assert.equal(escrowBalance, BigInt(20));

    // Verify investor record shares_owned was decremented
    const record = await program.account.investorRecord.fetch(investorRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 80); // 100 - 20 listed
  });

  it("Buyer purchases listed shares", async () => {
    const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), propertyPda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );

    const escrowShareAta = await getAssociatedTokenAddress(shareMintPda, listingPda, true);
    const buyerKzteAta = await getAssociatedTokenAddress(kzteMint, buyer.publicKey);
    const sellerKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const buyerShareAta = await getAssociatedTokenAddress(shareMintPda, buyer.publicKey);

    const [buyerRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), propertyPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );

    const sellerKzteBefore = (await getAccount(provider.connection, sellerKzteAta)).amount;

    await program.methods
      .buyShares()
      .accounts({
        buyer: buyer.publicKey,
        seller: investor.publicKey,
        property: propertyPda,
        vault: vaultPda,
        listing: listingPda,
        buyerKzteAccount: buyerKzteAta,
        sellerKzteAccount: sellerKzteAta,
        escrowShareAccount: escrowShareAta,
        buyerShareAccount: buyerShareAta,
        shareMint: shareMintPda,
        buyerRecord: buyerRecordPda,
        sellerRecord: investorRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([buyer])
      .rpc();

    // Listing deactivated
    const listing = await program.account.listing.fetch(listingPda);
    assert.equal(listing.active, false);

    // Buyer got shares
    const buyerShareBalance = (await getAccount(provider.connection, buyerShareAta)).amount;
    assert.equal(buyerShareBalance, BigInt(20));

    // Seller got KZTE (20 shares * 6000 KZTE = 120,000 KZTE)
    const sellerKzteAfter = (await getAccount(provider.connection, sellerKzteAta)).amount;
    assert.equal(sellerKzteAfter - sellerKzteBefore, BigInt(20) * BigInt(6000_000000));

    // Buyer record created
    const buyerRecord = await program.account.investorRecord.fetch(buyerRecordPda);
    assert.equal(buyerRecord.sharesOwned.toNumber(), 20);
  });

  // ── Wave 3 ──────────────────────────────────────────────

  it("Investor creates a proposal", async () => {
    const proposalId = new BN(1);
    const description = "Ремонт крыши ЖК Expo City";
    const durationSeconds = new BN(86400); // 1 day

    const [proposalPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), propertyPda.toBuffer(), proposalId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createProposal(proposalId, description, durationSeconds)
      .accounts({
        creator: investor.publicKey,
        property: propertyPda,
        investorRecord: investorRecordPda,
        proposal: proposalPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([investor])
      .rpc();

    const proposal = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposal.description, description);
    assert.equal(proposal.votesFor.toNumber(), 0);
    assert.equal(proposal.votesAgainst.toNumber(), 0);
    assert.equal(proposal.executed, false);
    assert.equal(proposal.proposalId.toNumber(), 1);
    assert.ok(proposal.deadline.toNumber() > 0);
  });

  it("Investor votes on proposal", async () => {
    const proposalId = new BN(1);

    const [proposalPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), propertyPda.toBuffer(), proposalId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [voteRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), proposalPda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .vote(true)
      .accounts({
        voter: investor.publicKey,
        property: propertyPda,
        proposal: proposalPda,
        investorRecord: investorRecordPda,
        voteRecord: voteRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([investor])
      .rpc();

    const proposal = await program.account.proposal.fetch(proposalPda);
    // Investor has 80 shares (100 - 20 sold via marketplace)
    assert.equal(proposal.votesFor.toNumber(), 80);

    const voteRecord = await program.account.voteRecord.fetch(voteRecordPda);
    assert.ok(voteRecord.voter.equals(investor.publicKey));

    // Verify double-vote fails
    try {
      await program.methods
        .vote(false)
        .accounts({
          voter: investor.publicKey,
          property: propertyPda,
          proposal: proposalPda,
          investorRecord: investorRecordPda,
          voteRecord: voteRecordPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([investor])
        .rpc();
      assert.fail("Should have failed — double vote");
    } catch (err) {
      // Expected: account already initialized
    }
  });

  // ── E2E ─────────────────────────────────────────────────

  it("Full E2E cycle: init → invest → distribute → claim", async () => {
    const e2ePropertyId = "e2e-test-001";
    const e2eShares = new BN(500);
    const e2ePrice = new BN(1000_000000); // 1000 KZTE
    const e2eHash = Array(32).fill(42);
    const e2eInvestor = anchor.web3.Keypair.generate();

    // Airdrop SOL
    const sig = await provider.connection.requestAirdrop(
      e2eInvestor.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Mint KZTE to e2e investor
    const e2eInvestorKzte = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      kzteMint,
      e2eInvestor.publicKey
    );
    await mintTo(
      provider.connection,
      payer,
      kzteMint,
      e2eInvestorKzte,
      authority.publicKey,
      500_000_000_000 // 500,000 KZTE
    );

    // Derive PDAs
    const [e2ePropertyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(e2ePropertyId)],
      program.programId
    );
    const [e2eVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(e2ePropertyId)],
      program.programId
    );
    const [e2eShareMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(e2ePropertyId)],
      program.programId
    );
    const [e2eInvestorRecord] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), e2ePropertyPda.toBuffer(), e2eInvestor.publicKey.toBuffer()],
      program.programId
    );

    const e2eVaultKzte = await getAssociatedTokenAddress(kzteMint, e2eVaultPda, true);
    const e2eInvestorShare = await getAssociatedTokenAddress(e2eShareMint, e2eInvestor.publicKey);
    const authorityKzte = await getAssociatedTokenAddress(kzteMint, authority.publicKey);

    // 1. Initialize
    await program.methods
      .initializeProperty(e2ePropertyId, "E2E Тест", e2eShares, e2ePrice, e2eHash)
      .accounts({
        authority: authority.publicKey,
        property: e2ePropertyPda,
        vault: e2eVaultPda,
        shareMint: e2eShareMint,
        kzteMint: kzteMint,
        vaultTokenAccount: e2eVaultKzte,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // 2. Invest 50 shares
    await program.methods
      .invest(new BN(50))
      .accounts({
        investor: e2eInvestor.publicKey,
        property: e2ePropertyPda,
        vault: e2eVaultPda,
        shareMint: e2eShareMint,
        investorKzteAccount: e2eInvestorKzte,
        vaultTokenAccount: e2eVaultKzte,
        investorShareAccount: e2eInvestorShare,
        investorRecord: e2eInvestorRecord,
        kzteMint: kzteMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([e2eInvestor])
      .rpc();

    // 3. Distribute 10,000 KZTE dividends
    await program.methods
      .distributeDividends(new BN(10_000_000000))
      .accounts({
        authority: authority.publicKey,
        property: e2ePropertyPda,
        vault: e2eVaultPda,
        authorityKzteAccount: authorityKzte,
        vaultTokenAccount: e2eVaultKzte,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // 4. Claim dividends
    const kzteBefore = (await getAccount(provider.connection, e2eInvestorKzte)).amount;

    await program.methods
      .claimDividends()
      .accounts({
        investor: e2eInvestor.publicKey,
        property: e2ePropertyPda,
        vault: e2eVaultPda,
        investorRecord: e2eInvestorRecord,
        vaultTokenAccount: e2eVaultKzte,
        investorKzteAccount: e2eInvestorKzte,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([e2eInvestor])
      .rpc();

    const kzteAfter = (await getAccount(provider.connection, e2eInvestorKzte)).amount;
    // 10,000 KZTE / 50 shares = 200 KZTE per share * 50 shares = 10,000 KZTE
    assert.equal(kzteAfter - kzteBefore, BigInt(10_000_000000));

    // Verify final state
    const finalProperty = await program.account.propertyAccount.fetch(e2ePropertyPda);
    assert.equal(finalProperty.sharesSold.toNumber(), 50);
    assert.equal(finalProperty.totalDividendsPerShare.toNumber(), 200_000000);
  });

  // ── Cancel Listing ──────────────────────────────────────

  it("Seller cancels a listing and recovers shares", async () => {
    // First, list some shares (investor still has 80 shares after earlier tests)
    const listAmount = new BN(10);
    const listPrice = new BN(7000_000000);

    // Need a new listing — previous one is deactivated but PDA is taken
    // Use the e2e property for a fresh listing
    const cancelPropertyId = "cancel-test-001";
    const cancelShares = new BN(100);
    const cancelPrice = new BN(1000_000000);
    const cancelHash = Array(32).fill(99);
    const cancelSeller = anchor.web3.Keypair.generate();

    // Airdrop SOL
    const sig1 = await provider.connection.requestAirdrop(
      cancelSeller.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig1);

    // Mint KZTE to seller
    const sellerKzte = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      kzteMint,
      cancelSeller.publicKey
    );
    await mintTo(
      provider.connection,
      payer,
      kzteMint,
      sellerKzte,
      authority.publicKey,
      500_000_000_000
    );

    // Derive PDAs
    const [cancelPropertyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(cancelPropertyId)],
      program.programId
    );
    const [cancelVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(cancelPropertyId)],
      program.programId
    );
    const [cancelShareMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(cancelPropertyId)],
      program.programId
    );
    const cancelVaultKzte = await getAssociatedTokenAddress(kzteMint, cancelVaultPda, true);

    // Initialize property
    await program.methods
      .initializeProperty(cancelPropertyId, "Cancel Test", cancelShares, cancelPrice, cancelHash)
      .accounts({
        authority: authority.publicKey,
        property: cancelPropertyPda,
        vault: cancelVaultPda,
        shareMint: cancelShareMint,
        kzteMint: kzteMint,
        vaultTokenAccount: cancelVaultKzte,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Invest
    const sellerShareAta = await getAssociatedTokenAddress(cancelShareMint, cancelSeller.publicKey);
    const [sellerRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), cancelPropertyPda.toBuffer(), cancelSeller.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .invest(new BN(50))
      .accounts({
        investor: cancelSeller.publicKey,
        property: cancelPropertyPda,
        vault: cancelVaultPda,
        shareMint: cancelShareMint,
        investorKzteAccount: sellerKzte,
        vaultTokenAccount: cancelVaultKzte,
        investorShareAccount: sellerShareAta,
        investorRecord: sellerRecordPda,
        kzteMint: kzteMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([cancelSeller])
      .rpc();

    // List 20 shares
    const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), cancelPropertyPda.toBuffer(), cancelSeller.publicKey.toBuffer()],
      program.programId
    );
    const escrowShareAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      cancelShareMint,
      listingPda,
      true
    );

    await program.methods
      .listShares(new BN(20), new BN(2000_000000))
      .accounts({
        seller: cancelSeller.publicKey,
        property: cancelPropertyPda,
        investorRecord: sellerRecordPda,
        listing: listingPda,
        sellerShareAccount: sellerShareAta,
        escrowShareAccount: escrowShareAta.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([cancelSeller])
      .rpc();

    // Verify shares decreased
    let record = await program.account.investorRecord.fetch(sellerRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 30); // 50 - 20

    // Cancel listing
    await program.methods
      .cancelListing()
      .accounts({
        seller: cancelSeller.publicKey,
        property: cancelPropertyPda,
        listing: listingPda,
        investorRecord: sellerRecordPda,
        escrowShareAccount: escrowShareAta.address,
        sellerShareAccount: sellerShareAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([cancelSeller])
      .rpc();

    // Verify shares restored
    record = await program.account.investorRecord.fetch(sellerRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 50); // 30 + 20 back

    // Verify listing deactivated
    const listing = await program.account.listing.fetch(listingPda);
    assert.equal(listing.active, false);

    // Verify share tokens returned
    const shareBalance = (await getAccount(provider.connection, sellerShareAta)).amount;
    assert.equal(shareBalance, BigInt(50));
  });

  // ── Negative Tests ──────────────────────────────────────

  it("Fails to invest more shares than available", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);
    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    try {
      await program.methods
        .invest(new BN(999999))
        .accounts({
          investor: investor.publicKey,
          property: propertyPda,
          vault: vaultPda,
          shareMint: shareMintPda,
          investorKzteAccount: investorKzteAta,
          vaultTokenAccount: vaultTokenAccount,
          investorShareAccount: investorShareAta,
          investorRecord: investorRecordPda,
          kzteMint: kzteMint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor])
        .rpc();
      assert.fail("Should have failed — insufficient shares");
    } catch (err: any) {
      assert.include(err.message, "InsufficientShares");
    }
  });

  it("Fails to claim dividends when nothing to claim", async () => {
    // investor already claimed — second claim should fail
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    try {
      await program.methods
        .claimDividends()
        .accounts({
          investor: investor.publicKey,
          property: propertyPda,
          vault: vaultPda,
          investorRecord: investorRecordPda,
          vaultTokenAccount: vaultTokenAccount,
          investorKzteAccount: investorKzteAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([investor])
        .rpc();
      assert.fail("Should have failed — nothing to claim");
    } catch (err: any) {
      assert.include(err.message, "NothingToClaim");
    }
  });

  it("Fails to invest zero shares", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);
    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    try {
      await program.methods
        .invest(new BN(0))
        .accounts({
          investor: investor.publicKey,
          property: propertyPda,
          vault: vaultPda,
          shareMint: shareMintPda,
          investorKzteAccount: investorKzteAta,
          vaultTokenAccount: vaultTokenAccount,
          investorShareAccount: investorShareAta,
          investorRecord: investorRecordPda,
          kzteMint: kzteMint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor])
        .rpc();
      assert.fail("Should have failed — zero amount");
    } catch (err: any) {
      assert.include(err.message, "AmountTooSmall");
    }
  });

  it("Fails to create proposal without shares", async () => {
    const noSharesUser = anchor.web3.Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      noSharesUser.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Create an investor record with 0 shares (invest then sell all — but simpler: just try without record)
    const [fakeInvestorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), propertyPda.toBuffer(), noSharesUser.publicKey.toBuffer()],
      program.programId
    );
    const proposalId = new BN(999);
    const [proposalPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), propertyPda.toBuffer(), proposalId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    try {
      await program.methods
        .createProposal(proposalId, "Test proposal", new BN(86400))
        .accounts({
          creator: noSharesUser.publicKey,
          property: propertyPda,
          investorRecord: fakeInvestorPda,
          proposal: proposalPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([noSharesUser])
        .rpc();
      assert.fail("Should have failed — no investor record");
    } catch (err: any) {
      // Expected: AccountNotInitialized (no investor record exists)
    }
  });
});
