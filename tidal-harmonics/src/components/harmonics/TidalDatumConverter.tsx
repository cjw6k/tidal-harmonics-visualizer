import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

// Standard tidal datums with typical offsets from MLLW (in meters)
// Note: These are representative values; actual values vary by station
interface DatumInfo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  typicalOffset: number; // From MLLW
  color: string;
}

const DATUMS: DatumInfo[] = [
  {
    id: 'HAT',
    name: 'HAT',
    fullName: 'Highest Astronomical Tide',
    description: 'The highest tide level that can be predicted under average meteorological conditions',
    typicalOffset: 2.2,
    color: 'bg-red-500'
  },
  {
    id: 'MHHW',
    name: 'MHHW',
    fullName: 'Mean Higher High Water',
    description: 'Average of the higher high water height of each tidal day',
    typicalOffset: 1.8,
    color: 'bg-orange-500'
  },
  {
    id: 'MHW',
    name: 'MHW',
    fullName: 'Mean High Water',
    description: 'Average of all high water heights',
    typicalOffset: 1.6,
    color: 'bg-amber-500'
  },
  {
    id: 'DTL',
    name: 'DTL',
    fullName: 'Diurnal Tide Level',
    description: 'Midpoint between MHHW and MLLW',
    typicalOffset: 0.9,
    color: 'bg-yellow-500'
  },
  {
    id: 'MTL',
    name: 'MTL',
    fullName: 'Mean Tide Level',
    description: 'Midpoint between MHW and MLW',
    typicalOffset: 0.85,
    color: 'bg-lime-500'
  },
  {
    id: 'MSL',
    name: 'MSL',
    fullName: 'Mean Sea Level',
    description: 'Average water level over 19-year National Tidal Datum Epoch',
    typicalOffset: 0.8,
    color: 'bg-green-500'
  },
  {
    id: 'NAVD88',
    name: 'NAVD88',
    fullName: 'North American Vertical Datum of 1988',
    description: 'Fixed geodetic datum, not tide-based (US standard)',
    typicalOffset: 0.75,
    color: 'bg-emerald-500'
  },
  {
    id: 'MLW',
    name: 'MLW',
    fullName: 'Mean Low Water',
    description: 'Average of all low water heights',
    typicalOffset: 0.2,
    color: 'bg-teal-500'
  },
  {
    id: 'MLLW',
    name: 'MLLW',
    fullName: 'Mean Lower Low Water',
    description: 'Average of the lower low water height of each tidal day (US chart datum)',
    typicalOffset: 0,
    color: 'bg-cyan-500'
  },
  {
    id: 'LAT',
    name: 'LAT',
    fullName: 'Lowest Astronomical Tide',
    description: 'The lowest tide level that can be predicted (UK/international chart datum)',
    typicalOffset: -0.3,
    color: 'bg-blue-500'
  }
];

interface TidalDatumConverterProps {
  onClose: () => void;
}

