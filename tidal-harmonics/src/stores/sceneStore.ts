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
  // Tutorial highlights
  highlightMoon: boolean;
  highlightSun: boolean;
  highlightEarth: boolean;
  pulseEffect: boolean;
  // Actions
  setScaleMode: (mode: ScaleMode) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleTidalBulge: () => void;
  setTidalExaggeration: (factor: number) => void;
  toggleForceVectors: () => void;
  setForceVectorCount: (count: number) => void;
  setHighlightMoon: (value: boolean) => void;
  setHighlightSun: (value: boolean) => void;
  setHighlightEarth: (value: boolean) => void;
  setPulseEffect: (value: boolean) => void;
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
  // Tutorial highlights
  highlightMoon: false,
  highlightSun: false,
  highlightEarth: false,
  pulseEffect: false,

  setScaleMode: (mode) => set({ scaleMode: mode }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleTidalBulge: () => set((state) => ({ showTidalBulge: !state.showTidalBulge })),
  setTidalExaggeration: (factor) => set({ tidalExaggeration: factor }),
  toggleForceVectors: () => set((state) => ({ showForceVectors: !state.showForceVectors })),
  setForceVectorCount: (count) => set({ forceVectorCount: count }),
  setHighlightMoon: (value) => set({ highlightMoon: value }),
  setHighlightSun: (value) => set({ highlightSun: value }),
  setHighlightEarth: (value) => set({ highlightEarth: value }),
  setPulseEffect: (value) => set({ pulseEffect: value }),
}));
