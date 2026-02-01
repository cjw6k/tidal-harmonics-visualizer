import { JULIAN } from './constants';

/**
 * Convert Unix timestamp (ms) to Julian Date
 */
export function unixToJulian(unixMs: number): number {
  return unixMs / JULIAN.MS_PER_DAY + JULIAN.UNIX_EPOCH_JD;
}

/**
 * Convert Julian Date to Unix timestamp (ms)
 */
export function julianToUnix(jd: number): number {
  return (jd - JULIAN.UNIX_EPOCH_JD) * JULIAN.MS_PER_DAY;
}

/**
 * Get Julian centuries from J2000.0 epoch
 * Used for planetary position calculations
 */
export function julianCenturies(jd: number): number {
  return (jd - JULIAN.J2000_EPOCH_JD) / JULIAN.DAYS_PER_CENTURY;
}

/**
 * Convert Date object to Julian Date
 */
export function dateToJulian(date: Date): number {
  return unixToJulian(date.getTime());
}

/**
 * Convert Julian Date to Date object
 */
export function julianToDate(jd: number): Date {
  return new Date(julianToUnix(jd));
}