export function TidalDatumConverter({ onClose }: TidalDatumConverterProps) {
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [inputValue, setInputValue] = useState('1.5');
  const [fromDatum, setFromDatum] = useState('MLLW');
  const [toDatum, setToDatum] = useState('MSL');
  const [showDiagram, setShowDiagram] = useState(true);

  const fromDatumInfo = DATUMS.find(d => d.id === fromDatum)!;
  const toDatumInfo = DATUMS.find(d => d.id === toDatum)!;

  const conversion = useMemo(() => {
    const input = parseFloat(inputValue) || 0;
    // Convert: output = input + (fromOffset - toOffset)
    const offset = fromDatumInfo.typicalOffset - toDatumInfo.typicalOffset;
    return input + offset;
  }, [inputValue, fromDatumInfo, toDatumInfo]);

  const formatValue = (v: number) => {
    if (unitSystem === 'metric') {
      return `${v.toFixed(2)} m`;
    }
    return `${(v * 3.281).toFixed(2)} ft`;
  };

  const formatOffset = (v: number) => {
    const sign = v >= 0 ? '+' : '';
    if (unitSystem === 'metric') {
      return `${sign}${v.toFixed(2)} m`;
    }
    return `${sign}${(v * 3.281).toFixed(2)} ft`;
  };

  // Height of diagram bar for each datum (normalized)
  const getDatumHeight = (datum: DatumInfo) => {
    const minOffset = Math.min(...DATUMS.map(d => d.typicalOffset));
    const maxOffset = Math.max(...DATUMS.map(d => d.typicalOffset));
    const range = maxOffset - minOffset;
    return ((datum.typicalOffset - minOffset) / range) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Tidal Datum Converter</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Explanation */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-sm">
              <span className="text-amber-400 font-medium">Tidal datums</span> are reference levels
              for measuring water heights. Different charts and applications use different datums.
              Use this converter to translate between them.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Note: Offsets shown are typical values. Actual datum relationships vary by location
              and should be verified from official tide tables for your specific station.
            </p>
          </div>

          {/* Converter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
            {/* From */}
            <div>
              <label className="text-sm text-slate-400 block mb-1">From</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  step="0.1"
                  className="w-24 px-3 py-2 bg-slate-700 rounded text-white text-lg"
                />
                <select
                  value={fromDatum}
                  onChange={(e) => setFromDatum(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 rounded text-white"
                >
                  {DATUMS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-500 mt-1">{fromDatumInfo.fullName}</div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <span className="text-3xl text-slate-500">→</span>
            </div>

            {/* To */}
            <div>
              <label className="text-sm text-slate-400 block mb-1">To</label>
              <div className="flex gap-2">
                <div className="w-24 px-3 py-2 bg-blue-900/50 rounded text-blue-300 text-lg font-bold">
                  {conversion.toFixed(2)}
                </div>
                <select
                  value={toDatum}
                  onChange={(e) => setToDatum(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 rounded text-white"
                >
                  {DATUMS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-500 mt-1">{toDatumInfo.fullName}</div>
            </div>
          </div>

          {/* Conversion explanation */}
          <div className="bg-blue-900/30 rounded-lg p-4 mb-6 border border-blue-700/50">
            <div className="text-center text-sm">
              <span className="text-white">{formatValue(parseFloat(inputValue) || 0)}</span>
              <span className="text-slate-400"> above </span>
              <span className="text-amber-400">{fromDatumInfo.name}</span>
              <span className="text-slate-400"> = </span>
              <span className="text-blue-400 font-bold">{formatValue(conversion)}</span>
              <span className="text-slate-400"> above </span>
              <span className="text-cyan-400">{toDatumInfo.name}</span>
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">
              Offset: {formatOffset(fromDatumInfo.typicalOffset - toDatumInfo.typicalOffset)}
            </div>
          </div>

          {/* Toggle diagram */}
          <button
            onClick={() => setShowDiagram(!showDiagram)}
            className="text-sm text-slate-400 hover:text-white mb-4"
          >
            {showDiagram ? '▼ Hide' : '▶ Show'} Datum Diagram
          </button>

          {/* Visual datum diagram */}
          {showDiagram && (
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4">Relative Datum Positions</h3>
              <div className="relative h-80 flex">
                {/* Water column representation */}
                <div className="absolute left-0 right-0 bottom-0 h-1/3 bg-gradient-to-t from-blue-900/30 to-transparent" />

                {/* Datum lines */}
                <div className="flex-1 relative">
                  {DATUMS.map((datum) => {
                    const height = getDatumHeight(datum);
                    const isSelected = datum.id === fromDatum || datum.id === toDatum;

                    return (
                      <div
                        key={datum.id}
                        className={`absolute left-0 right-0 flex items-center transition-all ${
                          isSelected ? 'z-10' : 'z-0'
                        }`}
                        style={{ bottom: `${height}%` }}
                      >
                        <div className={`h-0.5 flex-1 ${datum.color} ${
                          isSelected ? 'opacity-100' : 'opacity-40'
                        }`} />
                        <div className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                          datum.id === fromDatum
                            ? 'bg-amber-600 text-white'
                            : datum.id === toDatum
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {datum.name}
                          <span className="text-[10px] ml-1 opacity-70">
                            {formatOffset(datum.typicalOffset)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Labels */}
                <div className="absolute right-4 top-2 text-xs text-slate-500">Higher water →</div>
                <div className="absolute right-4 bottom-2 text-xs text-slate-500">Lower water →</div>
              </div>
            </div>
          )}

          {/* Datum reference table */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Datum Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {DATUMS.map(datum => (
                <div
                  key={datum.id}
                  className={`p-2 rounded ${
                    datum.id === fromDatum || datum.id === toDatum
                      ? 'bg-slate-700'
                      : 'bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${datum.color}`} />
                    <span className="font-medium text-white">{datum.name}</span>
                    <span className="text-slate-400 text-xs">({datum.fullName})</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1 ml-5">{datum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
