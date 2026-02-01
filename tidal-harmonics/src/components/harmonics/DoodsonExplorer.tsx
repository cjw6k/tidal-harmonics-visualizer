import { useState } from 'react';
import { CONSTITUENTS } from '@/data/constituents';
import type { Constituent } from '@/types/harmonics';

/**
 * Doodson Number Explorer
 *
 * Explains how Doodson numbers encode the astronomical origin of each constituent.
 * Each of the 6 Doodson arguments corresponds to an astronomical cycle:
 *
 * [T, s, h, p, N', p']
 *
 * T  = Mean lunar time (0-4) - number of tidal cycles per lunar day
 * s  = Mean longitude of Moon (-4 to +4) - lunar orbital position
 * h  = Mean longitude of Sun (-4 to +4) - solar position (annual cycle)
 * p  = Longitude of lunar perigee (-2 to +2) - Moon's elliptical orbit
 * N' = Longitude of lunar node (-2 to +2) - 18.6 year nodal cycle
 * p' = Longitude of solar perigee (-1 to +1) - Earth's elliptical orbit
 */

const DOODSON_DESCRIPTIONS = [
  {
    name: 'T (Mean Lunar Time)',
    full: 'Number of tidal cycles per lunar day',
    period: '24h 50m (lunar day)',
    values: {
      0: 'Long-period (no daily cycle)',
      1: 'Diurnal (1 cycle/day)',
      2: 'Semidiurnal (2 cycles/day)',
      3: 'Terdiurnal (3 cycles/day)',
      4: 'Quarter-diurnal (4 cycles/day)',
    },
  },
  {
    name: 's (Moon Longitude)',
    full: 'Mean longitude of the Moon',
    period: '27.32 days (tropical month)',
    values: {
      '-2': 'Two months behind',
      '-1': 'One month behind',
      0: 'At reference',
      '+1': 'One month ahead',
      '+2': 'Two months ahead',
    },
  },
  {
    name: 'h (Sun Longitude)',
    full: 'Mean longitude of the Sun',
    period: '365.25 days (tropical year)',
    values: {
      '-2': 'Two solar cycles behind',
      '-1': 'One solar cycle behind',
      0: 'At reference',
      '+1': 'One solar cycle ahead',
      '+2': 'Two solar cycles ahead',
    },
  },
  {
    name: 'p (Lunar Perigee)',
    full: 'Longitude of lunar perigee',
    period: '8.85 years (apsidal precession)',
    values: {
      '-1': 'Opposing perigee motion',
      0: 'Independent of perigee',
      '+1': 'Following perigee motion',
    },
  },
  {
    name: "N' (Lunar Node)",
    full: 'Longitude of ascending lunar node',
    period: '18.61 years (nodal regression)',
    values: {
      0: 'Independent of node',
    },
  },
  {
    name: "p' (Solar Perigee)",
    full: 'Longitude of perihelion',
    period: '20,900 years (very slow)',
    values: {
      '-1': 'Opposing perihelion',
      0: 'Independent of perihelion',
      '+1': 'Following perihelion',
    },
  },
];

const FAMILY_EXAMPLES = {
  semidiurnal: {
    title: 'Semidiurnal Family',
    description: 'T=2 means two complete tidal cycles per lunar day (~12.42 hours each)',
    constituents: ['M2', 'S2', 'N2', 'K2'],
  },
  diurnal: {
    title: 'Diurnal Family',
    description: 'T=1 means one complete tidal cycle per lunar day (~24.84 hours)',
    constituents: ['K1', 'O1', 'P1', 'Q1'],
  },
  'long-period': {
    title: 'Long-Period Family',
    description: 'T=0 means no daily cycle; periods of days to years',
    constituents: ['Mf', 'Mm', 'Ssa', 'Sa'],
  },
  'shallow-water': {
    title: 'Shallow-Water Family',
    description: 'T≥4 (overtides) or compound tides from nonlinear interactions',
    constituents: ['M4', 'MS4', 'M6', 'MK3'],
  },
};

interface DoodsonExplorerProps {
  onClose: () => void;
}

