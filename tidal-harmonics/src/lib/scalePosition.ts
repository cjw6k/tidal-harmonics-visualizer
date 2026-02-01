import type { CelestialPosition } from './ephemeris';
import type { ScaleMode } from '@/types';
import { EXAGGERATED_SCALE } from './constants';

export function scalePosition(
  pos: CelestialPosition,
  scaleMode: ScaleMode
): [number, number, number] {
  if (scaleMode === 'realistic') {
    // 1 unit = 10,000 km
    return [pos.x / 10000, pos.y / 10000, pos.z / 10000];
  } else {
    // Exaggerated: normalize to fixed distances for pedagogical clarity
    const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    const normalizedDistance =
      distance > 1_000_000
        ? EXAGGERATED_SCALE.SUN_DISTANCE // Sun
        : EXAGGERATED_SCALE.MOON_DISTANCE; // Moon

    const factor = normalizedDistance / (distance / 10000);
    return [
      (pos.x / 10000) * factor,
      (pos.y / 10000) * factor,
      (pos.z / 10000) * factor,
    ];
  }
}
