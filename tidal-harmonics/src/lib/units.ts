/**
 * Unit conversion utilities for tidal measurements
 */

import type { UnitSystem } from '@/stores/harmonicsStore';

const METERS_TO_FEET = 3.28084;
const FEET_TO_METERS = 1 / METERS_TO_FEET;

/**
 * Convert meters to the target unit system
 */
export function convertHeight(meters: number, system: UnitSystem): number {
  return system === 'imperial' ? meters * METERS_TO_FEET : meters;
}

/**
 * Convert from the source unit system to meters
 */
export function toMeters(value: number, system: UnitSystem): number {
  return system === 'imperial' ? value * FEET_TO_METERS : value;
}

/**
 * Format a height value with appropriate precision and units
 */
export function formatHeight(
  meters: number,
  system: UnitSystem,
  options: {
    precision?: number;
    showUnit?: boolean;
    unitStyle?: 'short' | 'long';
  } = {}
): string {
  const { precision = 2, showUnit = true, unitStyle = 'short' } = options;

  const value = convertHeight(meters, system);
  const formatted = value.toFixed(precision);

  if (!showUnit) return formatted;

  const units = {
    metric: { short: 'm', long: 'meters' },
    imperial: { short: 'ft', long: 'feet' },
  };

  return `${formatted} ${units[system][unitStyle]}`;
}

/**
 * Format a height value in centimeters or inches
 */
export function formatSmallHeight(
  meters: number,
  system: UnitSystem,
  options: { precision?: number; showUnit?: boolean } = {}
): string {
  const { precision = 1, showUnit = true } = options;

  if (system === 'imperial') {
    const inches = meters * 39.3701;
    return showUnit ? `${inches.toFixed(precision)} in` : inches.toFixed(precision);
  } else {
    const cm = meters * 100;
    return showUnit ? `${cm.toFixed(precision)} cm` : cm.toFixed(precision);
  }
}

/**
 * Get the height unit label for the current system
 */
export function getHeightUnit(system: UnitSystem, style: 'short' | 'long' = 'short'): string {
  const units = {
    metric: { short: 'm', long: 'meters' },
    imperial: { short: 'ft', long: 'feet' },
  };
  return units[system][style];
}

/**
 * Get the small height unit label (cm/in)
 */
export function getSmallHeightUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'in' : 'cm';
}
