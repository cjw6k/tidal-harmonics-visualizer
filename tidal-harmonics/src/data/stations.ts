import type { TideStation } from '@/types/harmonics';

// Sample tide stations with harmonic constants from NOAA CO-OPS
// Data source: https://tidesandcurrents.noaa.gov/harcon.html
//
// Tidal Type Classification (based on (K1+O1)/(M2+S2) ratio):
// - Semidiurnal: ratio < 0.25 (two nearly equal highs/day)
// - Mixed, mainly semidiurnal: 0.25 ≤ ratio < 1.5
// - Mixed, mainly diurnal: 1.5 ≤ ratio < 3.0
// - Diurnal: ratio ≥ 3.0 (one high/day)

export type TidalType =
  | 'semidiurnal'
  | 'mixed-semidiurnal'
  | 'mixed-diurnal'
  | 'diurnal';

export function getTidalType(station: TideStation): TidalType {
  const M2 = station.constituents.find(c => c.symbol === 'M2')?.amplitude ?? 0;
  const S2 = station.constituents.find(c => c.symbol === 'S2')?.amplitude ?? 0;
  const K1 = station.constituents.find(c => c.symbol === 'K1')?.amplitude ?? 0;
  const O1 = station.constituents.find(c => c.symbol === 'O1')?.amplitude ?? 0;

  const ratio = (K1 + O1) / (M2 + S2 || 1);

  if (ratio < 0.25) return 'semidiurnal';
  if (ratio < 1.5) return 'mixed-semidiurnal';
  if (ratio < 3.0) return 'mixed-diurnal';
  return 'diurnal';
}

export function getTidalTypeLabel(type: TidalType): string {
  switch (type) {
    case 'semidiurnal': return 'Semidiurnal (2 equal highs/day)';
    case 'mixed-semidiurnal': return 'Mixed, mainly semidiurnal';
    case 'mixed-diurnal': return 'Mixed, mainly diurnal';
    case 'diurnal': return 'Diurnal (1 high/day)';
  }
}

