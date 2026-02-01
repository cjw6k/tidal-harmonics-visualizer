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
    astronomicalMeaning: 'Represents Earth\'s rotation relative to the Moon. The lunar day is ~50 minutes longer than a solar day because the Moon advances ~13° in its orbit daily, and Earth must rotate that extra distance to "catch up."',
    physicalEffect: 'Determines the fundamental frequency of the tide. T=2 means two high tides per lunar day (semidiurnal), the most common pattern globally.',
    values: {
      0: 'Long-period (no daily cycle) - responds to orbital geometry, not rotation',
      1: 'Diurnal (1 cycle/day) - one high tide per lunar day',
      2: 'Semidiurnal (2 cycles/day) - two high tides per lunar day',
      3: 'Terdiurnal (3 cycles/day) - shallow water overtide',
      4: 'Quarter-diurnal (4 cycles/day) - shallow water overtide',
    },
  },
  {
    name: 's (Moon Longitude)',
    full: 'Mean longitude of the Moon in its orbit',
    period: '27.32 days (tropical month)',
    astronomicalMeaning: 'Tracks the Moon\'s position in its orbit around Earth. The Moon completes one orbit every ~27.3 days (tropical month), continuously changing its angular distance from the Sun.',
    physicalEffect: 'Controls the fortnightly spring-neap cycle when combined with solar position. Also determines the phase relationship between lunar tidal constituents.',
    values: {
      '-2': 'Two tropical months behind reference - perigee/node interactions',
      '-1': 'One tropical month behind - spring-neap timing offset',
      0: 'At reference position - direct lunar gravitational pull',
      '+1': 'One tropical month ahead - modulates monthly patterns',
      '+2': 'Two tropical months ahead - secondary orbital effects',
    },
  },
  {
    name: 'h (Sun Longitude)',
    full: 'Mean longitude of the Sun (Earth\'s position in orbit)',
    period: '365.25 days (tropical year)',
    astronomicalMeaning: 'Represents Earth\'s position in its annual orbit around the Sun. Equivalently, it\'s the Sun\'s apparent position along the ecliptic as seen from Earth.',
    physicalEffect: 'Creates seasonal modulation of tides. Combined with Moon longitude, determines spring-neap timing. Solar position also affects declination-driven diurnal inequality.',
    values: {
      '-2': 'Two years behind - very long-period effects',
      '-1': 'One year behind - annual cycle component',
      0: 'At reference - direct solar gravitational effect',
      '+1': 'One year ahead - seasonal modulation',
      '+2': 'Two years ahead - very long-period effects',
    },
  },
  {
    name: 'p (Lunar Perigee)',
    full: 'Longitude of the Moon\'s perigee (closest orbital point)',
    period: '8.85 years (apsidal precession)',
    astronomicalMeaning: 'The Moon\'s orbit is elliptical, with perigee (closest point) advancing slowly around Earth. This "apsidal precession" completes one cycle every 8.85 years, modulating tidal range.',
    physicalEffect: 'When perigee aligns with new/full moon, extra-strong "perigean spring tides" (king tides) occur. The N2 constituent captures this effect, varying tide strength ~13% over the cycle.',
    values: {
      '-1': 'Opposing perigee motion - L2 constituent pattern',
      0: 'Independent of perigee - unaffected by Moon\'s orbital eccentricity',
      '+1': 'Following perigee motion - N2 constituent pattern, strongest at perigee',
    },
  },
  {
    name: "N' (Lunar Node)",
    full: 'Longitude of the Moon\'s ascending node',
    period: '18.61 years (nodal regression)',
    astronomicalMeaning: 'The Moon\'s orbital plane is tilted ~5° to Earth\'s equator and wobbles with an 18.6-year period. The "nodes" are where the Moon crosses the celestial equator. This slow regression is the longest cycle affecting monthly tides.',
    physicalEffect: 'Creates the 18.6-year nodal cycle that modulates all tidal constituents by ~3-5%. During "major lunar standstill" years, the Moon reaches higher declinations, amplifying diurnal tides.',
    values: {
      '-1': 'Retrograde nodal motion - rare constituents',
      0: 'Independent of nodes - most constituents ignore this cycle',
      '+1': 'Following nodal motion - nodal modulation constituents',
    },
  },
  {
    name: "p' (Solar Perigee / Perihelion)",
    full: 'Longitude of Earth\'s perihelion (closest point to Sun)',
    period: '20,900 years (apsidal precession)',
    astronomicalMeaning: 'Earth\'s orbit around the Sun is slightly elliptical, with perihelion (closest approach) slowly precessing over ~21,000 years. Currently perihelion occurs in early January.',
    physicalEffect: 'Creates a tiny (~3%) seasonal variation in solar tidal strength. Earth is ~3% closer to Sun in January than July, making winter spring tides slightly stronger in the Northern Hemisphere.',
    values: {
      '-1': 'Opposing perihelion - R2 constituent pattern',
      0: 'Independent of perihelion - most constituents',
      '+1': 'Following perihelion - T2 constituent, annual solar modulation',
    },
  },
];

