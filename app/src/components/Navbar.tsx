"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useKzte } from "@/hooks/useKzte";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const navLinks = [
  { href: "/", label: "Проекты", exact: true },
  { href: "/portfolio", label: "Портфель" },
  { href: "/marketplace", label: "Маркетплейс" },
  { href: "/retire", label: "Гашение" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { balance: kzteBalance } = useKzte();

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b border-[#1E2B26] bg-[#060A08]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Hexagon logo */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#34D399] shrink-0">
              <path d="M14 2L25 8.5V19.5L14 26L3 19.5V8.5L14 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M14 8C14 8 10 12 10 15C10 17.2 11.8 19 14 19C16.2 19 18 17.2 18 15C18 12 14 8 14 8Z" stroke="currentColor" strokeWidth="1.2" fill="rgba(52,211,153,0.1)"/>
            </svg>
            <span className="font-heading text-[18px] font-bold tracking-[-0.02em]">
              Carbon<span className="text-[#34D399]">KZ</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-[13px] font-medium transition-colors duration-200
                    ${isActive ? "text-[#F0F5F3]" : "text-[#8A9B94] hover:text-[#F0F5F3]"}`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#34D399]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* KZTE balance */}
          {kzteBalance !== null && kzteBalance > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#34D399]/10 border border-[#34D399]/20">
              <span className="font-mono-data text-[11px] font-medium text-[#34D399] tracking-wide">
                {kzteBalance.toLocaleString("ru-RU")} &#x20B8;
              </span>
            </div>
          )}
          {/* Network badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FBBF24]/10 border border-[#FBBF24]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
            <span className="text-[11px] font-medium text-[#FBBF24] tracking-wide">Devnet</span>
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
