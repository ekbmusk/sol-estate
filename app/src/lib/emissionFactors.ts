// Kazakhstan-specific CO2 emission factors (kg CO2 per unit)
export const EMISSION_FACTORS = {
  electricity: 0.636,     // per kWh — KZ grid is coal-heavy
  carTransport: 0.21,     // per km — average passenger car
  flights: 0.255,         // per passenger-km
  naturalGas: 2.0,        // per m³
};

// Visual comparison constants
export const EQUIVALENCES = {
  treesPerTonCO2: 45,           // ~45 mature trees absorb 1 tonne CO2/year
  flightAlmatyMoscowTonnes: 0.612, // one-way ALA-SVO ~2400 km
  avgKZPerCapita: 17.5,         // tonnes CO2 per person per year in KZ
};

export interface CalculatorInputs {
  electricityKwh: number; // monthly
  carKm: number;          // monthly
  flightsKm: number;      // annual
  gasM3: number;          // monthly
}

export function calculateFootprint(inputs: CalculatorInputs): number {
  const annual =
    inputs.electricityKwh * 12 * EMISSION_FACTORS.electricity +
    inputs.carKm * 12 * EMISSION_FACTORS.carTransport +
    inputs.flightsKm * EMISSION_FACTORS.flights +
    inputs.gasM3 * 12 * EMISSION_FACTORS.naturalGas;
  return annual / 1000; // tonnes
}

export function getCategoryBreakdown(inputs: CalculatorInputs) {
  return [
    { key: "electricity", label: "Электричество", value: inputs.electricityKwh * 12 * EMISSION_FACTORS.electricity / 1000, color: "#FBBF24" },
    { key: "car", label: "Автомобиль", value: inputs.carKm * 12 * EMISSION_FACTORS.carTransport / 1000, color: "#60A5FA" },
    { key: "flights", label: "Авиаперелёты", value: inputs.flightsKm * EMISSION_FACTORS.flights / 1000, color: "#A78BFA" },
    { key: "gas", label: "Отопление", value: inputs.gasM3 * 12 * EMISSION_FACTORS.naturalGas / 1000, color: "#F87171" },
  ];
}
