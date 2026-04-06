import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";

import idl from "@/idl/carbon_kz.json";

const PROGRAM_ID = new PublicKey("3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg");
const RPC_URL = process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com";
const VALID_PROJECTS = ["ses-yasavi", "wind-yereymentau", "forest-burabay", "arcelor-temirtau"];

function loadAuthority(): Keypair {
  const envKey = process.env.AUTHORITY_KEYPAIR;
  if (envKey) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(envKey)));
  }
  const keypairPath =
    process.env.ANCHOR_WALLET ||
    path.join(process.env.HOME || "~", ".config", "solana", "id.json");
  const raw = fs.readFileSync(keypairPath, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, projectId, amount } = body;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "wallet address required" }, { status: 400 });
    }
    if (!projectId || !VALID_PROJECTS.includes(projectId)) {
      return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
    }

    const mintAmount = Math.min(Math.max(Number(amount) || 10, 1), 1000);

    let recipient: PublicKey;
    try {
      recipient = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: "invalid wallet address" }, { status: 400 });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const authority = loadAuthority();

    // Derive PDAs
    const [projectPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(projectId)],
      PROGRAM_ID
    );
    const [carbonMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(projectId)],
      PROGRAM_ID
    );
    const recipientAta = await getAssociatedTokenAddress(carbonMint, recipient);

    // Build instruction via Anchor
    const wallet_ = {
      publicKey: authority.publicKey,
      signTransaction: async (tx: any) => { tx.sign(authority); return tx; },
      signAllTransactions: async (txs: any[]) => { txs.forEach(tx => tx.sign(authority)); return txs; },
    } as any;
    const provider = new AnchorProvider(connection, wallet_, { commitment: "confirmed" });
    const program = new Program(idl as any, provider);

    const tx = await program.methods
      .mintCarbonTokens(new BN(mintAmount))
      .accounts({
        authority: authority.publicKey,
        project: projectPda,
        carbonMint: carbonMint,
        recipientTokenAccount: recipientAta,
        recipient: recipient,
        systemProgram: PublicKey.default,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      } as any)
      .transaction();

    tx.feePayer = authority.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

    const sig = await sendAndConfirmTransaction(connection, tx, [authority], {
      commitment: "confirmed",
    });

    return NextResponse.json({
      success: true,
      signature: sig,
      amount: mintAmount,
      projectId,
      explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
