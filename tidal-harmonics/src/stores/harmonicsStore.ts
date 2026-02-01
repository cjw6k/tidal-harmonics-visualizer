import { create } from 'zustand';
import type { TideStation } from '@/types/harmonics';
import { STATIONS } from '@/data/stations';
import { MAJOR_CONSTITUENTS } from '@/data/constituents';

export type UnitSystem = 'metric' | 'imperial';

// Load favorites from localStorage
function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem('tidal-harmonics-favorites');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

// Save favorites to localStorage
function saveFavorites(favorites: string[]) {
  try {
    localStorage.setItem('tidal-harmonics-favorites', JSON.stringify(favorites));
  } catch {
    // Ignore localStorage errors
  }
}

interface HarmonicsState {
  stations: TideStation[];
  selectedStation: TideStation | null;
  visibleConstituents: string[];
  chartHoursRange: number;
  showPhasorDiagram: boolean;
  showTideCurve: boolean;
  unitSystem: UnitSystem;
  favoriteStations: string[];

  selectStation: (id: string) => void;
  toggleConstituent: (symbol: string) => void;
  setAllConstituentsVisible: (symbols: string[]) => void;
  setChartHoursRange: (hours: number) => void;
  togglePhasorDiagram: () => void;
  toggleTideCurve: () => void;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useHarmonicsStore = create<HarmonicsState>((set, get) => ({
  stations: STATIONS,
  selectedStation: STATIONS[0] || null,
  visibleConstituents: [...MAJOR_CONSTITUENTS].slice(0, 6), // Default visible
  chartHoursRange: 24,
  showPhasorDiagram: true,
  showTideCurve: true,
  unitSystem: 'metric',
  favoriteStations: loadFavorites(),

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

  setUnitSystem: (system) => {
    set({ unitSystem: system });
  },

  toggleUnitSystem: () => {
    set((state) => ({
      unitSystem: state.unitSystem === 'metric' ? 'imperial' : 'metric',
    }));
  },

  toggleFavorite: (id) => {
    const favorites = get().favoriteStations;
    const newFavorites = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    saveFavorites(newFavorites);
    set({ favoriteStations: newFavorites });
  },

  isFavorite: (id) => {
    return get().favoriteStations.includes(id);
  },
}));
