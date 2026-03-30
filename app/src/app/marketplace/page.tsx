import { ArrowLeftRight, BookOpen, BarChart3, Lock } from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "P2P Торговля",
    desc: "Выставляйте доли на продажу и покупайте напрямую у других инвесторов с escrow on-chain.",
  },
  {
    icon: BookOpen,
    title: "Книга заявок",
    desc: "Просматривайте все активные листинги с ценами, объёмами и историей сделок.",
  },
  {
    icon: BarChart3,
    title: "Ценообразование",
    desc: "Рыночное ценообразование через конкуренцию покупателей и продавцов.",
  },
];

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-16 relative overflow-hidden">
      <div className="dot-grid dot-grid-fade absolute inset-0 opacity-50 pointer-events-none" />
      <div className="max-w-[640px] mx-auto text-center mb-14">
        <h1 className="font-heading text-[32px] font-bold tracking-[-0.02em] mb-3">
          Маркетплейс
        </h1>
        <p className="text-[15px] text-[#8A9B94] leading-[1.6]">
          Вторичный рынок токенизированных долей углеродных кредитов
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 max-w-[900px] mx-auto mb-12">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6"
          >
            <div className="w-9 h-9 rounded-lg bg-[rgba(52,211,153,0.08)] flex items-center justify-center mb-4">
              <f.icon size={18} strokeWidth={1.5} className="text-[#34D399]" />
            </div>
            <h3 className="font-heading text-[14px] font-semibold tracking-[-0.01em] mb-2">
              {f.title}
            </h3>
            <p className="text-[13px] text-[#8A9B94] leading-[1.6]">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Lock size={14} strokeWidth={1.5} className="text-[#5A6D65]" />
        <span className="text-[12px] font-medium text-[#5A6D65] tracking-wide">Скоро — Q3 2026</span>
      </div>
    </div>
  );
}
