import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';

type SortField = 'symbol' | 'amplitude' | 'phase' | 'speed' | 'period' | 'family';
type SortDirection = 'asc' | 'desc';

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: '#3b82f6',
  diurnal: '#22c55e',
  'long-period': '#f59e0b',
  'shallow-water': '#a855f7',
};

const FAMILY_SHORT: Record<string, string> = {
  semidiurnal: 'Semi',
  diurnal: 'Di',
  'long-period': 'Long',
  'shallow-water': 'SW',
};

interface ConstituentRow {
  symbol: string;
  name: string;
  amplitude: number;
  phase: number;
  speed: number;
  period: number;
  family: string;
  doodson: number[];
  description: string;
}

/**
 * ConstituentTable
 *
 * Comprehensive sortable table of all tidal constituents at the selected station.
 * Shows symbol, name, amplitude, phase, speed, period, and family.
 * Click column headers to sort. Click rows for details.
 */
export function ConstituentTable() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [sortField, setSortField] = useState<SortField>('amplitude');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const tableData = useMemo(() => {
    if (!station) return [] as ConstituentRow[];

    const rows: ConstituentRow[] = station.constituents
      .map((c) => {
        const info = CONSTITUENTS[c.symbol];
        if (!info) return null;

        const period = 360 / info.speed;
        return {
          symbol: c.symbol,
          name: info.name,
          amplitude: c.amplitude,
          phase: c.phase,
          speed: info.speed,
          period,
          family: info.family as string,
          doodson: [...info.doodson] as number[],
          description: info.description,
        } satisfies ConstituentRow;
      })
      .filter((r): r is ConstituentRow => r !== null);

    // Apply family filter
    let filtered = familyFilter
      ? rows.filter((r) => r.family === familyFilter)
      : rows;

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (sortField === 'symbol' || sortField === 'family') {
        aVal = String(aVal);
        bVal = String(bVal);
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        aVal = Number(aVal);
        bVal = Number(bVal);
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  }, [station, sortField, sortDirection, familyFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'symbol' ? 'asc' : 'desc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const selectedRow = tableData.find((r) => r.symbol === selectedSymbol);

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view constituent table
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Constituent Table</h3>

      <p className="text-slate-400 text-xs mb-3">
        All {station.constituents.length} constituents. Click headers to sort, rows for details.
      </p>

      {/* Family filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => setFamilyFilter(null)}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            familyFilter === null
              ? 'bg-white/20 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          All
        </button>
        {Object.keys(FAMILY_COLORS).map((family) => (
          <button
            key={family}
            onClick={() => setFamilyFilter(familyFilter === family ? null : family)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              familyFilter === family
                ? 'text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            style={familyFilter === family ? { backgroundColor: FAMILY_COLORS[family] } : undefined}
          >
            {FAMILY_SHORT[family]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-900">
            <tr className="text-left text-slate-500 border-b border-slate-700">
              <th
                className="py-1 px-1 cursor-pointer hover:text-white"
                onClick={() => handleSort('symbol')}
              >
                Symbol
                <SortIndicator field="symbol" />
              </th>
              <th
                className="py-1 px-1 cursor-pointer hover:text-white text-right"
                onClick={() => handleSort('amplitude')}
              >
                Amp (m)
                <SortIndicator field="amplitude" />
              </th>
              <th
                className="py-1 px-1 cursor-pointer hover:text-white text-right"
                onClick={() => handleSort('phase')}
              >
                Phase°
                <SortIndicator field="phase" />
              </th>
              <th
                className="py-1 px-1 cursor-pointer hover:text-white text-right"
                onClick={() => handleSort('period')}
              >
                Period
                <SortIndicator field="period" />
              </th>
              <th
                className="py-1 px-1 cursor-pointer hover:text-white"
                onClick={() => handleSort('family')}
              >
                Type
                <SortIndicator field="family" />
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr
                key={row.symbol}
                className={`border-b border-slate-800 cursor-pointer transition-colors ${
                  selectedSymbol === row.symbol
                    ? 'bg-slate-700'
                    : 'hover:bg-slate-800'
                }`}
                onClick={() => setSelectedSymbol(selectedSymbol === row.symbol ? null : row.symbol)}
              >
                <td className="py-1 px-1">
                  <span className="text-white font-mono">{row.symbol}</span>
                  <span className="text-slate-500 ml-1 text-[10px]">{row.name}</span>
                </td>
                <td className="py-1 px-1 text-right text-white">{row.amplitude.toFixed(3)}</td>
                <td className="py-1 px-1 text-right text-slate-400">{row.phase.toFixed(1)}</td>
                <td className="py-1 px-1 text-right text-slate-400">
                  {row.period < 24
                    ? `${row.period.toFixed(1)}h`
                    : `${(row.period / 24).toFixed(1)}d`}
                </td>
                <td className="py-1 px-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: FAMILY_COLORS[row.family] ?? '#888' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected constituent detail */}
      {selectedRow && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-white font-mono text-lg">{selectedRow.symbol}</span>
              <span className="text-slate-400 ml-2">{selectedRow.name}</span>
            </div>
            <button
              onClick={() => setSelectedSymbol(null)}
              className="text-slate-500 hover:text-white"
            >
              ×
            </button>
          </div>

          <p className="text-slate-300 text-xs mb-2">{selectedRow.description}</p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Amplitude:</span>
              <span className="text-white ml-1">{selectedRow.amplitude.toFixed(4)} m</span>
            </div>
            <div>
              <span className="text-slate-500">Phase:</span>
              <span className="text-white ml-1">{selectedRow.phase.toFixed(2)}°</span>
            </div>
            <div>
              <span className="text-slate-500">Speed:</span>
              <span className="text-white ml-1">{selectedRow.speed.toFixed(6)}°/h</span>
            </div>
            <div>
              <span className="text-slate-500">Period:</span>
              <span className="text-white ml-1">
                {selectedRow.period < 24
                  ? `${selectedRow.period.toFixed(2)} hours`
                  : `${(selectedRow.period / 24).toFixed(2)} days`}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Doodson:</span>
              <span className="text-white ml-1 font-mono">
                [{selectedRow.doodson.join(', ')}]
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex justify-between text-[10px] text-slate-500">
        <span>
          Showing {tableData.length} of {station.constituents.length} constituents
        </span>
        <span>
          Total amplitude: {tableData.reduce((sum, r) => sum + r.amplitude, 0).toFixed(3)} m
        </span>
      </div>
    </div>
  );
}
