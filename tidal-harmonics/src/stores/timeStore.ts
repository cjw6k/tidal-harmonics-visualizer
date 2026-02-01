import { create } from 'zustand';

interface TimeState {
  epoch: number;
  speed: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setSpeed: (speed: number) => void;
  setDate: (date: Date) => void;
  resetToNow: () => void;
  tick: (deltaMs: number) => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  epoch: Date.now(),
  speed: 1,
  playing: false,

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  toggle: () => set((state) => ({ playing: !state.playing })),

  setSpeed: (speed) => set({ speed }),

  setDate: (date) => set({ epoch: date.getTime() }),

  resetToNow: () => set({ epoch: Date.now(), playing: false }),

  tick: (deltaMs) =>
    set((state) => ({
      epoch: state.epoch + deltaMs * state.speed,
    })),
}));
