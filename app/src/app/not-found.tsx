import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-32 text-center relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
      <div className="relative">
        <p className="font-mono-data text-[72px] font-bold text-[#1E2B26]">404</p>
        <h1 className="font-heading text-[24px] font-bold tracking-[-0.02em] mt-2 mb-3">
          Страница не найдена
        </h1>
        <p className="text-[14px] text-[#5A6D65] mb-8">
          Возможно, она была перемещена или удалена
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-5 py-2.5 text-[14px] font-semibold text-[#060A08] hover:bg-[#059669] transition-all duration-200"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