// Additional educational content about the Doodson system
const DOODSON_HISTORY = {
  inventor: 'Arthur Thomas Doodson (1890-1968)',
  institution: 'Liverpool Tidal Institute, UK',
  year: 1921,
  achievement: 'Developed a systematic notation for 388 tidal constituents and built the Doodson-Légé tide predicting machine',
  legacy: 'The Doodson numbers remain the international standard for identifying tidal constituents, used by NOAA, UKHO, and oceanographic institutions worldwide.',
};

const ASTRONOMICAL_ORIGINS = {
  title: 'Why These Six Arguments?',
  explanation: `The six Doodson arguments capture all the major astronomical cycles that affect Earth's tides:

1. **Earth's Rotation (T)** - Creates the daily tidal rhythm
2. **Moon's Orbit (s)** - The primary tidal force, creating the ~12.4-hour cycle
3. **Earth's Orbit (h)** - Solar tides and seasonal effects
4. **Moon's Ellipse (p)** - Perigee/apogee variations (~monthly)
5. **Moon's Plane (N')** - The 18.6-year nodal cycle
6. **Earth's Ellipse (p')** - Subtle annual solar variations

Any tidal frequency can be expressed as a unique combination of these six fundamental rates. The genius of Doodson's system is that it reduces complex celestial mechanics to simple integer arithmetic.`,
};

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
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              <strong className="text-cyan-400">{DOODSON_HISTORY.inventor}</strong> developed a numbering
              system in {DOODSON_HISTORY.year} at the {DOODSON_HISTORY.institution} where each tidal
              constituent is identified by six integers. Each number encodes how that constituent relates
              to an astronomical cycle.
            </p>
            <p className="text-slate-400 text-xs italic">
              {DOODSON_HISTORY.legacy}
            </p>
          </div>

          {/* Why These Six */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/30">
            <h3 className="text-md font-semibold text-white mb-2">{ASTRONOMICAL_ORIGINS.title}</h3>
            <div className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
              {ASTRONOMICAL_ORIGINS.explanation}
            </div>
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
            <div className="space-y-4">
              {DOODSON_DESCRIPTIONS.map((arg, i) => (
                <div key={i} className="p-4 bg-slate-800/50 rounded-lg border-l-2 border-cyan-500/50">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-mono text-cyan-400 text-lg">{arg.name}</span>
                    <span className="text-slate-500 text-xs bg-slate-700 px-2 py-0.5 rounded">Period: {arg.period}</span>
                  </div>
                  <p className="text-white text-sm font-medium mb-2">{arg.full}</p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-slate-700/50 rounded">
                      <span className="text-blue-400 font-semibold">Astronomical Meaning: </span>
                      <span className="text-slate-300">{arg.astronomicalMeaning}</span>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <span className="text-green-400 font-semibold">Physical Effect: </span>
                      <span className="text-slate-300">{arg.physicalEffect}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-slate-500 text-xs font-semibold">Integer Values:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(arg.values).map(([val, desc]) => (
                        <div key={val} className="text-xs bg-slate-700 px-2 py-1 rounded">
                          <span className="text-amber-400 font-mono">{val}</span>
                          <span className="text-slate-400 ml-1">= {desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
