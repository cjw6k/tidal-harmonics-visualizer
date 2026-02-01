// Harmonic tide prediction algorithm
// Based on the standard harmonic method used by NOAA

import type { TideStation, TidePrediction } from '@/types/harmonics';
import { CONSTITUENTS } from '@/data/constituents';
import {
  getAstronomicalParameters,
  calculateV0,
  getNodalFactors,
  normalizeAngle,
} from './astronomical';

/**
 * Calculate the tide height at a given time for a station
 *
 * The harmonic prediction formula:
 * h(t) = Σ fᵢ × Aᵢ × cos(ωᵢ×t + (V₀+u)ᵢ - Gᵢ)
 *
 * Where:
 * fᵢ = nodal amplitude factor
 * Aᵢ = amplitude from harmonic constants
 * ωᵢ = constituent angular speed (degrees/hour)
 * t = time since epoch (hours)
 * V₀ᵢ = equilibrium argument
 * uᵢ = nodal phase correction
 * Gᵢ = phase lag (Greenwich epoch)
 */
export function predictTide(station: TideStation, date: Date): number {
  const astro = getAstronomicalParameters(date);
  let height = 0;

  for (const c of station.constituents) {
    const constituent = CONSTITUENTS[c.symbol];
    if (!constituent) continue;

    // Get nodal corrections
    const { f, u } = getNodalFactors(c.symbol, astro.N);

    // Calculate equilibrium argument V0
    const V0 = calculateV0(constituent.doodson, astro);

    // Phase calculation: V0 + u - G (all in degrees)
    // V0 already includes the time-varying astronomical argument
    const phase = normalizeAngle(V0 + u - c.phase);

    // Convert to radians for cosine
    const phaseRad = (phase * Math.PI) / 180;

    // Add constituent contribution
    height += f * c.amplitude * Math.cos(phaseRad);
  }

  return height;
}

/**
 * Calculate individual constituent contributions at a given time
 * Useful for phasor diagrams and detailed analysis
 */
export function getConstituentContributions(
  station: TideStation,
  date: Date
): { symbol: string; contribution: number; phase: number; amplitude: number }[] {
  const astro = getAstronomicalParameters(date);
  const contributions: {
    symbol: string;
    contribution: number;
    phase: number;
    amplitude: number;
  }[] = [];

  for (const c of station.constituents) {
    const constituent = CONSTITUENTS[c.symbol];
    if (!constituent) continue;

    const { f, u } = getNodalFactors(c.symbol, astro.N);
    const V0 = calculateV0(constituent.doodson, astro);
    const phase = normalizeAngle(V0 + u - c.phase);
    const phaseRad = (phase * Math.PI) / 180;
    const effectiveAmplitude = f * c.amplitude;

    contributions.push({
      symbol: c.symbol,
      contribution: effectiveAmplitude * Math.cos(phaseRad),
      phase,
      amplitude: effectiveAmplitude,
    });
  }

  return contributions;
}

/**
 * Generate a time series of tide predictions
 */
export function predictTideSeries(
  station: TideStation,
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 6
): TidePrediction[] {
  const series: TidePrediction[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += intervalMs) {
    const date = new Date(t);
    series.push({
      time: date,
      height: predictTide(station, date),
    });
  }

  return series;
}

/**
 * Find high and low tides in a prediction series
 */
export interface TideExtreme {
  time: Date;
  height: number;
  type: 'high' | 'low';
}

export function findExtremes(series: TidePrediction[]): TideExtreme[] {
  if (series.length < 3) return [];

  const extremes: TideExtreme[] = [];

  for (let i = 1; i < series.length - 1; i++) {
    const prevItem = series[i - 1];
    const currItem = series[i];
    const nextItem = series[i + 1];

    if (!prevItem || !currItem || !nextItem) continue;

    const prev = prevItem.height;
    const curr = currItem.height;
    const next = nextItem.height;

    if (curr > prev && curr > next) {
      extremes.push({
        time: currItem.time,
        height: curr,
        type: 'high',
      });
    } else if (curr < prev && curr < next) {
      extremes.push({
        time: currItem.time,
        height: curr,
        type: 'low',
      });
    }
  }

  return extremes;
}

/**
 * Calculate spring/neap tide indicator
 * Returns a value from -1 (neap) to +1 (spring)
 * based on the relative phase of M2 and S2
 */
