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

// Time-based rate limit (24h cooldown per wallet and IP)
const claimedAt = new Map<string, number>();
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

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

    const lastClaim = claimedAt.get(wallet);
    if (lastClaim && Date.now() - lastClaim < COOLDOWN_MS) {
      const remainingHrs = Math.ceil((COOLDOWN_MS - (Date.now() - lastClaim)) / (60 * 60 * 1000));
      return NextResponse.json(
        { error: `Already claimed. Try again in ${remainingHrs}h.` },
        { status: 429 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipLastClaim = claimedAt.get(`ip:${ip}`);
    if (ipLastClaim && Date.now() - ipLastClaim < COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Rate limit exceeded for this IP" },
        { status: 429 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const authority = loadAuthority();

    // Auto-airdrop SOL if user has less than 0.5 SOL (needed for gas)
    try {
      const balance = await connection.getBalance(recipient);
      if (balance < 500_000_000) { // < 0.5 SOL
        await connection.requestAirdrop(recipient, 2_000_000_000); // 2 SOL
      }
    } catch {
      // Airdrop can fail on devnet rate limits — non-critical
    }

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

    claimedAt.set(wallet, Date.now());
    claimedAt.set(`ip:${ip}`, Date.now());

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
