import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg");
const RPC_URL = process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com";

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

function deriveCarbonMint(projectId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("carbon_mint"), Buffer.from(projectId)],
    PROGRAM_ID
  );
  return pda;
}

function deriveProjectPda(projectId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("project"), Buffer.from(projectId)],
    PROGRAM_ID
  );
  return pda;
}

const VALID_PROJECTS = ["ses-yasavi", "wind-yereymentau", "forest-burabay", "arcelor-temirtau"];

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
    const carbonMint = deriveCarbonMint(projectId);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      carbonMint,
      recipient
    );

    const sig = await mintTo(
      connection,
      authority,
      carbonMint,
      ata.address,
      authority,
      mintAmount
    );

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
