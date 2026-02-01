import type { TideStation } from '@/types/harmonics';

// Sample tide stations with harmonic constants from NOAA CO-OPS
// Data source: https://tidesandcurrents.noaa.gov/harcon.html

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
