import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { idl } from "@/lib/idl-utils";

const RPC = process.env.HELIUS_RPC_URL ?? "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("3nLd8C3s2SAMVWXHy1vb7719zVPKPJWKrgxDDJ9pRRkg");

const ACTIONS_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,Accept-Encoding",
  "X-Action-Version": "2.0",
  "X-Blockchain-Ids": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
};

// Known devnet projects (static metadata — avoids Turbopack + Anchor deserialization issues)
const DEVNET_PROJECTS = [
  { id: "ses-yasavi", name: "СЭС Университета Ахмеда Ясави", available: 36 },
  { id: "wind-yereymentau", name: "Ветропарк Ерейментау", available: 12000 },
  { id: "forest-burabay", name: "Лесовосстановление Бурабай", available: 3000 },
  { id: "arcelor-temirtau", name: "ArcelorMittal Теміртау", available: 8000 },
];


function getProgram() {
  const connection = new Connection(RPC, "confirmed");
  const kp = Keypair.generate();
  const wallet = {
    publicKey: kp.publicKey,
    signTransaction: async (t: any) => t,
    signAllTransactions: async (t: any) => t,
    payer: kp,
  } as any;
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(idl, provider);
}

/** GET — return Action metadata + UI for Blink-compatible wallets */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const baseUrl = request.nextUrl.origin;

  if (projectId) {
    const proj = DEVNET_PROJECTS.find((p) => p.id === projectId);
    if (!proj) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        icon: `${baseUrl}/api/certificate?project=${encodeURIComponent(proj.name)}&amount=0&buyer=&purpose=&date=0&pda=`,
        title: `ZhasylKZ — Retire: ${proj.name}`,
        description: `Permanently retire carbon credits from "${proj.name}". Available: ${proj.available.toLocaleString()} tCO₂. Tokens are burned on Solana — double counting impossible.`,
        label: "Retire Credits",
        links: {
          actions: [
            {
              type: "transaction",
              label: "Retire Carbon Credits",
              href: `${baseUrl}/api/actions/retire?projectId=${proj.id}&amount={amount}&purpose={purpose}`,
              parameters: [
                {
                  name: "amount",
                  label: `Amount (1-${proj.available} tCO₂)`,
                  type: "number",
                  required: true,
                  min: 1,
                  max: proj.available,
                },
                {
                  name: "purpose",
                  label: "Purpose (e.g. ESG offset Q1 2026)",
                  type: "text",
                  required: true,
                  maxLength: 128,
                },
              ],
            },
          ],
        },
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  }

  // No projectId — list all projects
  const actions = DEVNET_PROJECTS.map((proj) => ({
    type: "transaction" as const,
    label: `${proj.name} (${proj.available.toLocaleString()} tCO₂)`,
    href: `${baseUrl}/api/actions/retire?projectId=${proj.id}&amount={amount}&purpose={purpose}`,
    parameters: [
      {
        name: "amount",
        label: `Amount (1-${proj.available} tCO₂)`,
        type: "number",
        required: true,
        min: 1,
        max: proj.available,
      },
      {
        name: "purpose",
        label: "Purpose (e.g. ESG offset Q1 2026)",
        type: "text",
        required: true,
        maxLength: 128,
      },
    ],
  }));

  return NextResponse.json(
    {
      icon: `${baseUrl}/api/certificate?project=ZhasylKZ&amount=0&buyer=&purpose=&date=0&pda=`,
      title: "ZhasylKZ — Retire Carbon Credits",
      description:
        "Permanently retire carbon credits from verified green projects in Kazakhstan. Tokens are burned on Solana blockchain — double counting impossible.",
      label: "Retire Credits",
      links: { actions },
    },
    { headers: ACTIONS_CORS_HEADERS }
  );
}

/** POST — build and return unsigned transaction for wallet to sign */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const amountStr = searchParams.get("amount");
    const purpose = searchParams.get("purpose") || "Carbon offset via Blink";

    if (!projectId || !amountStr) {
      return NextResponse.json(
        { error: "projectId and amount are required" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const body = await request.json();
    const account = body.account;
    if (!account) {
      return NextResponse.json(
        { error: "account is required in request body" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    let buyer: PublicKey;
    try {
      buyer = new PublicKey(account);
    } catch {
      return NextResponse.json(
        { error: "Invalid account address" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }
    const program = getProgram();
    const connection = new Connection(RPC, "confirmed");

    // Derive PDAs (same pattern as RetirePanel.tsx)
    const [projectPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(projectId)],
      PROGRAM_ID
    );

    const [carbonMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("carbon_mint"), Buffer.from(projectId)],
      PROGRAM_ID
    );

    const buyerCarbonAta = await getAssociatedTokenAddress(carbonMintPda, buyer);

    // Generate unique retire_id
    const retireId = new Uint8Array(16);
    crypto.getRandomValues(retireId);

    const [retireRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("retire"),
        projectPda.toBuffer(),
        buyer.toBuffer(),
        Buffer.from(retireId),
      ],
      PROGRAM_ID
    );

    // Build the transaction (unsigned — wallet signs it)
    const tx: Transaction = await program.methods
      .retireCredits(Array.from(retireId), new BN(amount), purpose.trim())
      .accounts({
        buyer,
        project: projectPda,
        carbonMint: carbonMintPda,
        buyerCarbonAccount: buyerCarbonAta,
        retireRecord: retireRecordPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: PublicKey.default,
      })
      .transaction();

    tx.feePayer = buyer;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;

    const serialized = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return NextResponse.json(
      {
        type: "transaction",
        transaction: serialized,
        message: `Retiring ${amount} tCO₂ from project "${projectId}". Tokens will be permanently burned.`,
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transaction build failed" },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

/** OPTIONS — CORS preflight for Blink-compatible wallets */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ACTIONS_CORS_HEADERS });
}
