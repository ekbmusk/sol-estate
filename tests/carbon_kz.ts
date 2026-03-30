import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CarbonKz } from "../target/types/carbon_kz";
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

describe("carbon_kz", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.carbonKz as Program<CarbonKz>;
  const payer = (provider.wallet as any).payer as anchor.web3.Keypair;

  // Actors
  const authority = provider.wallet;
  const investor = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  const polluter = anchor.web3.Keypair.generate();

  // Project params
  const projectId = "solar-kapchagai-001";
  const projectName = "Солнечная ферма Капшагай";
  const totalShares = new BN(1000);
  const pricePerShare = new BN(5000_000000); // 5000 KZTE
  const totalCredits = new BN(5000); // 5000 tons CO2
  const documentHash = Array(32).fill(1);
  const investAmount = new BN(100); // shares

  let kzteMint: anchor.web3.PublicKey;
  let projectPda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let shareMintPda: anchor.web3.PublicKey;
  let carbonMintPda: anchor.web3.PublicKey;
  let investorRecordPda: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to all actors
    for (const kp of [investor, buyer, polluter]) {
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

    // Mint KZTE to authority (for revenue distribution)
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
    [projectPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(projectId)],
      program.programId
    );
    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(projectId)],
      program.programId
    );
    [shareMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(projectId)],
      program.programId
    );
    [carbonMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(projectId)],
      program.programId
    );
    [investorRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), projectPda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );
  });

  // ── Wave 1 ──────────────────────────────────────────────

  it("Initializes a carbon project", async () => {
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    await program.methods
      .initializeProject(
        projectId,
        projectName,
        { solar: {} },
        totalCredits,
        totalShares,
        pricePerShare,
        documentHash
      )
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        vault: vaultPda,
        shareMint: shareMintPda,
        carbonMint: carbonMintPda,
        kzteMint: kzteMint,
        vaultTokenAccount: vaultTokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    const project = await program.account.carbonProject.fetch(projectPda);
    assert.equal(project.projectId, projectId);
    assert.equal(project.name, projectName);
    assert.equal(project.totalShares.toNumber(), 1000);
    assert.equal(project.sharesSold.toNumber(), 0);
    assert.equal(project.pricePerShare.toNumber(), 5000_000000);
    assert.equal(project.totalCredits.toNumber(), 5000);
    assert.equal(project.creditsRetired.toNumber(), 0);
    assert.equal(project.verified, false);
    assert.deepEqual(project.status, { active: {} });
    assert.deepEqual(project.projectType, { solar: {} });
    assert.deepEqual(Array.from(project.documentHash), documentHash);

    const vault = await program.account.vaultAccount.fetch(vaultPda);
    assert.ok(vault.project.equals(projectPda));
    assert.ok(vault.kzteMint.equals(kzteMint));
  });

  it("Verifies the project", async () => {
    await program.methods
      .verifyProject(documentHash)
      .accounts({
        verifier: authority.publicKey,
        project: projectPda,
      })
      .rpc();

    const project = await program.account.carbonProject.fetch(projectPda);
    assert.equal(project.verified, true);
  });

  it("Fails to verify with wrong doc_hash", async () => {
    const badId = "bad-hash-test";
    const [badProjectPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(badId)],
      program.programId
    );
    const [badVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(badId)],
      program.programId
    );
    const [badShareMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(badId)],
      program.programId
    );
    const [badCarbonMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(badId)],
      program.programId
    );
    const badVaultKzte = await getAssociatedTokenAddress(kzteMint, badVaultPda, true);

    await program.methods
      .initializeProject(badId, "Bad Hash Test", { other: {} }, new BN(100), new BN(100), new BN(1000_000000), Array(32).fill(5))
      .accounts({
        authority: authority.publicKey,
        project: badProjectPda,
        vault: badVaultPda,
        shareMint: badShareMint,
        carbonMint: badCarbonMint,
        kzteMint: kzteMint,
        vaultTokenAccount: badVaultKzte,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    try {
      await program.methods
        .verifyProject(Array(32).fill(99))
        .accounts({
          verifier: authority.publicKey,
          project: badProjectPda,
          authority: authority.publicKey,
        })
        .rpc();
      assert.fail("Should have failed — wrong doc_hash");
    } catch (err: any) {
      assert.include(err.message, "DocumentHashMismatch");
    }
  });

  it("Fails to invest in unverified project", async () => {
    const badId = "bad-hash-test";
    const [badProjectPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(badId)],
      program.programId
    );
    const [badVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(badId)],
      program.programId
    );
    const [badShareMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(badId)],
      program.programId
    );
    const badVaultKzte = await getAssociatedTokenAddress(kzteMint, badVaultPda, true);
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const investorShareAta = await getAssociatedTokenAddress(badShareMint, investor.publicKey);
    const [investorRecordBad] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), badProjectPda.toBuffer(), investor.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .invest(new BN(10))
        .accounts({
          investor: investor.publicKey,
          project: badProjectPda,
          vault: badVaultPda,
          shareMint: badShareMint,
          investorKzteAccount: investorKzteAta,
          vaultTokenAccount: badVaultKzte,
          investorShareAccount: investorShareAta,
          investorRecord: investorRecordBad,
          kzteMint: kzteMint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor])
        .rpc();
      assert.fail("Should have failed — project not verified");
    } catch (err: any) {
      assert.include(err.message, "ProjectNotVerified");
    }
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
        project: projectPda,
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

    const project = await program.account.carbonProject.fetch(projectPda);
    assert.equal(project.sharesSold.toNumber(), 100);

    const record = await program.account.investorRecord.fetch(investorRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 100);
    assert.ok(record.owner.equals(investor.publicKey));

    const kzteAfter = (await getAccount(provider.connection, investorKzteAta)).amount;
    const expectedCost = BigInt(100) * BigInt(5000_000000);
    assert.equal(kzteBefore - kzteAfter, expectedCost);

    const shareBalance = (await getAccount(provider.connection, investorShareAta)).amount;
    assert.equal(shareBalance, BigInt(100));
  });

  it("Authority distributes revenue", async () => {
    const revenueAmount = new BN(50_000_000000); // 50,000 KZTE
    const authorityKzteAta = await getAssociatedTokenAddress(kzteMint, authority.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    await program.methods
      .distributeRevenue(revenueAmount)
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        vault: vaultPda,
        authorityKzteAccount: authorityKzteAta,
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const project = await program.account.carbonProject.fetch(projectPda);
    // With PRECISION=10^12: (50_000_000000 * 10^12) / 100 = 500_000000 * 10^12
    const PRECISION = BigInt("1000000000000");
    const expectedDPS = BigInt(500_000000) * PRECISION;
    assert.equal(project.totalDividendsPerShare.toString(), expectedDPS.toString());
  });

  it("Investor claims dividends", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    const kzteBefore = (await getAccount(provider.connection, investorKzteAta)).amount;

    await program.methods
      .claimDividends()
      .accounts({
        investor: investor.publicKey,
        project: projectPda,
        vault: vaultPda,
        investorRecord: investorRecordPda,
        vaultTokenAccount: vaultTokenAccount,
        investorKzteAccount: investorKzteAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([investor])
      .rpc();

    const kzteAfter = (await getAccount(provider.connection, investorKzteAta)).amount;
    const claimed = kzteAfter - kzteBefore;
    assert.equal(claimed, BigInt(50_000_000000));

    const record = await program.account.investorRecord.fetch(investorRecordPda);
    const PRECISION2 = BigInt("1000000000000");
    assert.equal(record.lastClaimed.toString(), (BigInt(500_000000) * PRECISION2).toString());
  });

  // ── Retire Credits (KILLER FEATURE) ────────────────────

  it("Fails to retire with insufficient credits", async () => {
    // Create a project for retire testing
    const retireProjectId = "retire-test-001";
    const [retireProjectPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(retireProjectId)],
      program.programId
    );
    const [retireVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(retireProjectId)],
      program.programId
    );
    const [retireShareMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(retireProjectId)],
      program.programId
    );
    const [retireCarbonMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(retireProjectId)],
      program.programId
    );
    const retireVaultKzte = await getAssociatedTokenAddress(kzteMint, retireVaultPda, true);

    await program.methods
      .initializeProject(
        retireProjectId,
        "Retire Test",
        { industrial: {} },
        new BN(1000),
        new BN(100),
        new BN(1000_000000),
        Array(32).fill(7)
      )
      .accounts({
        authority: authority.publicKey,
        project: retireProjectPda,
        vault: retireVaultPda,
        shareMint: retireShareMint,
        carbonMint: retireCarbonMint,
        kzteMint: kzteMint,
        vaultTokenAccount: retireVaultKzte,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Create polluter's carbon ATA (will have 0 tokens)
    const polluterCarbonAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      retireCarbonMint,
      polluter.publicKey
    );

    const retireId = Buffer.alloc(16);
    retireId.writeUInt32LE(1, 0);

    const [retireRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("retire"), retireProjectPda.toBuffer(), polluter.publicKey.toBuffer(), retireId],
      program.programId
    );

    try {
      await program.methods
        .retireCredits(Array.from(retireId), new BN(100), "КазМунайГаз ESG offset")
        .accounts({
          buyer: polluter.publicKey,
          project: retireProjectPda,
          carbonMint: retireCarbonMint,
          buyerCarbonAccount: polluterCarbonAta,
          retireRecord: retireRecordPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([polluter])
        .rpc();
      assert.fail("Should have failed — insufficient credits");
    } catch (err: any) {
      assert.include(err.message, "InsufficientCredits");
    }
  });

  // ── Mint Carbon Tokens + Retire (Happy Path) ───────────

  it("Authority mints carbon tokens", async () => {
    const polluterCarbonAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      carbonMintPda,
      polluter.publicKey
    );

    await program.methods
      .mintCarbonTokens(new BN(500))
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        carbonMint: carbonMintPda,
        recipientTokenAccount: polluterCarbonAta.address,
        recipient: polluter.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    const tokenBalance = (await getAccount(provider.connection, polluterCarbonAta.address)).amount;
    assert.equal(tokenBalance, BigInt(500));
  });

  it("Polluter retires carbon credits (happy path)", async () => {
    const polluterCarbonAta = await getAssociatedTokenAddress(carbonMintPda, polluter.publicKey);

    const retireId = Buffer.alloc(16);
    retireId.writeUInt32LE(42, 0);

    const [retireRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("retire"), projectPda.toBuffer(), polluter.publicKey.toBuffer(), retireId],
      program.programId
    );

    const carbonBefore = (await getAccount(provider.connection, polluterCarbonAta)).amount;

    await program.methods
      .retireCredits(Array.from(retireId), new BN(200), "КазМунайГаз ESG offset Q1 2026")
      .accounts({
        buyer: polluter.publicKey,
        project: projectPda,
        carbonMint: carbonMintPda,
        buyerCarbonAccount: polluterCarbonAta,
        retireRecord: retireRecordPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([polluter])
      .rpc();

    // Verify tokens burned
    const carbonAfter = (await getAccount(provider.connection, polluterCarbonAta)).amount;
    assert.equal(carbonBefore - carbonAfter, BigInt(200));

    // Verify RetireRecord
    const record = await program.account.retireRecord.fetch(retireRecordPda);
    assert.ok(record.buyer.equals(polluter.publicKey));
    assert.ok(record.project.equals(projectPda));
    assert.equal(record.amountRetired.toNumber(), 200);
    assert.equal(record.purpose, "КазМунайГаз ESG offset Q1 2026");
    assert.ok(record.timestamp.toNumber() > 0);

    // Verify project credits_retired updated
    const project = await program.account.carbonProject.fetch(projectPda);
    assert.equal(project.creditsRetired.toNumber(), 200);
  });

  // ── Wave 2 ──────────────────────────────────────────────

  it("Investor lists shares for sale", async () => {
    const listAmount = new BN(20);
    const listPrice = new BN(6000_000000);

    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    const listingCount = new BN(0);
    const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), projectPda.toBuffer(), investor.publicKey.toBuffer(), listingCount.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const escrowShareAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      shareMintPda,
      listingPda,
      true
    );

    await program.methods
      .listShares(listAmount, listPrice)
      .accounts({
        seller: investor.publicKey,
        project: projectPda,
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

    const record = await program.account.investorRecord.fetch(investorRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 80);
  });

  it("Buyer purchases listed shares", async () => {
    const listingCount = new BN(0);
    const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), projectPda.toBuffer(), investor.publicKey.toBuffer(), listingCount.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const escrowShareAta = await getAssociatedTokenAddress(shareMintPda, listingPda, true);
    const buyerKzteAta = await getAssociatedTokenAddress(kzteMint, buyer.publicKey);
    const sellerKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const buyerShareAta = await getAssociatedTokenAddress(shareMintPda, buyer.publicKey);

    const [buyerRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), projectPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );

    const sellerKzteBefore = (await getAccount(provider.connection, sellerKzteAta)).amount;

    await program.methods
      .buyShares()
      .accounts({
        buyer: buyer.publicKey,
        seller: investor.publicKey,
        project: projectPda,
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

    // Listing account is closed after buy (rent reclaimed)
    try {
      await program.account.listing.fetch(listingPda);
      assert.fail("Listing should be closed");
    } catch (err: any) {
      // Expected: account not found
    }

    const buyerShareBalance = (await getAccount(provider.connection, buyerShareAta)).amount;
    assert.equal(buyerShareBalance, BigInt(20));

    const sellerKzteAfter = (await getAccount(provider.connection, sellerKzteAta)).amount;
    assert.equal(sellerKzteAfter - sellerKzteBefore, BigInt(20) * BigInt(6000_000000));

    const buyerRecord = await program.account.investorRecord.fetch(buyerRecordPda);
    assert.equal(buyerRecord.sharesOwned.toNumber(), 20);
  });

  // ── Cancel Listing ──────────────────────────────────────

  it("Seller cancels a listing and recovers shares", async () => {
    const cancelProjectId = "cancel-test-001";
    const cancelHash = Array(32).fill(99);
    const cancelSeller = anchor.web3.Keypair.generate();

    const sig1 = await provider.connection.requestAirdrop(
      cancelSeller.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig1);

    const sellerKzte = await createAssociatedTokenAccount(
      provider.connection, payer, kzteMint, cancelSeller.publicKey
    );
    await mintTo(provider.connection, payer, kzteMint, sellerKzte, authority.publicKey, 500_000_000_000);

    const [cancelProjectPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(cancelProjectId)], program.programId
    );
    const [cancelVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), Buffer.from(cancelProjectId)], program.programId
    );
    const [cancelShareMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share_mint"), Buffer.from(cancelProjectId)], program.programId
    );
    const [cancelCarbonMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(cancelProjectId)], program.programId
    );
    const cancelVaultKzte = await getAssociatedTokenAddress(kzteMint, cancelVaultPda, true);

    // Init project
    await program.methods
      .initializeProject(cancelProjectId, "Cancel Test", { forest: {} }, new BN(3000), new BN(100), new BN(1000_000000), cancelHash)
      .accounts({
        authority: authority.publicKey, project: cancelProjectPda, vault: cancelVaultPda,
        shareMint: cancelShareMint, carbonMint: cancelCarbonMint, kzteMint: kzteMint,
        vaultTokenAccount: cancelVaultKzte, systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Verify
    await program.methods
      .verifyProject(cancelHash)
      .accounts({ verifier: authority.publicKey, project: cancelProjectPda, authority: authority.publicKey })
      .rpc();

    // Invest
    const sellerShareAta = await getAssociatedTokenAddress(cancelShareMint, cancelSeller.publicKey);
    const [sellerRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("investor"), cancelProjectPda.toBuffer(), cancelSeller.publicKey.toBuffer()], program.programId
    );

    await program.methods
      .invest(new BN(50))
      .accounts({
        investor: cancelSeller.publicKey, project: cancelProjectPda, vault: cancelVaultPda,
        shareMint: cancelShareMint, investorKzteAccount: sellerKzte,
        vaultTokenAccount: cancelVaultKzte, investorShareAccount: sellerShareAta,
        investorRecord: sellerRecordPda, kzteMint: kzteMint,
        systemProgram: anchor.web3.SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([cancelSeller])
      .rpc();

    // List 20 shares
    const cancelListingCount = new BN(0);
    const [listingPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), cancelProjectPda.toBuffer(), cancelSeller.publicKey.toBuffer(), cancelListingCount.toArrayLike(Buffer, "le", 8)], program.programId
    );
    const escrowShareAta = await getOrCreateAssociatedTokenAccount(
      provider.connection, payer, cancelShareMint, listingPda, true
    );

    await program.methods
      .listShares(new BN(20), new BN(2000_000000))
      .accounts({
        seller: cancelSeller.publicKey, project: cancelProjectPda,
        investorRecord: sellerRecordPda, listing: listingPda,
        sellerShareAccount: sellerShareAta, escrowShareAccount: escrowShareAta.address,
        systemProgram: anchor.web3.SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([cancelSeller])
      .rpc();

    let record = await program.account.investorRecord.fetch(sellerRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 30);

    // Cancel
    await program.methods
      .cancelListing()
      .accounts({
        seller: cancelSeller.publicKey, project: cancelProjectPda, listing: listingPda,
        investorRecord: sellerRecordPda, escrowShareAccount: escrowShareAta.address,
        sellerShareAccount: sellerShareAta, tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([cancelSeller])
      .rpc();

    record = await program.account.investorRecord.fetch(sellerRecordPda);
    assert.equal(record.sharesOwned.toNumber(), 50);

    // Listing account is closed after cancel (rent reclaimed)
    try {
      await program.account.listing.fetch(listingPda);
      assert.fail("Listing should be closed");
    } catch (err: any) {
      // Expected: account not found
    }
  });

  // ── Negative Tests ──────────────────────────────────────

  it("Fails to invest more shares than available", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);
    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    try {
      await program.methods.invest(new BN(999999))
        .accounts({
          investor: investor.publicKey, project: projectPda, vault: vaultPda,
          shareMint: shareMintPda, investorKzteAccount: investorKzteAta,
          vaultTokenAccount, investorShareAccount: investorShareAta,
          investorRecord: investorRecordPda, kzteMint,
          systemProgram: anchor.web3.SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor]).rpc();
      assert.fail("Should have failed");
    } catch (err: any) {
      assert.include(err.message, "InsufficientShares");
    }
  });

  it("Fails to claim dividends when nothing to claim", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);

    try {
      await program.methods.claimDividends()
        .accounts({
          investor: investor.publicKey, project: projectPda, vault: vaultPda,
          investorRecord: investorRecordPda, vaultTokenAccount,
          investorKzteAccount: investorKzteAta, tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([investor]).rpc();
      assert.fail("Should have failed");
    } catch (err: any) {
      assert.include(err.message, "NothingToClaim");
    }
  });

  it("Fails to invest zero shares", async () => {
    const investorKzteAta = await getAssociatedTokenAddress(kzteMint, investor.publicKey);
    const vaultTokenAccount = await getAssociatedTokenAddress(kzteMint, vaultPda, true);
    const investorShareAta = await getAssociatedTokenAddress(shareMintPda, investor.publicKey);

    try {
      await program.methods.invest(new BN(0))
        .accounts({
          investor: investor.publicKey, project: projectPda, vault: vaultPda,
          shareMint: shareMintPda, investorKzteAccount: investorKzteAta,
          vaultTokenAccount, investorShareAccount: investorShareAta,
          investorRecord: investorRecordPda, kzteMint,
          systemProgram: anchor.web3.SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([investor]).rpc();
      assert.fail("Should have failed");
    } catch (err: any) {
      assert.include(err.message, "AmountTooSmall");
    }
  });
});
