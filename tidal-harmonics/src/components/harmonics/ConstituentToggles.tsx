import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: 'bg-blue-500',
  diurnal: 'bg-green-500',
  'long-period': 'bg-orange-500',
  'shallow-water': 'bg-purple-500',
};

export function ConstituentToggles() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const visible = useHarmonicsStore((s) => s.visibleConstituents);
  const toggle = useHarmonicsStore((s) => s.toggleConstituent);
  const setAll = useHarmonicsStore((s) => s.setAllConstituentsVisible);

  if (!station) return null;

  const allSymbols = station.constituents.map((c) => c.symbol);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
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
      <div className="flex flex-wrap gap-1">
        {station.constituents.map((c) => {
          const constituent = CONSTITUENTS[c.symbol];
          const isVisible = visible.includes(c.symbol);
          const colorClass = FAMILY_COLORS[constituent?.family || 'semidiurnal'];

          return (
            <button
              key={c.symbol}
              onClick={() => toggle(c.symbol)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors
                ${isVisible ? colorClass + ' text-white' : 'bg-slate-700 text-slate-400'}
                hover:opacity-80`}
              title={`${constituent?.name || c.symbol}: ${c.amplitude.toFixed(3)}m`}
            >
              {c.symbol}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {visible.length} of {station.constituents.length} visible
      </div>
    </div>
  );
}
