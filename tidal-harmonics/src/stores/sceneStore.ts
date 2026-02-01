import { create } from 'zustand';
import type { ScaleMode } from '@/types';

interface SceneState {
  scaleMode: ScaleMode;
  showOrbits: boolean;
  showLabels: boolean;
  setScaleMode: (mode: ScaleMode) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scaleMode: 'exaggerated',
  showOrbits: true,
  showLabels: true,

  setScaleMode: (mode) => set({ scaleMode: mode }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
}));
