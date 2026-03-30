import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const KZTE_MINT = new PublicKey("tFs7nHjQUAbqrVHH6gaMEsjMnfNJRDowxjzeKLfTNqE");
const RPC_URL = "https://api.devnet.solana.com";
const MINT_AMOUNT = 100_000_000_000; // 100,000 KZTE (6 decimals)

// Simple in-memory rate limit (resets on server restart)
const claimed = new Set<string>();

function loadAuthority(): Keypair {
  // Try env var first, then default keypair file
  const envKey = process.env.AUTHORITY_KEYPAIR;
  if (envKey) {
    const parsed = JSON.parse(envKey);
    return Keypair.fromSecretKey(Uint8Array.from(parsed));
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
    const { wallet } = body;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "wallet address required" }, { status: 400 });
    }

    let recipient: PublicKey;
    try {
      recipient = new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: "invalid wallet address" }, { status: 400 });
    }

    if (claimed.has(wallet)) {
      return NextResponse.json({ error: "already claimed" }, { status: 429 });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const authority = loadAuthority();

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      KZTE_MINT,
      recipient
    );

    const sig = await mintTo(
      connection,
      authority,
      KZTE_MINT,
      ata.address,
      authority,
      MINT_AMOUNT
    );

    claimed.add(wallet);

    return NextResponse.json({
      success: true,
      signature: sig,
      amount: "100,000 KZTE",
      explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
