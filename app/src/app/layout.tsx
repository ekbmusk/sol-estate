import "./polyfills";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/providers/WalletProvider";
import AnchorProvider from "@/components/providers/AnchorProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
});

// Instrument Sans loaded via CSS @import since next/font doesn't support it natively
// Fallback: system font stack with similar metrics

export const metadata: Metadata = {
  title: "CarbonKZ — Углеродный рынок Казахстана",
  description:
    "Покупайте, продавайте и погашайте верифицированные углеродные кредиты через смарт-контракты Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root { --font-heading: 'Instrument Sans', sans-serif; }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <AnchorProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Toaster
              richColors
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#131A17",
                  border: "1px solid #1E2B26",
                  color: "#F0F5F3",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                },
              }}
            />
          </AnchorProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