export function DoodsonExplorer({ onClose }: DoodsonExplorerProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('M2');
  const [activeFamily, setActiveFamily] = useState<string>('semidiurnal');

  const selectedConstituent = CONSTITUENTS[selectedSymbol];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Doodson Number System</h2>
            <p className="text-slate-400 text-sm">
              How tidal constituents encode astronomical cycles
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
          {/* Introduction */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-300 text-sm leading-relaxed">
              Arthur Doodson (1890-1968) developed a numbering system where each constituent
              is identified by six integers. Each number encodes how that constituent relates
              to an astronomical cycle. By reading the Doodson numbers, you can understand
              exactly what causes each tidal constituent.
            </p>
          </div>

          {/* Interactive explorer */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Explore a Constituent</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(CONSTITUENTS).slice(0, 20).map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedSymbol === symbol
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>

            {selectedConstituent && (
              <DoodsonBreakdown constituent={selectedConstituent} />
            )}
          </div>

          {/* Family examples */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Constituent Families</h3>
            <div className="flex gap-2 mb-4">
              {Object.entries(FAMILY_EXAMPLES).map(([key, family]) => (
                <button
                  key={key}
                  onClick={() => setActiveFamily(key)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    activeFamily === key
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {family.title}
                </button>
              ))}
            </div>

            {FAMILY_EXAMPLES[activeFamily as keyof typeof FAMILY_EXAMPLES] && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-slate-300 text-sm mb-3">
                  {FAMILY_EXAMPLES[activeFamily as keyof typeof FAMILY_EXAMPLES].description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {FAMILY_EXAMPLES[activeFamily as keyof typeof FAMILY_EXAMPLES].constituents.map((sym) => {
                    const c = CONSTITUENTS[sym];
                    if (!c) return null;
                    return (
                      <div key={sym} className="p-2 bg-slate-700 rounded text-xs">
                        <span className="font-bold text-white">{sym}</span>
                        <span className="text-slate-400 ml-2 font-mono">
                          [{c.doodson.join(',')}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reference table */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Doodson Arguments Reference</h3>
            <div className="space-y-3">
              {DOODSON_DESCRIPTIONS.map((arg, i) => (
                <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-cyan-400">{arg.name}</span>
                    <span className="text-slate-500 text-xs">Period: {arg.period}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{arg.full}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoodsonBreakdown({ constituent }: { constituent: Constituent }) {
  const labels = ['T', 's', 'h', 'p', "N'", "p'"];
  const descriptions = [
    'Lunar day cycles',
    'Moon longitude',
    'Sun longitude',
    'Lunar perigee',
    'Lunar node',
    'Solar perigee',
  ];

  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-2xl font-bold text-white">{constituent.symbol}</span>
        <span className="text-slate-400">{constituent.name}</span>
      </div>

      <div className="flex gap-2 mb-4">
        {constituent.doodson.map((num, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-xs text-slate-500">{labels[i]}</span>
            <span className={`text-xl font-mono ${
              num === 0 ? 'text-slate-500' : num > 0 ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              {num > 0 ? `+${num}` : num}
            </span>
            <span className="text-[10px] text-slate-600">{descriptions[i]}</span>
          </div>
        ))}
      </div>

      <div className="text-sm text-slate-300 space-y-1">
        <p>
          <span className="text-slate-500">Period:</span>{' '}
          {formatPeriodDetails(constituent.period)}
        </p>
        <p>
          <span className="text-slate-500">Speed:</span>{' '}
          {constituent.speed.toFixed(4)}°/hour
        </p>
        <p>
          <span className="text-slate-500">Family:</span>{' '}
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            constituent.family === 'semidiurnal' ? 'bg-blue-500/20 text-blue-400' :
            constituent.family === 'diurnal' ? 'bg-green-500/20 text-green-400' :
            constituent.family === 'long-period' ? 'bg-purple-500/20 text-purple-400' :
            'bg-orange-500/20 text-orange-400'
          }`}>
            {constituent.family}
          </span>
        </p>
      </div>

      <div className="mt-3 p-2 bg-slate-700/50 rounded text-xs text-slate-400">
        <strong>Reading the numbers:</strong> T={constituent.doodson[0]} means{' '}
        {constituent.doodson[0]} cycles per lunar day. s={constituent.doodson[1]} relates to Moon's
        monthly motion. h={constituent.doodson[2]} relates to Sun's annual motion.
      </div>
    </div>
  );
}

function formatPeriodDetails(hours: number): string {
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  } else if (hours < 24 * 30) {
    const days = hours / 24;
    return `${days.toFixed(2)} days`;
  } else if (hours < 24 * 365) {
    const months = hours / (24 * 30.44);
    return `${months.toFixed(1)} months`;
  } else {
    const years = hours / (24 * 365.25);
    return `${years.toFixed(2)} years`;
  }
}
