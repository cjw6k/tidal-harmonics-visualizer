import { create } from 'zustand';
import type { TideStation } from '@/types/harmonics';
import { STATIONS } from '@/data/stations';
import { MAJOR_CONSTITUENTS } from '@/data/constituents';

interface HarmonicsState {
  stations: TideStation[];
  selectedStation: TideStation | null;
  visibleConstituents: string[];
  chartHoursRange: number;
  showPhasorDiagram: boolean;
  showTideCurve: boolean;

  selectStation: (id: string) => void;
  toggleConstituent: (symbol: string) => void;
  setAllConstituentsVisible: (symbols: string[]) => void;
  setChartHoursRange: (hours: number) => void;
  togglePhasorDiagram: () => void;
  toggleTideCurve: () => void;
}

export const useHarmonicsStore = create<HarmonicsState>((set, get) => ({
  stations: STATIONS,
  selectedStation: STATIONS[0] || null,
  visibleConstituents: [...MAJOR_CONSTITUENTS].slice(0, 6), // Default visible
  chartHoursRange: 24,
  showPhasorDiagram: true,
  showTideCurve: true,

  selectStation: (id) => {
    const station = get().stations.find((s) => s.id === id);
    if (station) set({ selectedStation: station });
  },

  toggleConstituent: (symbol) => {
    const visible = get().visibleConstituents;
    if (visible.includes(symbol)) {
      set({ visibleConstituents: visible.filter((s) => s !== symbol) });
    } else {
      set({ visibleConstituents: [...visible, symbol] });
    }
  },

  setAllConstituentsVisible: (symbols) => {
    set({ visibleConstituents: symbols });
  },

  setChartHoursRange: (hours) => {
    set({ chartHoursRange: hours });
  },

  togglePhasorDiagram: () => {
    set((state) => ({ showPhasorDiagram: !state.showPhasorDiagram }));
  },

  toggleTideCurve: () => {
    set((state) => ({ showTideCurve: !state.showTideCurve }));
  },
}));
