// Astronomical parameters for tidal calculations
// Based on NOAA/NOS methodology

import { JULIAN } from './constants';

export interface AstronomicalParameters {
  T: number; // Hour angle (degrees)
  s: number; // Mean longitude of Moon (degrees)
  h: number; // Mean longitude of Sun (degrees)
  p: number; // Longitude of lunar perigee (degrees)
  N: number; // Longitude of lunar ascending node (degrees)
  pp: number; // Longitude of solar perigee (degrees)
}

/**
 * Calculate Julian centuries from J2000.0
 */
export function getJulianCenturies(date: Date): number {
  const jd =
    date.getTime() / JULIAN.MS_PER_DAY + JULIAN.UNIX_EPOCH_JD;
  return (jd - JULIAN.J2000_EPOCH_JD) / JULIAN.DAYS_PER_CENTURY;
}

/**
 * Calculate Julian day from Date
 */
export function getJulianDay(date: Date): number {
  return date.getTime() / JULIAN.MS_PER_DAY + JULIAN.UNIX_EPOCH_JD;
}

/**
 * Get hours since midnight UTC for a date
 */
export function getHoursInDay(date: Date): number {
  return (
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000
  );
}

/**
 * Calculate astronomical parameters at a given date
 * These are used to compute the equilibrium argument V0 for each constituent
 *
 * Formulas from Schureman (1958) and NOAA
 */
export function getAstronomicalParameters(date: Date): AstronomicalParameters {
  const T = getJulianCenturies(date);
  const T2 = T * T;
  const T3 = T2 * T;

  // Hour angle at Greenwich (degrees) - based on time of day
  const hourAngle = getHoursInDay(date) * 15; // 15 degrees per hour

  // Mean longitude of Moon (s) - degrees
  // Measured from mean vernal equinox along ecliptic to mean ascending node
  // then along orbit to Moon
  const s = normalizeAngle(
    218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841
  );

  // Mean longitude of Sun (h) - degrees
  // Essentially the mean position of the Sun
  const h = normalizeAngle(
    280.4664567 +
      360007.6982779 * T +
      0.03032028 * T2 +
      T3 / 49931 -
      T2 * T2 / 15300
  );

  // Longitude of lunar perigee (p) - degrees
  // The point in Moon's orbit closest to Earth
  const p = normalizeAngle(
    83.3532465 + 4069.0137287 * T - 0.0103200 * T2 - T3 / 80053
  );

  // Longitude of lunar ascending node (N) - degrees
  // Retrograde motion (decreasing)
  const N = normalizeAngle(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T2 + T3 / 467441
  );

  // Longitude of solar perigee (pp) - degrees
  // Perihelion of Earth's orbit
  const pp = normalizeAngle(282.9373 + 1.7195 * T);

  return {
    T: hourAngle,
    s,
    h,
    p,
    N,
    pp,
  };
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate the equilibrium argument V0 for a constituent
 * V0 = sum of (Doodson number × corresponding astronomical argument)
 *
 * The Doodson numbers weight how each astronomical cycle contributes
 * to the constituent's phase
 */
export function calculateV0(
  doodson: [number, number, number, number, number, number],
  astro: AstronomicalParameters
): number {
  const v0 =
    doodson[0] * astro.T +
    doodson[1] * astro.s +
    doodson[2] * astro.h +
    doodson[3] * astro.p +
    doodson[4] * astro.N +
    doodson[5] * astro.pp;

  return normalizeAngle(v0);
}

/**
 * Nodal factors f and u
 *
 * These correct for the 18.6-year lunar nodal cycle
 * f is the amplitude factor (multiplier)
 * u is the phase correction (degrees)
 *
 * Simplified implementation - for educational purposes
 * Full implementation would need constituent-specific formulas
 */
export function getNodalFactors(
  symbol: string,
  N: number
): { f: number; u: number } {
  // Convert N to radians
  const Nrad = (N * Math.PI) / 180;
  const sinN = Math.sin(Nrad);
  const cosN = Math.cos(Nrad);
  const sin2N = Math.sin(2 * Nrad);
  const cos2N = Math.cos(2 * Nrad);

  // Commonly used intermediate values
  const w = Math.sqrt(
    (1 - 0.2505 * cos2N - 0.1102 * cosN) ** 2 +
      (0.2505 * sin2N + 0.1102 * sinN) ** 2
  );

  // Constituent-specific factors
  // These are simplified approximations
  switch (symbol) {
    case 'M2':
    case 'N2':
    case '2N2':
    case 'MU2':
    case 'NU2':
    case 'L2':
    case 'LAM2':
      return {
        f:
          1.0 -
          0.037 * cosN,
        u: -2.1 * sinN,
      };

    case 'S2':
    case 'T2':
    case 'R2':
      // Solar constituents have no nodal modulation
      return { f: 1.0, u: 0 };

    case 'K2':
      return {
        f: 1.024 + 0.286 * cosN,
        u: -17.74 * sinN,
      };

    case 'K1':
      return {
        f: 1.006 + 0.115 * cosN,
        u: -8.86 * sinN,
      };

    case 'O1':
    case 'Q1':
    case '2Q1':
    case 'RHO1':
      return {
        f: 1.009 + 0.187 * cosN,
        u: 10.8 * sinN,
      };

    case 'P1':
    case 'S1':
      // Solar diurnal - no nodal modulation
      return { f: 1.0, u: 0 };

    case 'J1':
    case 'OO1':
      return {
        f: 1.024 + 0.286 * cosN,
        u: -17.74 * sinN,
      };

    case 'M1':
      return {
        f: w,
        u: 0,
      };

    case 'Mf':
      return {
        f: 1.043 + 0.414 * cosN,
        u: -23.7 * sinN,
      };

    case 'Mm':
      return {
        f: 1.0 - 0.13 * cosN,
        u: 0,
      };

    case 'Ssa':
    case 'Sa':
    case 'MSf':
      return { f: 1.0, u: 0 };

    case 'M4':
    case 'MN4':
      return {
        f: (1.0 - 0.037 * cosN) ** 2,
        u: -4.2 * sinN,
      };

    case 'MS4':
      return {
        f: 1.0 - 0.037 * cosN,
        u: -2.1 * sinN,
      };

    case 'M6':
      return {
        f: (1.0 - 0.037 * cosN) ** 3,
        u: -6.3 * sinN,
      };

    case 'S4':
    case 'S6':
      return { f: 1.0, u: 0 };

    case 'MK3':
      return {
        f: (1.0 - 0.037 * cosN) * (1.006 + 0.115 * cosN),
        u: -2.1 * sinN - 8.86 * sinN,
      };

    case '2MK3':
      return {
        f: (1.0 - 0.037 * cosN) ** 2 * (1.006 + 0.115 * cosN),
        u: -4.2 * sinN + 8.86 * sinN,
      };

    case 'M8':
      return {
        f: (1.0 - 0.037 * cosN) ** 4,
        u: -8.4 * sinN,
      };

    default:
      // Default: no nodal correction
      return { f: 1.0, u: 0 };
  }
}
