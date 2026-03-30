"use client";

import { useEffect, useState } from "react";

interface SolarmanData {
  currentPower: number;
  totalEnergy: number;
  co2Reduced: number;
  lastUpdate: string;
  isLive: boolean;
}

export default function SolarmanWidget() {
  const [data, setData] = useState<SolarmanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/solarman");
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-32 rounded-xl skeleton" />;
  }

  if (!data) return null;

  const updatedAgo = data.lastUpdate
    ? Math.round((Date.now() - new Date(data.lastUpdate).getTime()) / 60000)
    : null;

  return (
    <div className="rounded-xl border border-[#1E2B26] bg-[#0C1210] p-5 space-y-4">
      <div className="flex items-center justify-between">
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
            {data.isLive ? "SOLARMAN API" : "Demo данные"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] p-3 text-center">
          <p className="label-upper mb-1" style={{ fontSize: "9px" }}>Сейчас</p>
          <p className="font-mono-data text-[16px] font-medium text-[#FBBF24]">
            {data.currentPower.toFixed(1)}
          </p>
          <p className="text-[10px] text-[#5A6D65]">кВт</p>
        </div>
        <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] p-3 text-center">
          <p className="label-upper mb-1" style={{ fontSize: "9px" }}>Всего</p>
          <p className="font-mono-data text-[16px] font-medium text-[#F0F5F3]">
            {(data.totalEnergy / 1000).toFixed(2)}
          </p>
          <p className="text-[10px] text-[#5A6D65]">МВт·ч</p>
        </div>
        <div className="rounded-lg bg-[#060A08] border border-[#1E2B26] p-3 text-center">
          <p className="label-upper mb-1" style={{ fontSize: "9px" }}>CO₂</p>
          <p className="font-mono-data text-[16px] font-medium text-[#34D399]">
            {data.co2Reduced.toFixed(2)}
          </p>
          <p className="text-[10px] text-[#5A6D65]">тонн</p>
        </div>
      </div>

      {updatedAgo !== null && (
        <p className="text-[10px] text-[#3D5048] text-right">
          Обновлено {updatedAgo < 1 ? "только что" : `${updatedAgo} мин назад`}
        </p>
      )}
    </div>
  );
}
