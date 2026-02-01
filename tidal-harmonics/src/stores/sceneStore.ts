import { create } from 'zustand';
import type { ScaleMode } from '@/types';

interface SceneState {
  scaleMode: ScaleMode;
  showOrbits: boolean;
  showLabels: boolean;
  // Tidal visualization
  showTidalBulge: boolean;
  tidalExaggeration: number;
  showForceVectors: boolean;
  forceVectorCount: number;
  // Actions
  setScaleMode: (mode: ScaleMode) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleTidalBulge: () => void;
  setTidalExaggeration: (factor: number) => void;
  toggleForceVectors: () => void;
  setForceVectorCount: (count: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scaleMode: 'exaggerated',
  showOrbits: true,
  showLabels: true,
  // Tidal visualization defaults
  showTidalBulge: true,
  tidalExaggeration: 10000, // Educational mode: 10,000x
  showForceVectors: false,
  forceVectorCount: 32,

  setScaleMode: (mode) => set({ scaleMode: mode }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleTidalBulge: () => set((state) => ({ showTidalBulge: !state.showTidalBulge })),
  setTidalExaggeration: (factor) => set({ tidalExaggeration: factor }),
  toggleForceVectors: () => set((state) => ({ showForceVectors: !state.showForceVectors })),
  setForceVectorCount: (count) => set({ forceVectorCount: count }),
}));
