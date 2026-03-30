import { NextRequest, NextResponse } from "next/server";

/**
 * Generate carbon retirement certificate.
 * GET /api/certificate?buyer=...&project=...&amount=...&purpose=...&date=...&pda=...
 *
 * Returns: SVG image or JSON metadata (based on Accept header or ?format=)
 */

function generateSVG(params: {
  buyer: string;
  project: string;
  amount: string;
  purpose: string;
  date: string;
  pda: string;
}): string {
  const { buyer, project, amount, purpose, date, pda } = params;
  const shortBuyer = `${buyer.slice(0, 6)}...${buyer.slice(-4)}`;
  const formattedDate = new Date(parseInt(date) * 1000).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060A08"/>
      <stop offset="100%" stop-color="#0C1612"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <linearGradient id="burn" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="1000" fill="url(#bg)" rx="24"/>
  <rect x="1" y="1" width="798" height="998" fill="none" stroke="#1E2B26" stroke-width="1" rx="24"/>

  <!-- Inner border -->
  <rect x="32" y="32" width="736" height="936" fill="none" stroke="#1E2B26" stroke-width="0.5" rx="16" stroke-dasharray="4 4"/>

  <!-- Top accent line -->
  <rect x="32" y="32" width="736" height="4" fill="url(#accent)" rx="2"/>

  <!-- Logo area -->
  <text x="64" y="88" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#F0F5F3">
    Carbon<tspan fill="#34D399">KZ</tspan>
  </text>
  <text x="736" y="88" font-family="system-ui, sans-serif" font-size="12" fill="#5A6D65" text-anchor="end" letter-spacing="0.1em">
    CARBON RETIREMENT CERTIFICATE
  </text>

  <!-- Divider -->
  <line x1="64" y1="110" x2="736" y2="110" stroke="#1E2B26" stroke-width="0.5"/>

  <!-- Main heading -->
  <text x="400" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#5A6D65" text-anchor="middle" letter-spacing="0.15em">
    ПОДТВЕРЖДЕНИЕ ГАШЕНИЯ
  </text>
  <text x="400" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#5A6D65" text-anchor="middle" letter-spacing="0.08em">
    УГЛЕРОДНЫХ КРЕДИТОВ
  </text>

  <!-- Amount - big number -->
  <text x="400" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="800" fill="url(#burn)" text-anchor="middle">
    ${amount}
  </text>
  <text x="400" y="400" font-family="system-ui, sans-serif" font-size="20" fill="#8A9B94" text-anchor="middle">
    тонн CO₂ погашено навсегда
  </text>

  <!-- Fire icon (simple) -->
  <circle cx="400" cy="450" r="20" fill="#F97316" opacity="0.1"/>
  <text x="400" y="458" font-size="24" text-anchor="middle">🔥</text>

  <!-- Details -->
  <rect x="64" y="500" width="672" height="1" fill="#1E2B26"/>

  <text x="64" y="545" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.08em">ПРОЕКТ</text>
  <text x="64" y="570" font-family="system-ui, sans-serif" font-size="18" fill="#F0F5F3" font-weight="600">${escapeXml(project)}</text>

  <text x="64" y="615" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.08em">ЦЕЛЬ ГАШЕНИЯ</text>
  <text x="64" y="640" font-family="system-ui, sans-serif" font-size="16" fill="#B0BDB7">${escapeXml(purpose)}</text>

  <text x="64" y="685" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.08em">ДАТА</text>
  <text x="64" y="710" font-family="system-ui, sans-serif" font-size="16" fill="#B0BDB7">${formattedDate}</text>

  <text x="64" y="755" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.08em">КОШЕЛЁК</text>
  <text x="64" y="780" font-family="monospace" font-size="14" fill="#8A9B94">${shortBuyer}</text>

  <!-- Divider -->
  <rect x="64" y="810" width="672" height="1" fill="#1E2B26"/>

  <!-- Verification badge -->
  <rect x="64" y="840" width="672" height="64" fill="#34D399" fill-opacity="0.06" rx="12"/>
  <rect x="64" y="840" width="672" height="64" fill="none" stroke="#34D399" stroke-opacity="0.2" rx="12"/>
  <circle cx="96" cy="872" r="10" fill="#34D399" opacity="0.2"/>
  <text x="96" y="877" font-size="14" text-anchor="middle">✓</text>
  <text x="120" y="868" font-family="system-ui, sans-serif" font-size="13" fill="#34D399" font-weight="600">
    Верифицировано на блокчейне Solana
  </text>
  <text x="120" y="888" font-family="monospace" font-size="11" fill="#5A6D65">
    ${pda.slice(0, 20)}...
  </text>

  <!-- Footer -->
  <text x="400" y="955" font-family="system-ui, sans-serif" font-size="11" fill="#3D5048" text-anchor="middle">
    Solana Devnet · CarbonKZ · Decentrathon 5.0
  </text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import idl from "@/idl/carbon_kz.json";

const RPC = "https://devnet.helius-rpc.com/?api-key=REDACTED_HELIUS_KEY";
const PROGRAM_ID = new PublicKey("3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg");

async function fetchRetireData(pdaStr: string) {
  try {
    const connection = new Connection(RPC, "confirmed");
    const pda = new PublicKey(pdaStr);
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo) return null;

    // Decode using anchor
    const { Keypair } = await import("@solana/web3.js");
    const dummyWallet = { publicKey: Keypair.generate().publicKey, signTransaction: async (t: any) => t, signAllTransactions: async (t: any) => t, payer: Keypair.generate() } as any;
    const provider = new AnchorProvider(connection, dummyWallet, {});
    const program = new Program(idl as any, provider);
    const record = await (program.account as any).retireRecord.fetch(pda);

    // Fetch project name
    let projectName = record.project.toString().slice(0, 8) + "...";
    try {
      const proj = await (program.account as any).carbonProject.fetch(record.project);
      projectName = proj.name;
    } catch {}

    return {
      buyer: record.buyer.toString(),
      project: projectName,
      amount: record.amountRetired.toString(),
      purpose: record.purpose,
      date: record.timestamp.toString(),
      pda: pdaStr,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pda = searchParams.get("pda") ?? "";
  const format = searchParams.get("format") ?? "svg";

  // Params can come from query string OR from on-chain fetch via PDA
  let params = {
    buyer: searchParams.get("buyer") ?? "",
    project: searchParams.get("project") ?? "",
    amount: searchParams.get("amount") ?? "0",
    purpose: searchParams.get("purpose") ?? "",
    date: searchParams.get("date") ?? "0",
    pda,
  };

  // If only PDA provided, fetch from chain
  if (pda && !params.buyer) {
    const onChain = await fetchRetireData(pda);
    if (onChain) params = onChain;
  }

  if (format === "json") {
    const baseUrl = request.nextUrl.origin;
    const imageUrl = `${baseUrl}/api/certificate?pda=${pda}`;

    return NextResponse.json({
      name: `Carbon Retire — ${params.amount} tCO2`,
      symbol: "CRBN",
      description: `${params.amount} тонн CO2 погашено навсегда. Проект: ${params.project}. Цель: ${params.purpose}.`,
      image: imageUrl,
      external_url: `https://explorer.solana.com/address/${pda}?cluster=devnet`,
      attributes: [
        { trait_type: "Amount Retired", value: `${params.amount} tCO2` },
        { trait_type: "Project", value: params.project },
        { trait_type: "Purpose", value: params.purpose },
        { trait_type: "Buyer", value: params.buyer },
      ],
    });
  }

  const svg = generateSVG(params);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
