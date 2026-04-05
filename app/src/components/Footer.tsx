export default function Footer() {
  return (
    <footer className="border-t border-[#1E2B26] py-10 relative overflow-hidden">
      <div className="dot-grid-subtle dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
      <div className="mx-auto max-w-[1280px] px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-heading text-[14px] font-bold tracking-[-0.01em]">
          Carbon<span className="text-[#34D399]">KZ</span>
        </span>
        <div className="flex items-center gap-5 text-[12px] text-[#5A6D65]">
          <span>Solana</span>
          <span className="w-px h-3 bg-[#1E2B26]" />
          <span>KZTE Stablecoin</span>
          <span className="w-px h-3 bg-[#1E2B26]" />
          <span>Decentrathon 5.0</span>
        </div>
      </div>
    </footer>
  );
}
