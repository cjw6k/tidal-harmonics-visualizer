import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { getTidalType, STATIONS } from '@/data/stations';
import type { TidalType } from '@/data/stations';

interface TidalTypeExplainerProps {
  onClose: () => void;
}

const TIDAL_TYPE_INFO: Record<TidalType, {
  title: string;
  description: string;
  characteristics: string[];
  examples: string[];
  color: string;
  icon: string;
}> = {
  semidiurnal: {
    title: 'Semidiurnal Tides',
    description: `Semidiurnal ("twice-daily") tides show two high tides and two low tides
of roughly equal height each lunar day. This is the most common tidal type globally,
found throughout the Atlantic Ocean and most of Europe.`,
    characteristics: [
      'Two nearly equal high tides per day',
      'Two nearly equal low tides per day',
      'Dominated by M2 and S2 constituents',
      'Form number (K1+O1)/(M2+S2) < 0.25',
    ],
    examples: ['Boston, MA', 'London, UK', 'Bay of Fundy'],
    color: 'blue',
    icon: '🌊',
  },
  'mixed-semidiurnal': {
    title: 'Mixed, Mainly Semidiurnal',
    description: `Mixed tides with semidiurnal dominance show two high and two low tides
per day, but with significant inequality - one high is notably higher than the other.
This is common along the U.S. West Coast and much of the Pacific.`,
    characteristics: [
      'Two highs and two lows per day',
      'Higher high water (HHW) and lower high water (LHW)',
      'Lower low water (LLW) and higher low water (HLW)',
      'Form number 0.25 ≤ ratio < 1.5',
    ],
    examples: ['San Francisco, CA', 'Seattle, WA', 'Los Angeles, CA'],
    color: 'cyan',
    icon: '🌊',
  },
  'mixed-diurnal': {
    title: 'Mixed, Mainly Diurnal',
    description: `Mixed tides with diurnal dominance may show only one high and one low
on some days, especially when the Moon is at high declination. At other times, two
unequal tides appear. Common in parts of the Gulf of Mexico and Caribbean.`,
    characteristics: [
      'Sometimes one high/low, sometimes two',
      'Depends strongly on lunar declination',
      'Very large diurnal inequality',
      'Form number 1.5 ≤ ratio < 3.0',
    ],
    examples: ['Gulf Coast', 'Parts of Caribbean', 'Some Pacific islands'],
    color: 'green',
    icon: '🌊',
  },
  diurnal: {
    title: 'Diurnal Tides',
    description: `Diurnal ("daily") tides have only one high tide and one low tide per day.
This type is relatively rare globally but occurs in parts of the Gulf of Mexico,
South China Sea, and some enclosed seas.`,
    characteristics: [
      'Only one high tide per day',
      'Only one low tide per day',
      'Period approximately 24.84 hours',
      'Form number ≥ 3.0',
    ],
    examples: ['Pensacola, FL', 'Parts of Gulf of Mexico', 'South China Sea'],
    color: 'amber',
    icon: '🌊',
  },
};

/**
 * TidalTypeExplainer - Educational modal about tidal types
 *
 * Explains why different locations have different tidal patterns based on:
 * - The form number (K1+O1)/(M2+S2)
 * - Geographic and bathymetric factors
 * - Comparison across station types
 */
