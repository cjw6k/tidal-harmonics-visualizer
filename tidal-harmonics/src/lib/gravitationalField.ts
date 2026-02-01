import { Vector3 } from 'three';

const G = 6.674e-11; // N·m²/kg²
const M_MOON = 7.342e22; // kg
const M_SUN = 1.989e30; // kg

export interface ForceVector {
  position: Vector3;
  direction: Vector3;
  magnitude: number;
}

export function calculateTidalForce(
  surfacePoint: Vector3, // Position on Earth surface (km)
  moonPos: Vector3, // Moon position (km)
  sunPos: Vector3 // Sun position (km)
): ForceVector {
  // Convert to meters for physics
  const pMeters = surfacePoint.clone().multiplyScalar(1000);
  const moonMeters = moonPos.clone().multiplyScalar(1000);
  const sunMeters = sunPos.clone().multiplyScalar(1000);
  const earthCenter = new Vector3(0, 0, 0);

  // Moon tidal force
  const toMoonFromPoint = moonMeters.clone().sub(pMeters);
  const toMoonFromCenter = moonMeters.clone().sub(earthCenter);

  const moonDistPoint = toMoonFromPoint.length();
  const moonDistCenter = toMoonFromCenter.length();

  const moonForcePoint = toMoonFromPoint
    .clone()
    .normalize()
    .multiplyScalar((G * M_MOON) / (moonDistPoint * moonDistPoint));
  const moonForceCenter = toMoonFromCenter
    .clone()
    .normalize()
    .multiplyScalar((G * M_MOON) / (moonDistCenter * moonDistCenter));

  const moonTidal = moonForcePoint.clone().sub(moonForceCenter);

  // Sun tidal force
  const toSunFromPoint = sunMeters.clone().sub(pMeters);
  const toSunFromCenter = sunMeters.clone().sub(earthCenter);

  const sunDistPoint = toSunFromPoint.length();
  const sunDistCenter = toSunFromCenter.length();

  const sunForcePoint = toSunFromPoint
    .clone()
    .normalize()
    .multiplyScalar((G * M_SUN) / (sunDistPoint * sunDistPoint));
  const sunForceCenter = toSunFromCenter
    .clone()
    .normalize()
    .multiplyScalar((G * M_SUN) / (sunDistCenter * sunDistCenter));

  const sunTidal = sunForcePoint.clone().sub(sunForceCenter);

  // Combined
  const total = moonTidal.add(sunTidal);

  return {
    position: surfacePoint,
    direction: total.clone().normalize(),
    magnitude: total.length(),
  };
}
