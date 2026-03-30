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
  const shortBuyer = buyer ? `${buyer.slice(0, 8)}...${buyer.slice(-6)}` : "";
  const formattedDate = date && date !== "0"
    ? new Date(parseInt(date) * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  // A4 landscape: 1190 x 842 (297mm x 210mm at 96dpi)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1190" height="842" viewBox="0 0 1190 842">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#060A08"/>
      <stop offset="50%" stop-color="#0A1210"/>
      <stop offset="100%" stop-color="#06100C"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <linearGradient id="burn" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.4" r="0.5">
      <stop offset="0%" stop-color="#34D399" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1190" height="842" fill="url(#bg)" rx="0"/>
  <rect width="1190" height="842" fill="url(#glow)"/>

  <!-- Border -->
  <rect x="28" y="28" width="1134" height="786" fill="none" stroke="#1E2B26" stroke-width="0.5" rx="12"/>
  <rect x="32" y="32" width="1126" height="778" fill="none" stroke="#243028" stroke-width="0.5" rx="10" stroke-dasharray="6 4"/>

  <!-- Top accent bar -->
  <rect x="28" y="28" width="1134" height="3" fill="url(#accent)" rx="1.5"/>

  <!-- Header row -->
  <text x="64" y="78" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="700" fill="#F0F5F3">
    Carbon<tspan fill="#34D399">KZ</tspan>
  </text>
  <text x="1126" y="72" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" text-anchor="end" letter-spacing="0.18em">
    CARBON RETIREMENT CERTIFICATE
  </text>
  <text x="1126" y="88" font-family="monospace" font-size="10" fill="#3D5048" text-anchor="end">
    NO. ${pda ? pda.slice(0, 12) : "000000000000"}
  </text>

  <line x1="64" y1="104" x2="1126" y2="104" stroke="#1E2B26" stroke-width="0.5"/>

  <!-- Left column: Certificate content -->

  <!-- Title -->
  <text x="64" y="160" font-family="system-ui, sans-serif" font-size="13" fill="#5A6D65" letter-spacing="0.2em">
    CERTIFICATE OF CARBON CREDIT RETIREMENT
  </text>

  <text x="64" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#B0BDB7" font-weight="400">
    This certifies that the holder has permanently retired
  </text>

  <!-- Big number -->
  <text x="64" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="120" font-weight="800" fill="url(#burn)">
    ${amount}
  </text>
  <text x="${64 + (amount.length * 72)}" y="310" font-family="system-ui, sans-serif" font-size="32" fill="#8A9B94" dy="0">
    tonnes CO&#x2082;
  </text>

  <text x="64" y="350" font-family="system-ui, sans-serif" font-size="18" fill="#8A9B94">
    from the global carbon supply, permanently and irrevocably.
  </text>

  <!-- Details grid -->
  <line x1="64" y1="390" x2="750" y2="390" stroke="#1E2B26" stroke-width="0.5"/>

  <text x="64" y="430" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.1em">PROJECT</text>
  <text x="64" y="455" font-family="system-ui, sans-serif" font-size="20" fill="#F0F5F3" font-weight="600">${escapeXml(project)}</text>

  <text x="450" y="430" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.1em">DATE</text>
  <text x="450" y="455" font-family="system-ui, sans-serif" font-size="20" fill="#F0F5F3">${formattedDate}</text>

  <text x="64" y="505" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.1em">PURPOSE</text>
  <text x="64" y="530" font-family="system-ui, sans-serif" font-size="18" fill="#B0BDB7">${escapeXml(purpose)}</text>

  <text x="64" y="580" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" letter-spacing="0.1em">RETIRED BY</text>
  <text x="64" y="605" font-family="monospace" font-size="16" fill="#8A9B94">${shortBuyer}</text>

  <!-- Right column: Verification -->
  <rect x="800" y="130" width="296" height="480" fill="#0C1612" rx="12"/>
  <rect x="800" y="130" width="296" height="480" fill="none" stroke="#1E2B26" rx="12"/>

  <text x="948" y="180" font-family="system-ui, sans-serif" font-size="11" fill="#5A6D65" text-anchor="middle" letter-spacing="0.15em">
    VERIFICATION
  </text>

  <!-- Checkmark circle -->
  <circle cx="948" cy="260" r="40" fill="#34D399" opacity="0.08"/>
  <circle cx="948" cy="260" r="40" fill="none" stroke="#34D399" stroke-opacity="0.3" stroke-width="1.5"/>
  <path d="M930 260 L944 274 L968 246" fill="none" stroke="#34D399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

  <text x="948" y="330" font-family="system-ui, sans-serif" font-size="14" fill="#34D399" text-anchor="middle" font-weight="600">
    Verified on Solana
  </text>
  <text x="948" y="350" font-family="system-ui, sans-serif" font-size="12" fill="#5A6D65" text-anchor="middle">
    Blockchain
  </text>

  <line x1="832" y1="380" x2="1064" y2="380" stroke="#1E2B26" stroke-width="0.5"/>

  <text x="832" y="410" font-family="system-ui, sans-serif" font-size="10" fill="#5A6D65" letter-spacing="0.1em">NETWORK</text>
  <text x="832" y="430" font-family="system-ui, sans-serif" font-size="14" fill="#B0BDB7">Solana Devnet</text>

  <text x="832" y="465" font-family="system-ui, sans-serif" font-size="10" fill="#5A6D65" letter-spacing="0.1em">PROOF TYPE</text>
  <text x="832" y="485" font-family="system-ui, sans-serif" font-size="14" fill="#B0BDB7">SPL Token Burn + PDA Record</text>

  <text x="832" y="520" font-family="system-ui, sans-serif" font-size="10" fill="#5A6D65" letter-spacing="0.1em">RECORD</text>
  <text x="832" y="540" font-family="monospace" font-size="11" fill="#8A9B94">${pda ? pda.slice(0, 22) : ""}</text>
  <text x="832" y="556" font-family="monospace" font-size="11" fill="#8A9B94">${pda ? pda.slice(22) : ""}</text>

  <text x="948" y="595" font-family="system-ui, sans-serif" font-size="11" fill="#34D399" text-anchor="middle">
    Immutable · Permanent · Auditable
  </text>

  <!-- Bottom bar -->
  <rect x="0" y="742" width="1190" height="100" fill="#080E0B"/>
  <line x1="0" y1="742" x2="1190" y2="742" stroke="#1E2B26" stroke-width="0.5"/>

  <text x="595" y="782" font-family="system-ui, sans-serif" font-size="14" fill="#5A6D65" text-anchor="middle" letter-spacing="0.04em">
    Tokens burned are permanently removed from circulation. Double counting is impossible.
  </text>

  <text x="595" y="816" font-family="system-ui, sans-serif" font-size="13" fill="#8A9B94" text-anchor="middle" letter-spacing="0.3em" font-weight="500">
    SOLANA &#xA0;&#xA0; SUPERTEAM KZ &#xA0;&#xA0; ZERDE &#xA0;&#xA0; DECENTRATHON 5.0
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