export function getSpringNeapIndicator(date: Date): number {
  const astro = getAstronomicalParameters(date);

  // M2 and S2 constituents
  const m2 = CONSTITUENTS.M2;
  const s2 = CONSTITUENTS.S2;

  if (!m2 || !s2) return 0;

  const V0_M2 = calculateV0(m2.doodson, astro);
  const V0_S2 = calculateV0(s2.doodson, astro);

  // The phase difference determines spring/neap
  // When M2 and S2 are in phase: spring tide
  // When 90° out of phase: neap tide
  const phaseDiff = normalizeAngle(V0_M2 - V0_S2);

  // Convert to -1 to +1 scale
  // 0° or 180° = spring (+1)
  // 90° or 270° = neap (-1)
  return Math.cos((phaseDiff * 2 * Math.PI) / 180);
}

/**
 * Calculate lunar phase (0-1 where 0=new, 0.5=full)
 * Useful for visualization correlation with tides
 */
export function getLunarPhase(date: Date): number {
  const astro = getAstronomicalParameters(date);

  // Lunar elongation (angle between Sun and Moon)
  const elongation = normalizeAngle(astro.s - astro.h);

  // Convert to 0-1 phase
  return elongation / 360;
}

/**
 * Get current tidal range based on spring/neap cycle
 * Returns { min, max } expected heights relative to mean
 */
export function getTidalRange(
  station: TideStation,
  date: Date
): { minHeight: number; maxHeight: number } {
  // Calculate predictions over 25 hours to capture at least one full tidal cycle
  const start = new Date(date.getTime() - 12.5 * 3600000);
  const end = new Date(date.getTime() + 12.5 * 3600000);
  const series = predictTideSeries(station, start, end, 10);

  let min = Infinity;
  let max = -Infinity;

  for (const p of series) {
    if (p.height < min) min = p.height;
    if (p.height > max) max = p.height;
  }

  return { minHeight: min, maxHeight: max };
}

/**
 * Predict tide height from a subset of constituents
 * Useful for showing individual constituent contributions
 */
export function predictTideFromConstituents(
  station: TideStation,
  date: Date,
  constituentSymbols: string[]
): number {
  const astro = getAstronomicalParameters(date);
  let height = 0;

  for (const c of station.constituents) {
    if (!constituentSymbols.includes(c.symbol)) continue;

    const constituent = CONSTITUENTS[c.symbol];
    if (!constituent) continue;

    const { f, u } = getNodalFactors(c.symbol, astro.N);
    const V0 = calculateV0(constituent.doodson, astro);
    const phase = normalizeAngle(V0 + u - c.phase);
    const phaseRad = (phase * Math.PI) / 180;

    height += f * c.amplitude * Math.cos(phaseRad);
  }

  return height;
}

/**
 * Generate constituent-layered time series
 * Returns series for each major constituent group plus total
 */
export interface ConstituentSeriesData {
  time: number;
  label: string;
  total: number;
  M2?: number;
  S2?: number;
  K1?: number;
  O1?: number;
  semidiurnal?: number;
  diurnal?: number;
}

export function predictTideSeriesWithConstituents(
  station: TideStation,
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 6
): ConstituentSeriesData[] {
  const series: ConstituentSeriesData[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  // Constituent groups
  const semidiurnalSymbols = ['M2', 'S2', 'N2', 'K2', 'NU2', 'MU2', '2N2', 'L2', 'T2', 'R2', 'LAM2'];
  const diurnalSymbols = ['K1', 'O1', 'P1', 'Q1', 'J1', 'M1', 'OO1', 'S1', 'RHO1', '2Q1'];

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += intervalMs) {
    const date = new Date(t);

    const dataPoint: ConstituentSeriesData = {
      time: t,
      label: `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`,
      total: predictTide(station, date),
    };

    // Individual major constituents
    const hasM2 = station.constituents.some(c => c.symbol === 'M2');
    const hasS2 = station.constituents.some(c => c.symbol === 'S2');
    const hasK1 = station.constituents.some(c => c.symbol === 'K1');
    const hasO1 = station.constituents.some(c => c.symbol === 'O1');

    if (hasM2) dataPoint.M2 = predictTideFromConstituents(station, date, ['M2']);
    if (hasS2) dataPoint.S2 = predictTideFromConstituents(station, date, ['S2']);
    if (hasK1) dataPoint.K1 = predictTideFromConstituents(station, date, ['K1']);
    if (hasO1) dataPoint.O1 = predictTideFromConstituents(station, date, ['O1']);

    // Groups
    dataPoint.semidiurnal = predictTideFromConstituents(station, date, semidiurnalSymbols);
    dataPoint.diurnal = predictTideFromConstituents(station, date, diurnalSymbols);

    series.push(dataPoint);
  }

  return series;
}
