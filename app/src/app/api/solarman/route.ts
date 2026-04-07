import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const SOLARMAN_API = "https://globalapi.solarmanpv.com";
const APP_ID = process.env.SOLARMAN_APP_ID ?? "";
const APP_SECRET = process.env.SOLARMAN_APP_SECRET ?? "";
const EMAIL = process.env.SOLARMAN_EMAIL ?? "";
const PASSWORD = process.env.SOLARMAN_PASSWORD ?? "";
const DEVICE_SN = process.env.SOLARMAN_DEVICE_SN ?? "";

interface SolarmanData {
  currentPower: number;
  totalEnergy: number;
  dailyEnergy: number;
  co2Reduced: number;
  lastUpdate: string;
  isLive: boolean;
}

let cachedToken: { token: string; expires: number } | null = null;
let cachedData: { data: SolarmanData; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function sha256(str: string): string {
  return createHash("sha256").update(str).digest("hex").toLowerCase();
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  const res = await fetch(
    `${SOLARMAN_API}/account/v1.0/token?appId=${APP_ID}&language=en`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appSecret: APP_SECRET,
        email: EMAIL,
        password: sha256(PASSWORD),
      }),
    }
  );

  const data = await res.json();
  if (!data.access_token) {
    console.error("SOLARMAN token error:", JSON.stringify(data));
    throw new Error("Failed to get SOLARMAN token");
  }

  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in || 3600) * 1000 - 60000,
  };

  return cachedToken.token;
}

async function fetchDeviceData(token: string): Promise<SolarmanData> {
  const res = await fetch(`${SOLARMAN_API}/device/v1.0/currentData?appId=${APP_ID}&language=en`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceSn: DEVICE_SN,
    }),
  });

  const data = await res.json();

  if (!data.dataList) {
    console.error("SOLARMAN device error:", JSON.stringify(data).slice(0, 500));
    throw new Error("No device data");
  }

  const dataList: Array<{ key: string; value: string; name?: string }> = data.dataList || [];
  const get = (key: string) => {
    const item = dataList.find((d) => d.key === key);
    return item ? parseFloat(item.value) : 0;
  };

  // Common SOLARMAN keys for inverters:
  // APo_t1 or Pac — active power (W)
  // Etdy_ge1 or Eday — daily energy (kWh)
  // Et_ge0 or Etotal — total energy (kWh)
  // CO2_ge0 — CO2 reduced (kg)

  const activePowerW = get("APo_t1"); // Total AC Output Power (Active) in W
  const dailyEnergy = get("Etdy_ge1"); // Daily Production (Active) in kWh
  const totalEnergy = get("Et_ge0"); // Cumulative Production (Active) in kWh

  // KZ grid emission factor: 0.844 kg CO₂ per kWh
  const co2Tons = (totalEnergy * 0.844) / 1000;

  // Turkestan timezone is UTC+5, sunrise ~7, sunset ~19
  const kzHour = new Date(Date.now() + 5 * 3600_000).getUTCHours();
  const isNight = kzHour < 7 || kzHour >= 20;

  return {
    currentPower: isNight ? 0 : activePowerW / 1000, // W → kW
    dailyEnergy: isNight ? 0 : dailyEnergy,
    totalEnergy,
    co2Reduced: co2Tons,
    lastUpdate: new Date().toISOString(),
    isLive: true,
  };
}

function getMockData(): SolarmanData {
  const hour = new Date().getHours();
  const isDaytime = hour >= 7 && hour <= 19;

  return {
    currentPower: isDaytime ? 12.4 + Math.random() * 8 : 0,
    dailyEnergy: isDaytime ? 45 + Math.random() * 30 : 0,
    totalEnergy: 42650,
    co2Reduced: 36.01,
    lastUpdate: new Date().toISOString(),
    isLive: false,
  };
}

export async function GET(_request: NextRequest) {
  // Check cache
  if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cachedData.data);
  }

  try {
    const token = await getToken();
    const data = await fetchDeviceData(token);

    cachedData = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error("SOLARMAN fallback to mock:", err);
    return NextResponse.json(getMockData());
  }
}
