"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCarbonProgram } from "@/hooks/useCarbonProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PROGRAM_ID } from "@/lib/constants";
import { toast } from "sonner";
import type { RetireRecordItem } from "@/hooks/useRetireRecords";

interface RetireCertificateProps {
  record: RetireRecordItem;
  projectName: string;
}

export default function RetireCertificate({ record, projectName }: RetireCertificateProps) {
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);

  const program = useCarbonProgram();
  const { publicKey, connected } = useWallet();

  const certParams = new URLSearchParams({
    buyer: record.buyer,
    project: projectName,
    amount: record.amountRetired.toString(),
    purpose: record.purpose,
    date: record.timestamp.toString(),
    pda: record.pda,
  });

  const svgUrl = `/api/certificate?${certParams.toString()}`;
  const metadataUrl = `/api/certificate?${certParams.toString()}&format=json`;

  const handleMintNFT = async () => {
    if (!connected || !publicKey || !program) {
      toast.error("Подключите кошелек");
      return;
    }

    setMinting(true);
    try {
      const certificateMint = Keypair.generate();

      // Build full metadata URI (absolute URL needed for Metaplex)
      const absoluteMetadataUri = `${window.location.origin}${metadataUrl}`;

      const retireRecordPda = new PublicKey(record.pda);
      const projectPda = new PublicKey(record.project);

      const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          certificateMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const sig = await program.methods
        .mintRetireCertificate(absoluteMetadataUri)
        .accounts({
          buyer: publicKey,
          project: projectPda,
          retireRecord: retireRecordPda,
          certificateMint: certificateMint.publicKey,
          metadata: metadataPda,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: PublicKey.default,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
        } as any)
        .signers([certificateMint])
        .rpc();

      toast.success("NFT сертификат создан!", {
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
        },
      });
      setMinted(true);
    } catch (err) {
      toast.error("Ошибка минта NFT", {
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
      });
    } finally {
      setMinting(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = svgUrl;
    link.download = `carbon-retire-${record.amountRetired}tCO2.svg`;
    link.click();
  };

  return (
    <div className="rounded-2xl border border-[#243028] bg-[#0E1513] p-6 space-y-4">
      {/* Certificate preview */}
      <div className="rounded-xl overflow-hidden border border-[#1E2B26]">
        <img
          src={svgUrl}
          alt={`Сертификат гашения ${record.amountRetired} тонн CO₂`}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!minted && connected && record.buyer === publicKey?.toString() && (
          <Button
            onClick={handleMintNFT}
            className="flex-1 bg-[#34D399] hover:bg-[#10B981] text-[#060A08] cursor-pointer"
            disabled={minting}
          >
            {minting ? "Минт..." : "Получить NFT сертификат"}
          </Button>
        )}
        {minted && (
          <div className="flex-1 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 px-4 py-2.5 text-center">
            <span className="text-[13px] font-medium text-[#34D399]">NFT в вашем кошельке</span>
          </div>
        )}
        <Button
          onClick={handleDownload}
          variant="outline"
          className="border-[#243028] text-[#8A9B94] hover:text-[#F0F5F3] cursor-pointer"
        >
          Скачать SVG
        </Button>
      </div>
    </div>
  );
}
