export type CameraPreset = 'overview' | 'earth' | 'moon' | 'sun';

export type ScaleMode = 'realistic' | 'exaggerated';

export interface CameraTarget {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface CelestialBodyProps {
  name: string;
  radius: number;
  position: [number, number, number];
  textureUrl: string;
  emissive?: boolean;
  emissiveIntensity?: number;
  rotationSpeed?: number;
}

export const SPEED_PRESETS = [
  { label: '1x', value: 1 },
  { label: '1 min/s', value: 60 },
  { label: '1 hr/s', value: 3600 },
  { label: '1 day/s', value: 86400 },
  { label: '1 week/s', value: 604800 },
] as const;

export type SpeedPreset = (typeof SPEED_PRESETS)[number];
