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
