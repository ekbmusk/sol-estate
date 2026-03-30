import { NextRequest, NextResponse } from "next/server";

/**
 * SOLARMAN API proxy — fetches real-time data from solar inverter.
 *
 * Set these env vars:
 *   SOLARMAN_APP_ID     — from solarmanpv.com developer portal
 *   SOLARMAN_APP_SECRET — from solarmanpv.com developer portal
 *   SOLARMAN_DEVICE_SN  — serial number of the inverter
 *
 * If env vars are not set, returns mock data for demo.
 */

const SOLARMAN_API = "https://globalapi.solarmanpv.com";

interface SolarmanTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SolarmanData {
  currentPower: number;     // kW
  totalEnergy: number;      // kWh
  co2Reduced: number;       // tons
  lastUpdate: string;       // ISO timestamp
  isLive: boolean;
}

// Cache token and data to avoid rate limits
let cachedToken: { token: string; expires: number } | null = null;
let cachedData: { data: SolarmanData; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getToken(appId: string, appSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  const res = await fetch(`${SOLARMAN_API}/account/v1.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appSecret,
      grant_type: "client_credentials",
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get SOLARMAN token");

  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in || 3600) * 1000 - 60000,
  };

  return cachedToken.token;
}

async function fetchDeviceData(
  token: string,
  appId: string,
  deviceSn: string
): Promise<SolarmanData> {
  const res = await fetch(`${SOLARMAN_API}/device/v1.0/currentData`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      appId,
      language: "en",
      deviceSn,
    }),
  });

  const data = await res.json();

  // Parse dataList for key metrics
  const dataList: Array<{ key: string; value: string }> = data.dataList || [];
  const get = (key: string) => {
    const item = dataList.find((d) => d.key === key);
    return item ? parseFloat(item.value) : 0;
  };

  return {
    currentPower: get("APo_t1") / 1000, // W → kW
    totalEnergy: get("Etdy_ge1") + get("Et_ge0") / 1000, // kWh
    co2Reduced: (get("Et_ge0") / 1000) * 0.000844, // kWh * emission factor → tons
    lastUpdate: new Date().toISOString(),
    isLive: true,
  };
}

function getMockData(): SolarmanData {
  // Realistic mock for "СЭС Университета Ахмеда Ясави" — 25 kW solar
  const hour = new Date().getHours();
  const isDaytime = hour >= 7 && hour <= 19;

  return {
    currentPower: isDaytime ? 12.4 + Math.random() * 8 : 0,
    totalEnergy: 42650, // 42.65 MWh cumulative
    co2Reduced: 36.01,  // tons
    lastUpdate: new Date().toISOString(),
    isLive: false,
  };
}

export async function GET(_request: NextRequest) {
  const appId = process.env.SOLARMAN_APP_ID;
  const appSecret = process.env.SOLARMAN_APP_SECRET;
  const deviceSn = process.env.SOLARMAN_DEVICE_SN;

  // Return mock if no credentials
  if (!appId || !appSecret || !deviceSn) {
    return NextResponse.json(getMockData());
  }

  // Check cache
  if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cachedData.data);
  }

  try {
    const token = await getToken(appId, appSecret);
    const data = await fetchDeviceData(token, appId, deviceSn);

    cachedData = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    // Fallback to mock on error
    return NextResponse.json(getMockData());
  }
}
