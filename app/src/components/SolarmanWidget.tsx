"use client";

import { useEffect, useState } from "react";

interface SolarmanData {
  currentPower: number;
  dailyEnergy: number;
  totalEnergy: number;
  co2Reduced: number;
  lastUpdate: string;
  isLive: boolean;
}

const RATED_POWER = 25; // 25 kW rated capacity

export default function SolarmanWidget() {
  const [data, setData] = useState<SolarmanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/solarman");
        const json = await res.json();
        setData(json);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-64 rounded-xl skeleton" />;
  }

  if (!data) return null;

  const updatedAgo = data.lastUpdate
    ? Math.round((Date.now() - new Date(data.lastUpdate).getTime()) / 60000)
    : null;

  const powerPct = Math.min((data.currentPower / RATED_POWER) * 100, 100);
  const isGenerating = data.currentPower > 0.1;

  // SVG arc for power gauge
  const gaugeRadius = 52;
  const gaugeCircumference = Math.PI * gaugeRadius; // half circle
  const gaugeOffset = gaugeCircumference - (gaugeCircumference * powerPct) / 100;

  return (
    <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-[#FBBF24]">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[13px] font-medium">Live-мониторинг</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${data.isLive ? "bg-[#34D399] animate-pulse" : "bg-[#FBBF24]"}`} />
          <span className="text-[10px] text-[#5A6D65]">
            {data.isLive ? "SOLARMAN API" : "Demo"}
          </span>
        </div>
      </div>

      {/* Power gauge */}
      <div className="flex justify-center py-2 relative">
        {/* Animated rays when generating */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                className="absolute w-[1px] bg-[#FBBF24] animate-pulse"
                style={{
                  height: `${12 + powerPct * 0.15}px`,
                  transform: `rotate(${deg}deg) translateY(-${48 + powerPct * 0.2}px)`,
                  opacity: 0.15 + (powerPct / 100) * 0.2,
                  animationDelay: `${deg * 5}ms`,
                }}
              />
            ))}
          </div>
        )}

        <svg width="140" height="85" viewBox="0 0 140 85">
          {/* Background arc */}
          <path
            d="M 14 78 A 56 56 0 0 1 126 78"
            fill="none"
            stroke="#1E2B26"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 14 78 A 56 56 0 0 1 126 78"
            fill="none"
            stroke={isGenerating ? "#FBBF24" : "#2A3832"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${gaugeCircumference}`}
            strokeDashoffset={`${gaugeOffset}`}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: isGenerating ? "drop-shadow(0 0 6px rgba(251,191,36,0.3))" : "none",
            }}
          />
          {/* Power text */}
          <text
            x="70"
            y="58"
            textAnchor="middle"
            className="font-mono-data"
            style={{ fontSize: "26px", fontWeight: 700 }}
            fill={isGenerating ? "#FBBF24" : "#5A6D65"}
          >
            {data.currentPower.toFixed(1)}
          </text>
          <text
            x="70"
            y="76"
            textAnchor="middle"
            style={{ fontSize: "10px" }}
            fill="#5A6D65"
          >
            кВт из {RATED_POWER}
          </text>
        </svg>
      </div>

      {/* Capacity bar */}
      <div className="mx-5 mb-4">
        <div className="flex justify-between text-[10px] text-[#5A6D65] mb-1">
          <span>Загрузка инвертора</span>
          <span className={`font-mono-data ${isGenerating ? "text-[#FBBF24]" : ""}`}>
            {powerPct.toFixed(0)}%
          </span>
        </div>
        <div className="h-[4px] rounded-full bg-[#1E2B26] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${powerPct}%`,
              background: isGenerating
                ? `linear-gradient(90deg, #F59E0B, #FBBF24)`
                : "#2A3832",
              boxShadow: isGenerating ? "0 0 8px rgba(251,191,36,0.3)" : "none",
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 border-t border-[#1E2B26]">
        <div className="p-3 text-center border-r border-[#1E2B26]">
          <p className="label-upper mb-1" style={{ fontSize: "8px" }}>Сегодня</p>
          <p className="font-mono-data text-[15px] font-medium text-[#F0F5F3]">
            {data.dailyEnergy.toFixed(1)}
          </p>
          <p className="text-[9px] text-[#5A6D65]">кВт·ч</p>
        </div>
        <div className="p-3 text-center border-r border-[#1E2B26]">
          <p className="label-upper mb-1" style={{ fontSize: "8px" }}>Всего</p>
          <p className="font-mono-data text-[15px] font-medium text-[#F0F5F3]">
            {(data.totalEnergy / 1000).toFixed(1)}
          </p>
          <p className="text-[9px] text-[#5A6D65]">МВт·ч</p>
        </div>
        <div className="p-3 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#34D399]/[0.03]" />
          <p className="relative label-upper mb-1" style={{ fontSize: "8px" }}>CO₂ предотвращено</p>
          <div className="relative flex items-center justify-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#34D399]">
              <path d="M12 3c-1.5 2-4 5-4 8a4 4 0 108 0c0-3-2.5-6-4-8z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <p className="font-mono-data text-[15px] font-medium text-[#34D399]">
              {data.co2Reduced.toFixed(1)}
            </p>
          </div>
          <p className="relative text-[9px] text-[#5A6D65]">тонн</p>
        </div>
      </div>

      {/* Footer */}
      {updatedAgo !== null && (
        <div className={`px-5 py-2 border-t border-[#1E2B26] transition-colors ${pulse ? "bg-[#FBBF24]/5" : ""}`}>
          <span className="text-[9px] text-[#3D5048]">
            Обновлено {updatedAgo < 1 ? "только что" : `${updatedAgo} мин назад`}
          </span>
        </div>
      )}
    </div>
  );
}
