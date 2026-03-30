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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const buyer = searchParams.get("buyer") ?? "";
  const project = searchParams.get("project") ?? "";
  const amount = searchParams.get("amount") ?? "0";
  const purpose = searchParams.get("purpose") ?? "";
  const date = searchParams.get("date") ?? "0";
  const pda = searchParams.get("pda") ?? "";
  const format = searchParams.get("format") ?? "svg";

  const params = { buyer, project, amount, purpose, date, pda };

  if (format === "json") {
    // Metaplex-compatible metadata JSON
    const baseUrl = request.nextUrl.origin;
    const imageUrl = `${baseUrl}/api/certificate?${searchParams.toString()}&format=svg`;

    return NextResponse.json({
      name: `Carbon Retire — ${amount} tCO₂`,
      symbol: "CRBN",
      description: `${amount} тонн CO₂ погашено навсегда. Проект: ${project}. Цель: ${purpose}. Верифицировано на блокчейне Solana.`,
      image: imageUrl,
      external_url: `https://explorer.solana.com/address/${pda}?cluster=devnet`,
      attributes: [
        { trait_type: "Amount Retired", value: `${amount} tCO₂` },
        { trait_type: "Project", value: project },
        { trait_type: "Purpose", value: purpose },
        { trait_type: "Buyer", value: buyer },
      ],
    });
  }

  // Return SVG image
  const svg = generateSVG(params);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
