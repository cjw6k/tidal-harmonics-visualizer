import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import type { ConstituentFamily } from '@/types/harmonics';

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: 'bg-blue-500',
  diurnal: 'bg-green-500',
  'long-period': 'bg-orange-500',
  'shallow-water': 'bg-purple-500',
};

const FAMILY_INFO: Record<ConstituentFamily, { label: string; abbr: string }> = {
  'semidiurnal': { label: 'Semidiurnal (~12h)', abbr: 'Semi' },
  'diurnal': { label: 'Diurnal (~24h)', abbr: 'Di' },
  'long-period': { label: 'Long-Period (days+)', abbr: 'Long' },
  'shallow-water': { label: 'Shallow-Water', abbr: 'SW' },
};

export function ConstituentToggles() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const visible = useHarmonicsStore((s) => s.visibleConstituents);
  const toggle = useHarmonicsStore((s) => s.toggleConstituent);
  const setAll = useHarmonicsStore((s) => s.setAllConstituentsVisible);

  if (!station) return null;

  const allSymbols = station.constituents.map((c) => c.symbol);

  // Group constituents by family
  const byFamily: Record<string, typeof station.constituents> = {};
  for (const c of station.constituents) {
    const constituent = CONSTITUENTS[c.symbol];
    const family = constituent?.family || 'semidiurnal';
    if (!byFamily[family]) byFamily[family] = [];
    byFamily[family].push(c);
  }

  // Get family symbols for quick select
  const getFamilySymbols = (family: string): string[] => {
    return (byFamily[family] || []).map(c => c.symbol);
  };

  // Check if entire family is visible
  const isFamilyVisible = (family: string): boolean => {
    const symbols = getFamilySymbols(family);
    return symbols.length > 0 && symbols.every(s => visible.includes(s));
  };

  // Toggle entire family
  const toggleFamily = (family: string) => {
    const symbols = getFamilySymbols(family);
    if (isFamilyVisible(family)) {
      // Remove all from this family
      setAll(visible.filter(s => !symbols.includes(s)));
    } else {
      // Add all from this family
      const newVisible = [...new Set([...visible, ...symbols])];
      setAll(newVisible);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      {/* Header with All/None */}
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs text-slate-400">Constituents</label>
        <div className="flex gap-1">
          <button
            onClick={() => setAll(allSymbols)}
            className="text-xs text-blue-400 hover:text-blue-300 px-1"
          >
            All
          </button>
          <button
            onClick={() => setAll([])}
            className="text-xs text-slate-400 hover:text-slate-300 px-1"
          >
            None
          </button>
        </div>
      </div>

      {/* Family quick-filters */}
      <div className="flex gap-1 mb-2" role="group" aria-label="Toggle constituent families">
        {Object.entries(FAMILY_INFO).map(([family, info]) => {
          if (!byFamily[family] || byFamily[family].length === 0) return null;
          const isActive = isFamilyVisible(family);
          return (
            <button
              key={family}
              onClick={() => toggleFamily(family)}
              aria-pressed={isActive}
              aria-label={`${info.label} constituents`}
              className={`px-2 py-0.5 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                isActive
                  ? FAMILY_COLORS[family] + ' text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title={`${isActive ? 'Hide' : 'Show'} ${info.label}`}
            >
              {info.abbr}
            </button>
          );
        })}
      </div>

      {/* Individual constituent toggles */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Individual constituent toggles">
        {station.constituents.map((c) => {
          const constituent = CONSTITUENTS[c.symbol];
          const isVisible = visible.includes(c.symbol);
          const colorClass = FAMILY_COLORS[constituent?.family || 'semidiurnal'];

          return (
            <button
              key={c.symbol}
              onClick={() => toggle(c.symbol)}
              aria-pressed={isVisible}
              aria-label={`${constituent?.name || c.symbol} constituent, ${c.amplitude.toFixed(3)} meters amplitude`}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900
                ${isVisible ? colorClass + ' text-white' : 'bg-slate-700 text-slate-400'}
                hover:opacity-80`}
              title={`${constituent?.name || c.symbol}: ${c.amplitude.toFixed(3)}m (${constituent?.family || 'unknown'})`}
            >
              {c.symbol}
            </button>
          );
        })}
      </div>

      {/* Footer with count and legend */}
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{visible.length} of {station.constituents.length} visible</span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-blue-500" />Semi
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-green-500" />Di
          </span>
        </div>
      </div>
    </div>
  );
}
