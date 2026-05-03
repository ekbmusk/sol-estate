"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { routing, type AppLocale } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";

export default function LanguageSwitcher() {
  const t = useTranslations("common.language");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchLocale(next: AppLocale) {
    router.replace(pathname, { locale: next });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("label")}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-[#8A9B94] hover:text-[#F0F5F3] hover:bg-[#1A2320] transition-colors"
      >
        <Globe size={14} />
        <span className="uppercase tracking-wide">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-[#1E2B26] bg-[#0C1210] shadow-xl py-1 z-50">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center justify-between px-3 py-2 text-[13px] transition-colors ${
                l === locale
                  ? "text-[#34D399] bg-[#34D399]/5"
                  : "text-[#F0F5F3] hover:bg-[#1A2320]"
              }`}
            >
              <span>{t(l)}</span>
              {l === locale && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
