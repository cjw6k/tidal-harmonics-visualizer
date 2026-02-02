import { create } from 'zustand';
import type { CameraPreset } from '@/types';

// Camera offset from target body (not absolute position)
interface CameraPresetConfig {
  offset: [number, number, number]; // Offset from the target body
  fov: number;
}

interface CameraState {
  preset: CameraPreset;
  isTransitioning: boolean;
  setPreset: (preset: CameraPreset) => void;
  setTransitioning: (transitioning: boolean) => void;
}

// Offsets are relative to the target body's position
export const CAMERA_PRESET_CONFIGS: Record<CameraPreset, CameraPresetConfig> = {
  overview: {
    offset: [50, 30, 50], // Offset from Earth (origin)
    fov: 60,
  },
  earth: {
    offset: [0, 3, 8], // Close orbit around Earth
    fov: 45,
  },
  moon: {
    offset: [3, 2, 5], // Offset from Moon's current position
    fov: 45,
  },
  sun: {
    offset: [12, 8, 12], // Offset from Sun's current position
    fov: 45,
  },
};

export const useCameraStore = create<CameraState>((set) => ({
  preset: 'overview',
  isTransitioning: false,

  setPreset: (preset) =>
    set({
      preset,
      isTransitioning: true,
    }),

  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}));
