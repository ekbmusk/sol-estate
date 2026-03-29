import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/providers/WalletProvider";
import AnchorProvider from "@/components/providers/AnchorProvider";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolEstate — Токенизация недвижимости",
  description:
    "Инвестируйте в недвижимость Казахстана через токенизированные доли на блокчейне Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <AnchorProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </AnchorProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
