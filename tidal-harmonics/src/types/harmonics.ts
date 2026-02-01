export type ConstituentFamily = 'semidiurnal' | 'diurnal' | 'long-period' | 'shallow-water';

export interface Constituent {
  symbol: string;
  name: string;
  doodson: [number, number, number, number, number, number];
  speed: number; // degrees per hour
  period: number; // hours
  family: ConstituentFamily;
  description: string;
}

// Extended constituent information for educational purposes
export interface ConstituentDetail {
  symbol: string;
  // Physical cause
  physicalCause: string;
  // Detailed explanation
  explanation: string;
  // Mathematical relationship to other constituents
  mathematicalNotes?: string;
  // Why it matters for predictions
  practicalSignificance: string;
  // Typical relative amplitude (percent of M2)
  typicalAmplitudePercent?: number;
  // Related constituents
  relatedConstituents?: string[];
  // Historical notes
  historicalNotes?: string;
}

export interface ConstituentValue {
  symbol: string;
  amplitude: number; // meters
  phase: number; // degrees (Greenwich phase lag)
}

export interface TideStation {
  id: string;
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  datum: string; // "MLLW", "MSL", etc.
  harmonicEpoch: string; // "1983-2001"
  constituents: ConstituentValue[];
}

export interface TidePrediction {
  time: Date;
  height: number; // meters
}

export interface NodalFactors {
  f: number; // amplitude factor
  u: number; // phase correction (degrees)
}
