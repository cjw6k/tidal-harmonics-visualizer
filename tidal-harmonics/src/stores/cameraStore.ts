import { create } from 'zustand';
import type { CameraPreset, CameraTarget } from '@/types';

interface CameraState {
  preset: CameraPreset;
  isTransitioning: boolean;
  presets: Record<CameraPreset, CameraTarget>;
  setPreset: (preset: CameraPreset) => void;
  setTransitioning: (transitioning: boolean) => void;
}

const CAMERA_PRESETS: Record<CameraPreset, CameraTarget> = {
  overview: {
    position: [50, 30, 50],
    target: [0, 0, 0],
    fov: 60,
  },
  earth: {
    position: [0, 0, 8],
    target: [0, 0, 0],
    fov: 45,
  },
  moon: {
    position: [35, 5, 5],
    target: [30, 0, 0],
    fov: 45,
  },
  sun: {
    position: [-188, 10, 10],
    target: [-200, 0, 0],
    fov: 45,
  },
};

export const useCameraStore = create<CameraState>((set) => ({
  preset: 'overview',
  isTransitioning: false,
  presets: CAMERA_PRESETS,

  setPreset: (preset) =>
    set({
      preset,
      isTransitioning: true,
    }),

  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}));
