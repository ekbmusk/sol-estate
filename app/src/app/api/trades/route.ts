import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import idl from "@/idl/carbon_kz.json";

const PROGRAM_ID = new PublicKey("3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg");
const RPC_URL =
  process.env.HELIUS_RPC_URL ||
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  "https://api.devnet.solana.com";

const SIGNATURE_LIMIT = 30;
const RESULT_LIMIT = 10;
const CACHE_TTL_MS = 30_000;

interface TradeItem {
  signature: string;
  buyer: string;
  seller: string;
  amount: number;
  totalCost: number;
  projectId: string;
  timestamp: number;
}

let cache: { data: TradeItem[]; expiresAt: number } | null = null;
let inflight: Promise<TradeItem[]> | null = null;

function parseBnOrHex(v: any): number {
  if (!v) return 0;
  if (v.toNumber) {
    try {
      return v.toNumber();
    } catch {
      /* fall through */
    }
  }
  const s = v.toString();
  const n = Number(s);
  if (!isNaN(n)) return n;
  return parseInt(s, 16) || 0;
}

async function loadTrades(): Promise<TradeItem[]> {
  const connection = new Connection(RPC_URL, "confirmed");
  const coder = new BorshCoder(idl as any);
  const eventParser = new EventParser(PROGRAM_ID, coder);

  const signatures = await connection.getSignaturesForAddress(
    PROGRAM_ID,
    { limit: SIGNATURE_LIMIT },
    "confirmed"
  );
  if (signatures.length === 0) return [];

  const txs = await connection.getTransactions(
    signatures.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0, commitment: "confirmed" }
  );

  const results: TradeItem[] = [];
  for (let i = 0; i < txs.length; i++) {
    if (results.length >= RESULT_LIMIT) break;
    const tx = txs[i];
    const sig = signatures[i];
    if (!tx?.meta?.logMessages) continue;

    const isBuyTx = tx.meta.logMessages.some((l) =>
      l.includes("Instruction: BuyShares")
    );
    if (!isBuyTx) continue;

    let buyEvent: any = null;
    try {
      for (const event of eventParser.parseLogs(tx.meta.logMessages)) {
        if (event.name === "SharesBought" || event.name === "sharesBought") {
          buyEvent = event;
          break;
        }
      }
    } catch {
      continue;
    }
    if (!buyEvent) continue;

    const d = buyEvent.data as any;
    const amount = parseBnOrHex(d.amount ?? d.Amount);
    const totalCost = parseBnOrHex(d.total_cost ?? d.totalCost);

    results.push({
      signature: sig.signature,
      buyer: d.buyer?.toString() ?? "",
      seller: d.seller?.toString() ?? "",
      amount: isNaN(amount) ? 0 : amount,
      totalCost: isNaN(totalCost) ? 0 : totalCost,
      projectId: (d.project_id ?? d.projectId ?? "") as string,
      timestamp: sig.blockTime ?? 0,
    });
  }

  return results;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache && cache.expiresAt > now) {
      return NextResponse.json(
        { trades: cache.data, cached: true },
        { headers: { "Cache-Control": "public, max-age=30" } }
      );
    }

    if (!inflight) {
      inflight = loadTrades().finally(() => {
        inflight = null;
      });
    }
    const trades = await inflight;
    cache = { data: trades, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json(
      { trades, cached: false },
      { headers: { "Cache-Control": "public, max-age=30" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (cache) {
      return NextResponse.json({ trades: cache.data, cached: true, stale: true });
    }
    return NextResponse.json({ error: message, trades: [] }, { status: 500 });
  }
}
