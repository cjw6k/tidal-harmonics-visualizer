import * as Astronomy from 'astronomy-engine';

export interface CelestialPosition {
  x: number;
  y: number;
  z: number;
  distance: number; // km from Earth
}

const AU_TO_KM = 149_597_870.7;

export function getBodyPosition(
  body: Astronomy.Body,
  date: Date
): CelestialPosition {
  const time = Astronomy.MakeTime(date);
  const vec = Astronomy.GeoVector(body, time, true);

  return {
    x: vec.x * AU_TO_KM,
    y: vec.y * AU_TO_KM,
    z: vec.z * AU_TO_KM,
    distance: Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2) * AU_TO_KM,
  };
}

export function getMoonPosition(date: Date): CelestialPosition {
  return getBodyPosition(Astronomy.Body.Moon, date);
}

export function getSunPosition(date: Date): CelestialPosition {
  return getBodyPosition(Astronomy.Body.Sun, date);
}

export { Astronomy };
