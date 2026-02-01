import { create } from 'zustand';
import type { ScaleMode } from '@/types';

interface SceneState {
  scaleMode: ScaleMode;
  showOrbits: boolean;
  showLabels: boolean;
  showPlanets: boolean;
  showStarfield: boolean;
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
  togglePlanets: () => void;
  toggleStarfield: () => void;
  toggleTidalBulge: () => void;
  setShowTidalBulge: (value: boolean) => void;
  setTidalExaggeration: (factor: number) => void;
  toggleForceVectors: () => void;
  setShowForceVectors: (value: boolean) => void;
  setForceVectorCount: (count: number) => void;
  setShowOrbits: (value: boolean) => void;
  setHighlightMoon: (value: boolean) => void;
  setHighlightSun: (value: boolean) => void;
  setHighlightEarth: (value: boolean) => void;
  setPulseEffect: (value: boolean) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scaleMode: 'exaggerated',
  showOrbits: true,
  showLabels: true,
  showPlanets: false,
  showStarfield: false, // Press 'S' to enable subtle starfield
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
  togglePlanets: () => set((state) => ({ showPlanets: !state.showPlanets })),
  toggleStarfield: () => set((state) => ({ showStarfield: !state.showStarfield })),
  toggleTidalBulge: () => set((state) => ({ showTidalBulge: !state.showTidalBulge })),
  setShowTidalBulge: (value) => set({ showTidalBulge: value }),
  setTidalExaggeration: (factor) => set({ tidalExaggeration: factor }),
  toggleForceVectors: () => set((state) => ({ showForceVectors: !state.showForceVectors })),
  setShowForceVectors: (value) => set({ showForceVectors: value }),
  setForceVectorCount: (count) => set({ forceVectorCount: count }),
  setShowOrbits: (value) => set({ showOrbits: value }),
  setHighlightMoon: (value) => set({ highlightMoon: value }),
  setHighlightSun: (value) => set({ highlightSun: value }),
  setHighlightEarth: (value) => set({ highlightEarth: value }),
  setPulseEffect: (value) => set({ pulseEffect: value }),
}));