export function TidalTypeExplainer({ onClose }: TidalTypeExplainerProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);

  const stationAnalysis = useMemo(() => {
    if (!station) return null;

    const M2 = station.constituents.find(c => c.symbol === 'M2')?.amplitude ?? 0;
    const S2 = station.constituents.find(c => c.symbol === 'S2')?.amplitude ?? 0;
    const K1 = station.constituents.find(c => c.symbol === 'K1')?.amplitude ?? 0;
    const O1 = station.constituents.find(c => c.symbol === 'O1')?.amplitude ?? 0;

    const formNumber = (K1 + O1) / (M2 + S2 || 0.001);
    const tidalType = getTidalType(station);
    const typeInfo = TIDAL_TYPE_INFO[tidalType];

    // Get comparison stations of each type
    const typeExamples = STATIONS.reduce((acc, s) => {
      const type = getTidalType(s);
      if (!acc[type] && s.id !== station.id) {
        acc[type] = s;
      }
      return acc;
    }, {} as Record<TidalType, typeof station>);

    return {
      M2,
      S2,
      K1,
      O1,
      formNumber,
      tidalType,
      typeInfo,
      typeExamples,
    };
  }, [station]);

  if (!station || !stationAnalysis) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-slate-900 rounded-lg p-6 mx-4">
          <p className="text-slate-400">Select a station to view tidal type analysis.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  const { M2, S2, K1, O1, formNumber, tidalType, typeInfo } = stationAnalysis;

  const colorClasses = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  }[typeInfo.color] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Tidal Type Classification</h2>
            <p className="text-slate-400 text-sm">{station.name}</p>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Station Classification */}
          <div className={`p-4 rounded-lg border ${colorClasses.bg} ${colorClasses.border}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{typeInfo.icon}</span>
              <div>
                <h3 className={`text-lg font-bold ${colorClasses.text}`}>{typeInfo.title}</h3>
                <span className="text-slate-400 text-sm">Form Number: {formNumber.toFixed(3)}</span>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{typeInfo.description}</p>
          </div>

          {/* Form Number Calculation */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-3">Form Number Calculation</h3>
            <div className="font-mono text-sm mb-3">
              <div className="flex items-center gap-2 text-slate-300">
                <span>F = </span>
                <span className="flex flex-col items-center">
                  <span className="border-b border-slate-500 pb-1">K₁ + O₁</span>
                  <span className="pt-1">M₂ + S₂</span>
                </span>
                <span> = </span>
                <span className="flex flex-col items-center">
                  <span className="border-b border-slate-500 pb-1">{K1.toFixed(3)} + {O1.toFixed(3)}</span>
                  <span className="pt-1">{M2.toFixed(3)} + {S2.toFixed(3)}</span>
                </span>
                <span> = </span>
                <span className={`font-bold ${colorClasses.text}`}>{formNumber.toFixed(3)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-700/50 rounded">
                <span className="text-slate-500">Diurnal (K₁+O₁):</span>
                <span className="text-white ml-2">{(K1 + O1).toFixed(3)} m</span>
              </div>
              <div className="p-2 bg-slate-700/50 rounded">
                <span className="text-slate-500">Semidiurnal (M₂+S₂):</span>
                <span className="text-white ml-2">{(M2 + S2).toFixed(3)} m</span>
              </div>
            </div>
          </div>

          {/* Classification Scale */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-3">Classification Thresholds</h3>
            <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden mb-2">
              {/* Gradient segments */}
              <div className="absolute inset-0 flex">
                <div className="w-[8%] bg-blue-500/50" title="Semidiurnal" />
                <div className="w-[42%] bg-cyan-500/50" title="Mixed-Semidiurnal" />
                <div className="w-[25%] bg-green-500/50" title="Mixed-Diurnal" />
                <div className="w-[25%] bg-amber-500/50" title="Diurnal" />
              </div>

              {/* Marker for current station */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{
                  left: `${Math.min(formNumber / 4 * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex text-xs text-slate-400 justify-between">
              <span>0</span>
              <span>0.25</span>
              <span>1.5</span>
              <span>3.0</span>
              <span>4.0+</span>
            </div>
            <div className="flex text-xs mt-1 justify-between">
              <span className="text-blue-400">Semi</span>
              <span className="text-cyan-400">Mixed-Semi</span>
              <span className="text-green-400">Mixed-Di</span>
              <span className="text-amber-400">Diurnal</span>
            </div>
          </div>

          {/* Characteristics */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-3">Characteristics of {typeInfo.title}</h3>
            <ul className="space-y-2">
              {typeInfo.characteristics.map((char, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className={colorClasses.text}>•</span>
                  <span>{char}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why This Type? */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-3">Why Does This Station Have {tidalType} Tides?</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              {tidalType === 'semidiurnal' && (
                <>
                  This station has strong semidiurnal constituents (M₂ and S₂) because it's connected
                  to ocean basins that resonate at semidiurnal frequencies. The Atlantic Ocean, for
                  instance, has natural periods that amplify twice-daily oscillations.
                </>
              )}
              {tidalType === 'mixed-semidiurnal' && (
                <>
                  This station shows both semidiurnal and diurnal influences. The Pacific Ocean and
                  its marginal seas have geometry that allows both frequencies to propagate effectively.
                  The diurnal inequality depends strongly on the Moon's declination.
                </>
              )}
              {tidalType === 'mixed-diurnal' && (
                <>
                  Diurnal constituents are nearly as strong as semidiurnal here. This often occurs
                  in semi-enclosed basins where the geometry suppresses semidiurnal resonance while
                  allowing diurnal waves. The Gulf of Mexico is a classic example.
                </>
              )}
              {tidalType === 'diurnal' && (
                <>
                  Diurnal tides dominate here because the local geometry (basin shape, depth,
                  connection to open ocean) resonates at the diurnal period (~25 hours) rather than
                  the semidiurnal period (~12.4 hours). This is relatively rare globally.
                </>
              )}
            </p>
            <div className="text-xs text-slate-500">
              <strong>Key factors:</strong> Basin geometry, water depth, connection to open ocean,
              continental shelf width, and proximity to amphidromic points all influence which
              frequencies are amplified or suppressed at a given location.
            </div>
          </div>

          {/* Diurnal Inequality Explanation */}
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <h3 className="text-cyan-400 font-medium mb-2">About Diurnal Inequality</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              When the Moon is not over the equator (has nonzero declination), the two tidal bulges
              it creates are of unequal size. A location passes through the larger bulge once and
              the smaller bulge once per day, creating <strong>diurnal inequality</strong> - one
              high tide is higher than the other.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              The K₁ and O₁ constituents capture this effect. When they're large compared to M₂
              and S₂, you get significant inequality between consecutive highs and lows.
            </p>
          </div>

          {/* Compare with other types */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-white font-medium mb-3">Compare: Stations by Tidal Type</h3>
            <div className="space-y-2">
              {Object.entries(TIDAL_TYPE_INFO).map(([type, info]) => {
                const example = STATIONS.find(s => getTidalType(s) === type);
                if (!example) return null;
                const isCurrent = type === tidalType;
                const colors = {
                  blue: 'bg-blue-500/20 text-blue-400',
                  cyan: 'bg-cyan-500/20 text-cyan-400',
                  green: 'bg-green-500/20 text-green-400',
                  amber: 'bg-amber-500/20 text-amber-400',
                }[info.color] || 'bg-slate-500/20 text-slate-400';

                const exM2 = example.constituents.find(c => c.symbol === 'M2')?.amplitude ?? 0;
                const exS2 = example.constituents.find(c => c.symbol === 'S2')?.amplitude ?? 0;
                const exK1 = example.constituents.find(c => c.symbol === 'K1')?.amplitude ?? 0;
                const exO1 = example.constituents.find(c => c.symbol === 'O1')?.amplitude ?? 0;
                const exForm = (exK1 + exO1) / (exM2 + exS2 || 0.001);

                return (
                  <div
                    key={type}
                    className={`p-2 rounded border ${isCurrent ? 'border-white/30 bg-slate-700/50' : 'border-transparent bg-slate-700/30'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${colors}`}>
                          {info.title.split(' ')[0]}
                        </span>
                        <span className="text-white text-sm">
                          {example.name}{example.state ? `, ${example.state}` : ''}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-slate-400">(current)</span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs font-mono">
                        F = {exForm.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 text-center text-xs text-slate-500">
          Classification based on Dietrich (1963) form number formula
        </div>
      </div>
    </div>
  );
}
