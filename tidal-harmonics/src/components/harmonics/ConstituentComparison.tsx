import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import type { ConstituentFamily } from '@/types/harmonics';

/**
 * Constituent Comparison Component
 *
 * Allows users to select and compare multiple constituents side-by-side,
 * showing their properties, relative amplitudes, and relationships.
 */

const FAMILY_COLORS: Record<ConstituentFamily, string> = {
  semidiurnal: '#3b82f6',
  diurnal: '#22c55e',
  'long-period': '#f97316',
  'shallow-water': '#a855f7',
};

const FAMILY_LABELS: Record<ConstituentFamily, string> = {
  semidiurnal: 'Semidiurnal',
  diurnal: 'Diurnal',
  'long-period': 'Long-period',
  'shallow-water': 'Shallow-water',
};

interface ConstituentComparisonProps {
  onClose?: () => void;
}

export function ConstituentComparison({ onClose }: ConstituentComparisonProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['M2', 'S2', 'K1', 'O1']);
  const [compareBy, setCompareBy] = useState<'amplitude' | 'speed' | 'period'>('amplitude');
  const [sortBy, setSortBy] = useState<'symbol' | 'amplitude' | 'speed' | 'family'>('amplitude');

  // Get all available constituents at this station
  const availableConstituents = useMemo(() => {
    if (!station) return [];
    return station.constituents
      .map((c) => ({
        ...c,
        constituent: CONSTITUENTS[c.symbol],
      }))
      .filter((c) => c.constituent)
      .sort((a, b) => b.amplitude - a.amplitude);
  }, [station]);

  // Get data for selected constituents
  const comparisonData = useMemo(() => {
    return selectedSymbols
      .map((symbol) => {
        const stationData = station?.constituents.find((c) => c.symbol === symbol);
        const constituent = CONSTITUENTS[symbol];
        if (!stationData || !constituent) return null;
        return {
          ...constituent,
          symbol,
          amplitude: stationData.amplitude,
          phase: stationData.phase,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [station, selectedSymbols]);

  // Sort comparison data
  const sortedData = useMemo(() => {
    return [...comparisonData].sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'amplitude':
          return b.amplitude - a.amplitude;
        case 'speed':
          return b.speed - a.speed;
        case 'family':
          return a.family.localeCompare(b.family);
        default:
          return 0;
      }
    });
  }, [comparisonData, sortBy]);

  // Calculate max amplitude for scaling
  const maxAmplitude = useMemo(() => {
    return Math.max(...comparisonData.map((d) => d.amplitude), 0.01);
  }, [comparisonData]);

  // Toggle constituent selection
  const toggleConstituent = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : prev.length < 8
        ? [...prev, symbol]
        : prev
    );
  };

  // Quick select groups
  const selectGroup = (group: 'semidiurnal' | 'diurnal' | 'major' | 'clear') => {
    switch (group) {
      case 'semidiurnal':
        setSelectedSymbols(['M2', 'S2', 'N2', 'K2'].filter((s) =>
          availableConstituents.some((c) => c.symbol === s)
        ));
        break;
      case 'diurnal':
        setSelectedSymbols(['K1', 'O1', 'P1', 'Q1'].filter((s) =>
          availableConstituents.some((c) => c.symbol === s)
        ));
        break;
      case 'major':
        setSelectedSymbols(['M2', 'S2', 'K1', 'O1', 'N2', 'P1'].filter((s) =>
          availableConstituents.some((c) => c.symbol === s)
        ));
        break;
      case 'clear':
        setSelectedSymbols([]);
        break;
    }
  };

  const formatPeriod = (hours: number): string => {
    if (hours < 1) {
      return `${(hours * 60).toFixed(1)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(2)}h`;
    } else {
      return `${(hours / 24).toFixed(1)}d`;
    }
  };

  if (!station) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-slate-900 rounded-xl p-6 text-center text-slate-500">
          Select a station to compare constituents
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Constituent Comparison</h2>
            <p className="text-slate-400 text-sm">
              Compare properties of different tidal constituents at {station.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Constituent selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">
                Select Constituents ({selectedSymbols.length}/8)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => selectGroup('major')}
                  className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  Major
                </button>
                <button
                  onClick={() => selectGroup('semidiurnal')}
                  className="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded hover:bg-blue-900"
                >
                  Semidiurnal
                </button>
                <button
                  onClick={() => selectGroup('diurnal')}
                  className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded hover:bg-green-900"
                >
                  Diurnal
                </button>
                <button
                  onClick={() => selectGroup('clear')}
                  className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded hover:bg-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableConstituents.map((c) => {
                const isSelected = selectedSymbols.includes(c.symbol);
                const family = c.constituent?.family || 'semidiurnal';
                return (
                  <button
                    key={c.symbol}
                    onClick={() => toggleConstituent(c.symbol)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isSelected ? FAMILY_COLORS[family] : `${FAMILY_COLORS[family]}40`,
                      color: isSelected ? 'white' : FAMILY_COLORS[family],
                    }}
                  >
                    {c.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          {sortedData.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              Select constituents above to compare
            </div>
          ) : (
            <>
              {/* Visual comparison bar chart */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white">Visual Comparison</h3>
                  <div className="flex gap-2">
                    <select
                      value={compareBy}
                      onChange={(e) => setCompareBy(e.target.value as 'amplitude' | 'speed' | 'period')}
                      className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700"
                    >
                      <option value="amplitude">By Amplitude</option>
                      <option value="speed">By Speed</option>
                      <option value="period">By Period</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="space-y-2">
                    {sortedData.map((d) => {
                      let barValue: number;
                      let displayValue: string;
                      let maxVal: number;

                      switch (compareBy) {
                        case 'speed':
                          barValue = d.speed;
                          maxVal = Math.max(...sortedData.map((x) => x.speed));
                          displayValue = `${d.speed.toFixed(4)}°/hr`;
                          break;
                        case 'period':
                          barValue = d.period;
                          maxVal = Math.max(...sortedData.map((x) => x.period));
                          displayValue = formatPeriod(d.period);
                          break;
                        default:
                          barValue = d.amplitude;
                          maxVal = maxAmplitude;
                          displayValue = `${(d.amplitude * 100).toFixed(1)} cm`;
                      }

                      const barWidth = (barValue / maxVal) * 100;

                      return (
                        <div key={d.symbol} className="flex items-center gap-3">
                          <div className="w-12 text-right">
                            <span
                              className="font-mono font-bold text-sm"
                              style={{ color: FAMILY_COLORS[d.family] }}
                            >
                              {d.symbol}
                            </span>
                          </div>
                          <div className="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                            <div
                              className="h-full rounded transition-all duration-300"
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: FAMILY_COLORS[d.family],
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-xs text-slate-400 font-mono">
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed comparison table */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white">Detailed Properties</h3>
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-500">Sort by:</span>
                    {(['symbol', 'amplitude', 'speed', 'family'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-2 py-0.5 rounded ${
                          sortBy === s
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-slate-700">
                        <th className="py-2 px-3 text-slate-400 font-medium">Symbol</th>
                        <th className="py-2 px-3 text-slate-400 font-medium">Name</th>
                        <th className="py-2 px-3 text-slate-400 font-medium">Family</th>
                        <th className="py-2 px-3 text-slate-400 font-medium text-right">Amplitude</th>
                        <th className="py-2 px-3 text-slate-400 font-medium text-right">Phase</th>
                        <th className="py-2 px-3 text-slate-400 font-medium text-right">Speed</th>
                        <th className="py-2 px-3 text-slate-400 font-medium text-right">Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((d) => (
                        <tr key={d.symbol} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-2 px-3">
                            <span
                              className="font-mono font-bold"
                              style={{ color: FAMILY_COLORS[d.family] }}
                            >
                              {d.symbol}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300">{d.name}</td>
                          <td className="py-2 px-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: `${FAMILY_COLORS[d.family]}30`,
                                color: FAMILY_COLORS[d.family],
                              }}
                            >
                              {FAMILY_LABELS[d.family]}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-white font-mono">
                            {(d.amplitude * 100).toFixed(1)} cm
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400 font-mono">
                            {d.phase.toFixed(1)}°
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400 font-mono">
                            {d.speed.toFixed(4)}°/hr
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400 font-mono">
                            {formatPeriod(d.period)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relationship insights */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Speed ratios */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Speed Relationships</h4>
                  {sortedData.length >= 2 && (
                    <div className="space-y-2 text-xs">
                      {sortedData.slice(0, 4).map((d, i) =>
                        sortedData.slice(i + 1, i + 3).map((d2) => {
                          const ratio = d.speed / d2.speed;
                          return (
                            <div key={`${d.symbol}-${d2.symbol}`} className="flex justify-between text-slate-400">
                              <span>
                                <span style={{ color: FAMILY_COLORS[d.family] }}>{d.symbol}</span>
                                {' / '}
                                <span style={{ color: FAMILY_COLORS[d2.family] }}>{d2.symbol}</span>
                              </span>
                              <span className="text-white font-mono">{ratio.toFixed(4)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Amplitude ratios */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Amplitude Ratios (relative to M2)</h4>
                  {(() => {
                    const m2 = sortedData.find((d) => d.symbol === 'M2');
                    if (!m2) {
                      return <p className="text-xs text-slate-500">Select M2 to see ratios</p>;
                    }
                    return (
                      <div className="space-y-2 text-xs">
                        {sortedData
                          .filter((d) => d.symbol !== 'M2')
                          .map((d) => {
                            const ratio = d.amplitude / m2.amplitude;
                            return (
                              <div key={d.symbol} className="flex justify-between text-slate-400">
                                <span style={{ color: FAMILY_COLORS[d.family] }}>{d.symbol}</span>
                                <span className="text-white font-mono">
                                  {(ratio * 100).toFixed(1)}% of M2
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Description section */}
              {sortedData.length > 0 && sortedData[0]?.description && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-white">Constituent Descriptions</h4>
                  {sortedData.slice(0, 4).map((d) => (
                    <div key={d.symbol} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-mono font-bold"
                          style={{ color: FAMILY_COLORS[d.family] }}
                        >
                          {d.symbol}
                        </span>
                        <span className="text-slate-400 text-sm">{d.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{d.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
            {Object.entries(FAMILY_COLORS).map(([family, color]) => (
              <span key={family} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-slate-400">{FAMILY_LABELS[family as ConstituentFamily]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
