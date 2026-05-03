"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Zap, Car, Plane, Flame, TreePine, User, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  calculateFootprint,
  getCategoryBreakdown,
  EQUIVALENCES,
  type CalculatorInputs,
} from "@/lib/emissionFactors";

function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const raf = useRef(0);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const delta = target - from;
    if (Math.abs(delta) < 0.01) {
      setDisplay(target);
      prev.current = target;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = from + delta * ease;
      setDisplay(val);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

const FIELD_KEYS = [
  { key: "electricityKwh" as const, i18nKey: "electricity", icon: Zap, color: "#FBBF24" },
  { key: "carKm" as const, i18nKey: "car", icon: Car, color: "#60A5FA" },
  { key: "flightsKm" as const, i18nKey: "flights", icon: Plane, color: "#A78BFA" },
  { key: "gasM3" as const, i18nKey: "gas", icon: Flame, color: "#F87171" },
];

function ChartTooltip({ active, payload, tooltipUnit }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#1E2B26] bg-[#131A17] px-3 py-2 text-[12px] shadow-xl">
      <p className="text-[#8A9B94] mb-0.5">{d.label}</p>
      <p className="font-mono-data text-[#F0F5F3] font-medium">{d.value.toFixed(2)} {tooltipUnit}</p>
    </div>
  );
}

const KEY_TO_I18N: Record<string, string> = {
  electricity: "electricity",
  car: "car",
  flights: "flights",
  gas: "gas",
};

export default function CalculatorPage() {
  const t = useTranslations("calculator");
  const [inputs, setInputs] = useState<CalculatorInputs>({
    electricityKwh: 250,
    carKm: 1000,
    flightsKm: 5000,
    gasM3: 150,
  });

  const total = calculateFootprint(inputs);
  const breakdown = getCategoryBreakdown(inputs).map((d) => ({
    ...d,
    label: t(`fields.${KEY_TO_I18N[d.key]}.label` as "fields.electricity.label"),
  }));
  const animatedTotal = useAnimatedNumber(total);
  const creditsNeeded = Math.ceil(total);

  const trees = Math.round(total * EQUIVALENCES.treesPerTonCO2);
  const pctOfAvg = Math.round((total / EQUIVALENCES.avgKZPerCapita) * 100);
  const flights = (total / EQUIVALENCES.flightAlmatyMoscowTonnes).toFixed(1);

  const update = (key: keyof CalculatorInputs, val: number) =>
    setInputs((prev) => ({ ...prev, [key]: Math.max(0, val) }));

  const tooltipUnit = t("tonnesCO2Tooltip");

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#5A6D65] mb-2">
          {t("label")}
        </p>
        <h1 className="font-heading text-[32px] sm:text-[40px] font-bold tracking-[-0.02em] leading-tight mb-3">
          {t("headline1")}{" "}
          <span className="text-[#34D399]">{t("headlineAccent")}</span>
        </h1>
        <p className="text-[#8A9B94] text-[15px] max-w-xl">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6">
            <h2 className="text-[15px] font-semibold mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center">
                <Zap size={14} className="text-[#34D399]" />
              </span>
              {t("consumption")}
            </h2>

            <div className="space-y-5">
              {FIELD_KEYS.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.key} className="group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
                      >
                        <Icon size={13} style={{ color: f.color }} />
                      </span>
                      <label className="text-[13px] font-medium text-[#F0F5F3]">
                        {t(`fields.${f.i18nKey}.label` as "fields.electricity.label")}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={inputs[f.key]}
                        onChange={(e) => update(f.key, Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-[#1E2B26] bg-[#060A08] px-3 py-1 text-sm font-mono-data text-[#F0F5F3] shadow-sm transition-colors placeholder:text-[#5A6D65] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34D399]/50 focus-visible:border-[#34D399]/30"
                      />
                      <span className="text-[12px] text-[#5A6D65] whitespace-nowrap min-w-[80px]">
                        {t(`fields.${f.i18nKey}.unit` as "fields.electricity.unit")}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6D65] mt-1">
                      {t(`fields.${f.i18nKey}.hint` as "fields.electricity.hint")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
            <p className="text-[12px] text-[#5A6D65] leading-relaxed">
              <span className="text-[#8A9B94] font-medium">{t("methodologyLabel")}</span>{" "}
              {t("methodologyText")}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#34D399]/5 blur-3xl pointer-events-none" />

            <p className="label-upper mb-3">{t("footprintLabel")}</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-heading text-[48px] sm:text-[56px] font-bold text-[#F0F5F3] tracking-tight leading-none">
                {animatedTotal.toFixed(1)}
              </span>
              <span className="text-[16px] text-[#8A9B94]">{t("tonnesPerYear")}</span>
            </div>
            <p className="text-[12px] text-[#5A6D65] mb-5">
              {pctOfAvg > 100
                ? t("aboveAverage", { pct: pctOfAvg - 100 })
                : t("ofAverage", { pct: pctOfAvg })}
            </p>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown.filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {breakdown
                      .filter((d) => d.value > 0)
                      .map((d) => (
                        <Cell key={d.key} fill={d.color} />
                      ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip tooltipUnit={tooltipUnit} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
              {breakdown.map((d) => (
                <div key={d.key} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-[#8A9B94] truncate">{d.label}</span>
                  <span className="font-mono-data text-[#F0F5F3] ml-auto">
                    {d.value.toFixed(1)}{t("tonneShort")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5">
            <p className="label-upper mb-4">{t("equivalent")}</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center shrink-0">
                  <TreePine size={16} className="text-[#34D399]" />
                </span>
                <div>
                  <p className="text-[14px] text-[#F0F5F3] font-medium">
                    {t("treesLabel", { count: trees })}
                  </p>
                  <p className="text-[11px] text-[#5A6D65]">{t("treesHint")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center shrink-0">
                  <User size={16} className="text-[#60A5FA]" />
                </span>
                <div>
                  <p className="text-[14px] text-[#F0F5F3] font-medium">
                    {t("ofAvgShort", { pct: pctOfAvg })}
                  </p>
                  <p className="text-[11px] text-[#5A6D65]">{t("kazakhPersonHint")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center shrink-0">
                  <Plane size={16} className="text-[#A78BFA]" />
                </span>
                <div>
                  <p className="text-[14px] text-[#F0F5F3] font-medium">
                    {t("flightsLabel", { count: flights })}
                  </p>
                  <p className="text-[11px] text-[#5A6D65]">{t("flightsHint")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#F97316]/20 bg-[#F97316]/5 p-5">
            <p className="label-upper mb-2 text-[#F97316]">{t("compensationLabel")}</p>
            <p className="text-[14px] text-[#F0F5F3] mb-1">
              {t("creditsLine1")}{" "}
              <span className="font-mono-data text-[#F97316] font-semibold text-[18px]">
                {creditsNeeded}
              </span>{" "}
              {t("creditsLine2")}
            </p>
            <p className="text-[12px] text-[#8A9B94] mb-4">
              {t("creditsHint")}
            </p>
            <Link
              href={`/retire?amount=${creditsNeeded}`}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-[14px] font-medium transition-colors"
            >
              {t("compensateCta")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
