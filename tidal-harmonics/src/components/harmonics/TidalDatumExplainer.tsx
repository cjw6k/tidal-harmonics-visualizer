import { useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

/**
 * Tidal Datum Explainer Component
 *
 * Explains the various tidal datum levels used as reference points for
 * tide measurements and charting. Shows a visual diagram of how different
 * datums relate to each other.
 */

interface DatumInfo {
  abbrev: string;
  name: string;
  description: string;
  usage: string;
  position: number; // Relative position (0-100) for visual
  color: string;
}

const TIDAL_DATUMS: DatumInfo[] = [
  {
    abbrev: 'HAT',
    name: 'Highest Astronomical Tide',
    description: 'The highest predicted tide level over a 19-year period (one complete nodal cycle).',
    usage: 'Used for bridge clearances, overhead cables, and maximum flood planning.',
    position: 95,
    color: '#ef4444',
  },
  {
    abbrev: 'MHHW',
    name: 'Mean Higher High Water',
    description: 'Average of the higher high water heights each tidal day over the National Tidal Datum Epoch.',
    usage: 'Defines shoreline for legal and regulatory purposes. Used for coastal flood mapping.',
    position: 80,
    color: '#f97316',
  },
  {
    abbrev: 'MHW',
    name: 'Mean High Water',
    description: 'Average of all high water heights observed over the National Tidal Datum Epoch.',
    usage: 'Traditional boundary between public tidelands and private uplands in many jurisdictions.',
    position: 70,
    color: '#f59e0b',
  },
  {
    abbrev: 'DTL',
    name: 'Diurnal Tide Level',
    description: 'Average of MHHW, MLLW, MLHW, and MHLW. A mean tide level for areas with diurnal tides.',
    usage: 'Regional reference for areas with predominantly diurnal tides.',
    position: 55,
    color: '#eab308',
  },
  {
    abbrev: 'MTL',
    name: 'Mean Tide Level',
    description: 'Average of MHW and MLW, equivalent to MSL for most practical purposes.',
    usage: 'General reference for average water level conditions.',
    position: 50,
    color: '#84cc16',
  },
  {
    abbrev: 'MSL',
    name: 'Mean Sea Level',
    description: 'Average of all hourly water levels over the National Tidal Datum Epoch (typically 19 years).',
    usage: 'Primary reference for elevations on land. Used for surveying and mapping.',
    position: 48,
    color: '#22c55e',
  },
  {
    abbrev: 'MLW',
    name: 'Mean Low Water',
    description: 'Average of all low water heights observed over the National Tidal Datum Epoch.',
    usage: 'Used on some older nautical charts as chart datum.',
    position: 30,
    color: '#14b8a6',
  },
  {
    abbrev: 'MLLW',
    name: 'Mean Lower Low Water',
    description: 'Average of the lower low water heights each tidal day over the National Tidal Datum Epoch.',
    usage: 'Chart datum for U.S. nautical charts. Depths shown on charts are measured from MLLW.',
    position: 20,
    color: '#0ea5e9',
  },
  {
    abbrev: 'LAT',
    name: 'Lowest Astronomical Tide',
    description: 'The lowest predicted tide level over a 19-year period (one complete nodal cycle).',
    usage: 'Chart datum used internationally (IHO). Ensures charted depths are rarely exceeded.',
    position: 5,
    color: '#3b82f6',
  },
];

// Additional international/regional datums
const REGIONAL_DATUMS: Record<string, { name: string; description: string }> = {
  ODN: {
    name: 'Ordnance Datum Newlyn',
    description: 'UK national vertical datum, based on mean sea level at Newlyn, Cornwall (1915-1921).',
  },
  CD: {
    name: 'Chart Datum',
    description: 'The level below which depths are shown on a nautical chart. Varies by region.',
  },
  NAVD88: {
    name: 'North American Vertical Datum of 1988',
    description: 'Modern fixed geodetic datum for North America, approximately equal to MSL.',
  },
  NGVD29: {
    name: 'National Geodetic Vertical Datum of 1929',
    description: 'Historical US vertical datum (Sea Level Datum of 1929), replaced by NAVD 88.',
  },
};

interface TidalDatumExplainerProps {
  onClose?: () => void;
}

export function TidalDatumExplainer({ onClose }: TidalDatumExplainerProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [selectedDatum, setSelectedDatum] = useState<string | null>(null);

  const stationDatum = station?.datum || 'MLLW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Tidal Datums Explained</h2>
            <p className="text-slate-400 text-sm">
              Reference levels for tide measurements and navigation
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
          {/* Station context */}
          {station && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
              <p className="text-slate-300">
                <span className="font-semibold text-cyan-400">{station.name}</span> uses{' '}
                <span className="font-mono font-bold text-amber-400">{stationDatum}</span>{' '}
                as its reference datum.
                {stationDatum === 'MLLW' && (
                  <span className="text-slate-400 ml-1">
                    This means tide predictions show height above Mean Lower Low Water.
                  </span>
                )}
                {stationDatum === 'ODN' && (
                  <span className="text-slate-400 ml-1">
                    This UK station uses Ordnance Datum Newlyn, based on mean sea level.
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Visual diagram */}
            <div className="relative">
              <h3 className="text-lg font-semibold text-white mb-3">Datum Levels</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <svg viewBox="0 0 300 400" className="w-full max-w-sm mx-auto">
                  {/* Background water gradient */}
                  <defs>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <rect x={60} y={20} width={180} height={360} fill="url(#waterGrad)" rx={4} />

                  {/* Datum lines */}
                  {TIDAL_DATUMS.map((datum) => {
                    const y = 380 - (datum.position / 100) * 360;
                    const isSelected = selectedDatum === datum.abbrev;
                    const isStationDatum = datum.abbrev === stationDatum;

                    return (
                      <g
                        key={datum.abbrev}
                        className="cursor-pointer"
                        onClick={() => setSelectedDatum(isSelected ? null : datum.abbrev)}
                      >
                        {/* Reference line */}
                        <line
                          x1={60}
                          x2={240}
                          y1={y}
                          y2={y}
                          stroke={datum.color}
                          strokeWidth={isStationDatum ? 3 : isSelected ? 2 : 1.5}
                          strokeDasharray={datum.abbrev === 'MTL' || datum.abbrev === 'DTL' ? '4,2' : undefined}
                        />

                        {/* Label */}
                        <text
                          x={55}
                          y={y + 4}
                          fill={datum.color}
                          fontSize={isSelected || isStationDatum ? 12 : 10}
                          fontWeight={isStationDatum ? 'bold' : 'normal'}
                          textAnchor="end"
                        >
                          {datum.abbrev}
                        </text>

                        {/* Highlight for station datum */}
                        {isStationDatum && (
                          <circle
                            cx={250}
                            cy={y}
                            r={6}
                            fill={datum.color}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Scale arrows */}
                  <path d="M275 50 L275 350" stroke="#64748b" strokeWidth={1} markerEnd="url(#arrowDown)" markerStart="url(#arrowUp)" />
                  <text x={285} y={200} fill="#64748b" fontSize={10} transform="rotate(90 285 200)">Water Level</text>

                  {/* Arrow markers */}
                  <defs>
                    <marker id="arrowUp" markerWidth={6} markerHeight={6} refX={3} refY={6} orient="auto">
                      <path d="M0,6 L3,0 L6,6" fill="none" stroke="#64748b" strokeWidth={1} />
                    </marker>
                    <marker id="arrowDown" markerWidth={6} markerHeight={6} refX={3} refY={0} orient="auto">
                      <path d="M0,0 L3,6 L6,0" fill="none" stroke="#64748b" strokeWidth={1} />
                    </marker>
                  </defs>

                  {/* Labels */}
                  <text x={150} y={15} fill="#94a3b8" fontSize={10} textAnchor="middle">Higher</text>
                  <text x={150} y={395} fill="#94a3b8" fontSize={10} textAnchor="middle">Lower</text>
                </svg>

                <p className="text-xs text-slate-500 text-center mt-2">
                  Click a datum to see details. Your station's datum is highlighted.
                </p>
              </div>
            </div>

            {/* Description panel */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {selectedDatum ? (
                  <span style={{ color: TIDAL_DATUMS.find(d => d.abbrev === selectedDatum)?.color }}>
                    {selectedDatum}
                  </span>
                ) : (
                  'What are Tidal Datums?'
                )}
              </h3>

              {selectedDatum ? (
                (() => {
                  const datum = TIDAL_DATUMS.find(d => d.abbrev === selectedDatum);
                  if (!datum) return null;
                  return (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium">{datum.name}</h4>
                        <p className="text-slate-300 mt-1">{datum.description}</p>
                      </div>
                      <div>
                        <h4 className="text-cyan-400 text-sm font-medium">Primary Uses</h4>
                        <p className="text-slate-400 text-sm mt-1">{datum.usage}</p>
                      </div>
                      {datum.abbrev === stationDatum && (
                        <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                          <p className="text-amber-300 text-sm">
                            This is the datum used by your currently selected station.
                            All tide heights are measured relative to this level.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4 text-sm">
                  <p className="text-slate-300">
                    A <strong className="text-white">tidal datum</strong> is a standard reference
                    level from which water depths and tide heights are measured. Different datums
                    are used for different purposes.
                  </p>

                  <div className="space-y-2">
                    <h4 className="text-cyan-400 font-medium">Why Multiple Datums?</h4>
                    <ul className="text-slate-400 space-y-1 list-disc list-inside">
                      <li><strong className="text-white">Navigation:</strong> Charts use low water datums (MLLW, LAT) to show minimum depths</li>
                      <li><strong className="text-white">Flood planning:</strong> Uses high water datums (MHHW, HAT) for worst-case scenarios</li>
                      <li><strong className="text-white">Property boundaries:</strong> Often defined by MHW or MHHW</li>
                      <li><strong className="text-white">Engineering:</strong> Bridge clearances use HAT</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-cyan-400 font-medium">The 19-Year Epoch</h4>
                    <p className="text-slate-400">
                      Most tidal datums are averaged over a 19-year period called the{' '}
                      <strong className="text-white">National Tidal Datum Epoch</strong>.
                      This covers one complete lunar nodal cycle, capturing all astronomical
                      variations in the tides.
                    </p>
                  </div>

                  <p className="text-slate-500 text-xs mt-4">
                    Click on a datum in the diagram to learn more about it.
                  </p>
                </div>
              )}

              {/* Regional datums note */}
              {(stationDatum === 'ODN' || selectedDatum === 'ODN') && REGIONAL_DATUMS.ODN && (
                <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                  <h4 className="text-white font-medium text-sm">About ODN</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {REGIONAL_DATUMS.ODN.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* All datums table */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-3">Quick Reference</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="py-2 px-3 text-slate-400 font-medium">Datum</th>
                    <th className="py-2 px-3 text-slate-400 font-medium">Full Name</th>
                    <th className="py-2 px-3 text-slate-400 font-medium">Primary Use</th>
                  </tr>
                </thead>
                <tbody>
                  {TIDAL_DATUMS.map((datum) => (
                    <tr
                      key={datum.abbrev}
                      className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${
                        datum.abbrev === stationDatum ? 'bg-amber-900/20' : ''
                      }`}
                      onClick={() => setSelectedDatum(datum.abbrev === selectedDatum ? null : datum.abbrev)}
                    >
                      <td className="py-2 px-3">
                        <span className="font-mono font-bold" style={{ color: datum.color }}>
                          {datum.abbrev}
                        </span>
                        {datum.abbrev === stationDatum && (
                          <span className="ml-2 text-xs text-amber-400">current</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-300">{datum.name}</td>
                      <td className="py-2 px-3 text-slate-400 text-xs">{datum.usage.split('.')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational footer */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-300">
            <p className="mb-2">
              <strong className="text-cyan-400">Why does this matter for tide predictions?</strong>
            </p>
            <p>
              When you see a predicted tide height of "1.5 meters", that height is measured
              relative to the datum. For US stations using MLLW, a height of 0.0 meters
              means the water is at the average lower low water level. Negative values
              indicate water below this reference level—important for navigation to avoid
              running aground!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
