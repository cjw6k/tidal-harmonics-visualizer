import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import type { Constituent } from '@/types/harmonics';

interface FamilyInfo {
  name: string;
  description: string;
  periodRange: string;
  color: string;
  bgColor: string;
}

const FAMILY_INFO: Record<string, FamilyInfo> = {
  semidiurnal: {
    name: 'Semidiurnal',
    description: 'Two highs and lows per day (~12 hour period)',
    periodRange: '11.9 - 12.9 hours',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
  },
  diurnal: {
    name: 'Diurnal',
    description: 'One high and low per day (~24 hour period)',
    periodRange: '22.3 - 26.9 hours',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
  },
  'shallow-water': {
    name: 'Shallow Water',
    description: 'Overtides and compound tides from nonlinear interactions',
    periodRange: '3.1 - 8.2 hours',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
  },
  'long-period': {
    name: 'Long Period',
    description: 'Fortnightly, monthly, and annual cycles',
    periodRange: '9.1 days - 1 year',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
  },
};

const FAMILY_ORDER = ['semidiurnal', 'diurnal', 'shallow-water', 'long-period'] as const;

export function ConstituentFamilies() {
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);
  const toggleConstituent = useHarmonicsStore((s) => s.toggleConstituent);
  const setAllConstituentsVisible = useHarmonicsStore((s) => s.setAllConstituentsVisible);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  // Create amplitude lookup map from station data
  const amplitudeMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (selectedStation) {
      selectedStation.constituents.forEach(c => {
        map[c.symbol] = c.amplitude;
      });
    }
    return map;
  }, [selectedStation]);

  // Group constituents by family
  const constituentsByFamily = useMemo(() => {
    const groups: Record<string, Constituent[]> = {};

    Object.values(CONSTITUENTS).forEach(c => {
      const family = c.family;
      if (!groups[family]) groups[family] = [];
      groups[family].push(c);
    });

    // Sort each family by amplitude (if station data available) or by period
    Object.keys(groups).forEach(family => {
      const familyGroup = groups[family];
      if (familyGroup) {
        familyGroup.sort((a, b) => {
          const ampA = amplitudeMap[a.symbol] ?? 0;
          const ampB = amplitudeMap[b.symbol] ?? 0;
          if (ampA !== ampB) return ampB - ampA;
          return a.period - b.period;
        });
      }
    });

    return groups;
  }, [amplitudeMap]);

  // Calculate family statistics
  const familyStats = useMemo(() => {
    const stats: Record<string, { count: number; enabled: number; totalAmp: number }> = {};

    FAMILY_ORDER.forEach(family => {
      const members = constituentsByFamily[family] ?? [];
      const enabled = members.filter(c => visibleConstituents.includes(c.symbol)).length;
      const totalAmp = members.reduce((sum, c) => sum + (amplitudeMap[c.symbol] ?? 0), 0);
      stats[family] = { count: members.length, enabled, totalAmp };
    });

    return stats;
  }, [constituentsByFamily, visibleConstituents, amplitudeMap]);

  // Toggle all constituents in a family
  const toggleFamily = (family: string) => {
    const members = constituentsByFamily[family] ?? [];
    const allEnabled = members.every(c => visibleConstituents.includes(c.symbol));

    if (allEnabled) {
      // Disable all in family
      const newVisible = visibleConstituents.filter(
        s => !members.some(c => c.symbol === s)
      );
      setAllConstituentsVisible(newVisible);
    } else {
      // Enable all in family
      const memberSymbols = members.map(c => c.symbol);
      const newVisible = [...new Set([...visibleConstituents, ...memberSymbols])];
      setAllConstituentsVisible(newVisible);
    }
  };

  // Enable only one family
  const enableOnlyFamily = (family: string) => {
    const members = constituentsByFamily[family] ?? [];
    setAllConstituentsVisible(members.map(c => c.symbol));
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-3 text-xs shadow-lg border border-slate-700 max-w-[360px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100">Constituent Families</h3>
        <span className="text-slate-400">
          {visibleConstituents.length} of {Object.keys(CONSTITUENTS).length} enabled
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setAllConstituentsVisible(Object.keys(CONSTITUENTS))}
          className="flex-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px]"
        >
          All
        </button>
        <button
          onClick={() => setAllConstituentsVisible([])}
          className="flex-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px]"
        >
          None
        </button>
        <button
          onClick={() => setAllConstituentsVisible(['M2', 'S2', 'K1', 'O1'])}
          className="flex-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px]"
        >
          Major 4
        </button>
      </div>

      {/* Family groups */}
      <div className="space-y-2">
        {FAMILY_ORDER.map(family => {
          const info = FAMILY_INFO[family];
          if (!info) return null;
          const members = constituentsByFamily[family] ?? [];
          const stats = familyStats[family] ?? { count: 0, enabled: 0, totalAmp: 0 };
          const allEnabled = members.every(c => visibleConstituents.includes(c.symbol));
          const someEnabled = members.some(c => visibleConstituents.includes(c.symbol));

          return (
            <div key={family} className={`${info.bgColor} rounded-lg p-2`}>
              {/* Family header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFamily(family)}
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px]
                      ${allEnabled
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : someEnabled
                          ? 'bg-blue-600/50 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                  >
                    {allEnabled ? '✓' : someEnabled ? '−' : ''}
                  </button>
                  <div>
                    <span className={`font-medium ${info.color}`}>{info.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({stats.enabled}/{stats.count})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => enableOnlyFamily(family)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 px-1"
                  title="Enable only this family"
                >
                  only
                </button>
              </div>

              {/* Family description */}
              <div className="text-slate-400 text-[10px] mb-2">
                {info.description} • {info.periodRange}
              </div>

              {/* Constituent pills */}
              <div className="flex flex-wrap gap-1">
                {members.map(c => {
                  const isEnabled = visibleConstituents.includes(c.symbol);
                  const amp = amplitudeMap[c.symbol];

                  return (
                    <button
                      key={c.symbol}
                      onClick={() => toggleConstituent(c.symbol)}
                      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors
                        ${isEnabled
                          ? `${info.color} bg-slate-700/80 ring-1 ring-current`
                          : 'text-slate-500 bg-slate-800/50 hover:bg-slate-700/50'
                        }`}
                      title={`${c.name}${amp !== undefined ? ` (${amp.toFixed(3)}m)` : ''}`}
                    >
                      {c.symbol}
                      {amp !== undefined && amp > 0 && (
                        <span className="text-slate-500 ml-0.5">
                          {amp > 0.1 ? '●' : amp > 0.01 ? '○' : '·'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Amplitude bar for station */}
              {selectedStation && stats.totalAmp > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">Total amplitude:</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${info.color.replace('text-', 'bg-').replace('-400', '-500')}`}
                        style={{ width: `${Math.min(100, (stats.totalAmp / 2) * 100)}%` }}
                      />
                    </div>
                    <span className="text-slate-400 text-[10px] font-mono">
                      {stats.totalAmp.toFixed(2)}m
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Educational note */}
      <div className="mt-3 pt-2 border-t border-slate-700 text-slate-400 text-[10px]">
        <p>
          <strong className="text-slate-300">●</strong> = large (&gt;0.1m),{' '}
          <strong className="text-slate-300">○</strong> = medium,{' '}
          <strong className="text-slate-300">·</strong> = small amplitude at this station
        </p>
      </div>
    </div>
  );
}