export const STATIONS: TideStation[] = [
  {
    id: '9414290',
    name: 'San Francisco',
    state: 'CA',
    country: 'US',
    lat: 37.8067,
    lon: -122.465,
    timezone: 'America/Los_Angeles',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 0.577, phase: 187.5 },
      { symbol: 'S2', amplitude: 0.133, phase: 205.7 },
      { symbol: 'N2', amplitude: 0.136, phase: 166.9 },
      { symbol: 'K1', amplitude: 0.368, phase: 213.0 },
      { symbol: 'O1', amplitude: 0.226, phase: 198.0 },
      { symbol: 'K2', amplitude: 0.039, phase: 199.5 },
      { symbol: 'P1', amplitude: 0.115, phase: 210.4 },
      { symbol: 'Q1', amplitude: 0.044, phase: 186.6 },
      { symbol: 'M4', amplitude: 0.023, phase: 246.2 },
      { symbol: 'MS4', amplitude: 0.008, phase: 277.1 },
      { symbol: 'Mf', amplitude: 0.015, phase: 245.3 },
      { symbol: 'Mm', amplitude: 0.008, phase: 134.2 },
    ],
  },
  {
    id: '8518750',
    name: 'The Battery, New York',
    state: 'NY',
    country: 'US',
    lat: 40.7006,
    lon: -74.0142,
    timezone: 'America/New_York',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 0.671, phase: 355.5 },
      { symbol: 'S2', amplitude: 0.146, phase: 25.0 },
      { symbol: 'N2', amplitude: 0.159, phase: 335.3 },
      { symbol: 'K1', amplitude: 0.102, phase: 110.2 },
      { symbol: 'O1', amplitude: 0.056, phase: 93.5 },
      { symbol: 'K2', amplitude: 0.042, phase: 21.1 },
      { symbol: 'P1', amplitude: 0.033, phase: 109.0 },
      { symbol: 'Q1', amplitude: 0.011, phase: 85.0 },
      { symbol: 'M4', amplitude: 0.046, phase: 190.5 },
      { symbol: 'MS4', amplitude: 0.026, phase: 220.3 },
      { symbol: 'Mf', amplitude: 0.018, phase: 265.0 },
      { symbol: 'Mm', amplitude: 0.012, phase: 156.0 },
    ],
  },
  {
    id: '8443970',
    name: 'Boston',
    state: 'MA',
    country: 'US',
    lat: 42.3539,
    lon: -71.0503,
    timezone: 'America/New_York',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 1.407, phase: 110.8 },
      { symbol: 'S2', amplitude: 0.225, phase: 137.5 },
      { symbol: 'N2', amplitude: 0.313, phase: 88.3 },
      { symbol: 'K1', amplitude: 0.137, phase: 185.0 },
      { symbol: 'O1', amplitude: 0.108, phase: 172.3 },
      { symbol: 'K2', amplitude: 0.065, phase: 132.5 },
      { symbol: 'P1', amplitude: 0.044, phase: 183.2 },
      { symbol: 'Q1', amplitude: 0.021, phase: 162.0 },
      { symbol: 'M4', amplitude: 0.045, phase: 320.0 },
      { symbol: 'MS4', amplitude: 0.019, phase: 355.0 },
    ],
  },
  {
    id: '9410660',
    name: 'Los Angeles',
    state: 'CA',
    country: 'US',
    lat: 33.7199,
    lon: -118.2729,
    timezone: 'America/Los_Angeles',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 0.521, phase: 141.7 },
      { symbol: 'S2', amplitude: 0.161, phase: 142.2 },
      { symbol: 'N2', amplitude: 0.120, phase: 124.5 },
      { symbol: 'K1', amplitude: 0.329, phase: 195.8 },
      { symbol: 'O1', amplitude: 0.217, phase: 183.6 },
      { symbol: 'K2', amplitude: 0.046, phase: 139.0 },
      { symbol: 'P1', amplitude: 0.106, phase: 193.0 },
      { symbol: 'Q1', amplitude: 0.041, phase: 172.0 },
      { symbol: 'M4', amplitude: 0.007, phase: 85.0 },
      { symbol: 'MS4', amplitude: 0.003, phase: 115.0 },
    ],
  },
  {
    id: '8658120',
    name: 'Wilmington',
    state: 'NC',
    country: 'US',
    lat: 34.2275,
    lon: -77.9536,
    timezone: 'America/New_York',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 0.585, phase: 28.5 },
      { symbol: 'S2', amplitude: 0.094, phase: 46.0 },
      { symbol: 'N2', amplitude: 0.128, phase: 8.3 },
      { symbol: 'K1', amplitude: 0.168, phase: 182.5 },
      { symbol: 'O1', amplitude: 0.156, phase: 180.2 },
      { symbol: 'K2', amplitude: 0.028, phase: 42.5 },
      { symbol: 'P1', amplitude: 0.054, phase: 180.0 },
      { symbol: 'Q1', amplitude: 0.030, phase: 170.0 },
      { symbol: 'M4', amplitude: 0.024, phase: 130.0 },
      { symbol: 'MS4', amplitude: 0.010, phase: 155.0 },
    ],
  },
  // Seattle - Mixed, mainly semidiurnal (strong diurnal inequality)
  {
    id: '9447130',
    name: 'Seattle',
    state: 'WA',
    country: 'US',
    lat: 47.6026,
    lon: -122.3393,
    timezone: 'America/Los_Angeles',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 1.076, phase: 27.5 },
      { symbol: 'S2', amplitude: 0.276, phase: 57.8 },
      { symbol: 'N2', amplitude: 0.228, phase: 7.0 },
      { symbol: 'K1', amplitude: 0.856, phase: 260.5 },
      { symbol: 'O1', amplitude: 0.498, phase: 242.3 },
      { symbol: 'K2', amplitude: 0.078, phase: 50.5 },
      { symbol: 'P1', amplitude: 0.267, phase: 257.2 },
      { symbol: 'Q1', amplitude: 0.093, phase: 230.0 },
      { symbol: 'M4', amplitude: 0.012, phase: 145.0 },
      { symbol: 'MS4', amplitude: 0.005, phase: 180.0 },
      { symbol: 'Mf', amplitude: 0.022, phase: 268.0 },
      { symbol: 'Mm', amplitude: 0.012, phase: 155.0 },
    ],
  },
  // Anchorage - Semidiurnal with very large range
  {
    id: '9455920',
    name: 'Anchorage',
    state: 'AK',
    country: 'US',
    lat: 61.2381,
    lon: -149.8894,
    timezone: 'America/Anchorage',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 3.652, phase: 6.8 },
      { symbol: 'S2', amplitude: 0.983, phase: 35.2 },
      { symbol: 'N2', amplitude: 0.752, phase: 346.0 },
      { symbol: 'K1', amplitude: 0.672, phase: 270.5 },
      { symbol: 'O1', amplitude: 0.408, phase: 253.0 },
      { symbol: 'K2', amplitude: 0.276, phase: 28.0 },
      { symbol: 'P1', amplitude: 0.216, phase: 267.5 },
      { symbol: 'Q1', amplitude: 0.078, phase: 240.0 },
      { symbol: 'M4', amplitude: 0.198, phase: 115.0 },
      { symbol: 'MS4', amplitude: 0.095, phase: 145.0 },
      { symbol: 'MN4', amplitude: 0.085, phase: 85.0 },
      { symbol: 'M6', amplitude: 0.045, phase: 220.0 },
    ],
  },
  // Pensacola - Mixed, tending diurnal (Gulf of Mexico)
  {
    id: '8729840',
    name: 'Pensacola',
    state: 'FL',
    country: 'US',
    lat: 30.4044,
    lon: -87.2108,
    timezone: 'America/Chicago',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 0.076, phase: 355.0 },
      { symbol: 'S2', amplitude: 0.018, phase: 25.0 },
      { symbol: 'N2', amplitude: 0.018, phase: 335.0 },
      { symbol: 'K1', amplitude: 0.234, phase: 15.5 },
      { symbol: 'O1', amplitude: 0.220, phase: 355.0 },
      { symbol: 'K2', amplitude: 0.005, phase: 20.0 },
      { symbol: 'P1', amplitude: 0.075, phase: 12.0 },
      { symbol: 'Q1', amplitude: 0.042, phase: 340.0 },
      { symbol: 'Mf', amplitude: 0.018, phase: 275.0 },
      { symbol: 'Mm', amplitude: 0.010, phase: 165.0 },
    ],
  },
  // Honolulu - Mixed tides (Pacific island)
  {
    id: '1612340',
    name: 'Honolulu',
    state: 'HI',
    country: 'US',
    lat: 21.3067,
    lon: -157.867,
    timezone: 'Pacific/Honolulu',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 0.192, phase: 222.5 },
      { symbol: 'S2', amplitude: 0.067, phase: 244.0 },
      { symbol: 'N2', amplitude: 0.045, phase: 202.0 },
      { symbol: 'K1', amplitude: 0.141, phase: 75.0 },
      { symbol: 'O1', amplitude: 0.091, phase: 54.0 },
      { symbol: 'K2', amplitude: 0.019, phase: 237.0 },
      { symbol: 'P1', amplitude: 0.044, phase: 72.0 },
      { symbol: 'Q1', amplitude: 0.017, phase: 42.0 },
      { symbol: 'M4', amplitude: 0.003, phase: 85.0 },
    ],
  },
  // London (Tower Bridge) - Semidiurnal (Thames estuary)
  {
    id: 'UK-0113',
    name: 'London Bridge',
    country: 'UK',
    lat: 51.5074,
    lon: -0.0761,
    timezone: 'Europe/London',
    datum: 'ODN',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 2.183, phase: 356.0 },
      { symbol: 'S2', amplitude: 0.689, phase: 44.5 },
      { symbol: 'N2', amplitude: 0.422, phase: 336.0 },
      { symbol: 'K1', amplitude: 0.156, phase: 52.0 },
      { symbol: 'O1', amplitude: 0.098, phase: 328.0 },
      { symbol: 'K2', amplitude: 0.195, phase: 39.0 },
      { symbol: 'P1', amplitude: 0.052, phase: 48.0 },
      { symbol: 'M4', amplitude: 0.312, phase: 165.0 },
      { symbol: 'MS4', amplitude: 0.198, phase: 210.0 },
      { symbol: 'MN4', amplitude: 0.125, phase: 145.0 },
      { symbol: 'M6', amplitude: 0.089, phase: 75.0 },
    ],
  },
  // Fundy - Extreme semidiurnal (world's highest tides)
  {
    id: 'CA-0665',
    name: 'Burntcoat Head',
    state: 'NS',
    country: 'Canada',
    lat: 45.3089,
    lon: -63.7853,
    timezone: 'America/Halifax',
    datum: 'MLLW',
    harmonicEpoch: '1983-2001',
    constituents: [
      { symbol: 'M2', amplitude: 5.650, phase: 100.5 },
      { symbol: 'S2', amplitude: 0.920, phase: 135.0 },
      { symbol: 'N2', amplitude: 1.180, phase: 78.0 },
      { symbol: 'K1', amplitude: 0.158, phase: 178.0 },
      { symbol: 'O1', amplitude: 0.098, phase: 165.0 },
      { symbol: 'K2', amplitude: 0.255, phase: 125.0 },
      { symbol: 'P1', amplitude: 0.052, phase: 175.0 },
      { symbol: 'M4', amplitude: 0.485, phase: 295.0 },
      { symbol: 'MS4', amplitude: 0.185, phase: 345.0 },
      { symbol: 'MN4', amplitude: 0.225, phase: 265.0 },
      { symbol: 'M6', amplitude: 0.145, phase: 85.0 },
    ],
  },
];

// Get station by ID
export function getStationById(id: string): TideStation | undefined {
  return STATIONS.find((s) => s.id === id);
}

// Get all station names for dropdown
export function getStationOptions(): { id: string; name: string }[] {
  return STATIONS.map((s) => ({
    id: s.id,
    name: s.state ? `${s.name}, ${s.state}` : s.name,
  }));
}
