import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: '#3b82f6',
  diurnal: '#22c55e',
  'long-period': '#f59e0b',
  'shallow-water': '#a855f7',
};

interface SpectrumBar {
  symbol: string;
  speed: number;
  amplitude: number;
  period: number;
  family: string;
  name: string;
}

// Reference frequencies for key astronomical cycles
const REFERENCE_FREQUENCIES = [
  { speed: 15.0, label: 'Earth rotation', color: '#ef4444' },
  { speed: 14.4920521, label: 'Moon transit (M)', color: '#3b82f6' },
  { speed: 0.5443747, label: 'Moon orbit (s)', color: '#22c55e' },
];

/**
 * FrequencySpectrum
 *
 * Displays constituent speeds as a frequency spectrum.
 * This is a classic visualization in harmonic analysis,
 * showing how constituents cluster around key frequencies.
 */
export function FrequencySpectrum() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [zoomRange, setZoomRange] = useState<'all' | 'diurnal' | 'semidiurnal'>('all');
  const [showAmplitude, setShowAmplitude] = useState(true);

  const spectrumData = useMemo(() => {
    if (!station) return [] as SpectrumBar[];

    const data: SpectrumBar[] = station.constituents
      .map((c) => {
        const info = CONSTITUENTS[c.symbol];
        if (!info) return null;

        return {
          symbol: c.symbol,
          speed: info.speed,
          amplitude: c.amplitude,
          period: 360 / info.speed,
          family: info.family as string,
          name: info.name,
        } satisfies SpectrumBar;
      })
      .filter((d): d is SpectrumBar => d !== null)
      .sort((a, b) => a.speed - b.speed);

    // Apply zoom filtering
    if (zoomRange === 'diurnal') {
      return data.filter((d) => d.speed >= 13 && d.speed <= 16);
    } else if (zoomRange === 'semidiurnal') {
      return data.filter((d) => d.speed >= 28 && d.speed <= 31);
    }

    return data;
  }, [station, zoomRange]);

  // Calculate domain
  const domain = useMemo(() => {
    if (spectrumData.length === 0) return [0, 35];

    if (zoomRange === 'diurnal') {
      return [13, 16];
    } else if (zoomRange === 'semidiurnal') {
      return [28, 31];
    }

    return [0, 35];
  }, [spectrumData, zoomRange]);

  // Reference lines for current zoom
  const visibleReferences = useMemo(() => {
    const min = domain[0] ?? 0;
    const max = domain[1] ?? 35;
    return REFERENCE_FREQUENCIES.filter((r) => r.speed >= min && r.speed <= max);
  }, [domain]);

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view frequency spectrum
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Frequency Spectrum</h3>

      <p className="text-slate-400 text-xs mb-3">
        Constituent angular speeds (°/hour). Height = {showAmplitude ? 'amplitude' : 'uniform'}.
      </p>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex gap-1">
          <button
            onClick={() => setZoomRange('all')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              zoomRange === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setZoomRange('diurnal')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              zoomRange === 'diurnal'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Diurnal
          </button>
          <button
            onClick={() => setZoomRange('semidiurnal')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              zoomRange === 'semidiurnal'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            Semi
          </button>
        </div>

        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showAmplitude}
            onChange={(e) => setShowAmplitude(e.target.checked)}
            className="rounded"
          />
          <span className="text-slate-400">Scale by amplitude</span>
        </label>
      </div>

      {/* Spectrum chart */}
      <div className="w-full h-40">
        <ResponsiveContainer>
          <BarChart
            data={spectrumData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barCategoryGap="5%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="speed"
              type="number"
              domain={domain}
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              tickFormatter={(v: number) => `${v.toFixed(2)}m`}
              hide={!showAmplitude}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '10px',
              }}
              formatter={(_value, _name, props) => {
                const entry = props.payload as SpectrumBar;
                return [
                  `${entry.amplitude.toFixed(3)}m`,
                  `${entry.symbol} (${entry.name})`,
                ];
              }}
              labelFormatter={(label) => `${Number(label).toFixed(4)}°/h`}
            />

            {/* Reference lines for astronomical frequencies */}
            {visibleReferences.map((ref) => (
              <ReferenceLine
                key={ref.label}
                x={ref.speed}
                stroke={ref.color}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            ))}

            <Bar dataKey={showAmplitude ? 'amplitude' : () => 0.5}>
              {spectrumData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={FAMILY_COLORS[entry.family] ?? '#888'}
                  opacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reference legend */}
      {visibleReferences.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
          {visibleReferences.map((ref) => (
            <div key={ref.label} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ref.color }}
              />
              <span className="text-slate-400">{ref.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Family legend */}
      <div className="flex gap-3 mt-2 text-xs">
        {Object.entries(FAMILY_COLORS).map(([family, color]) => (
          <div key={family} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-400">
              {family === 'semidiurnal'
                ? 'Semi'
                : family === 'diurnal'
                ? 'Di'
                : family === 'long-period'
                ? 'Long'
                : 'SW'}
            </span>
          </div>
        ))}
      </div>

      {/* Key constituents in view */}
      <div className="mt-3 space-y-1">
        <h4 className="text-xs text-slate-500">Top in view</h4>
        {spectrumData
          .sort((a, b) => b.amplitude - a.amplitude)
          .slice(0, 4)
          .map((c) => (
            <div key={c.symbol} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: FAMILY_COLORS[c.family] ?? '#888' }}
                />
                <span className="text-white font-mono">{c.symbol}</span>
                <span className="text-slate-500 text-[10px]">{c.name}</span>
              </div>
              <div className="text-slate-400">
                {c.speed.toFixed(4)}°/h • {c.period.toFixed(1)}h
              </div>
            </div>
          ))}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Reading the spectrum:</strong>
        <p className="mt-1">
          Constituents cluster around key frequencies: ~15°/h (diurnal) and ~30°/h
          (semidiurnal). The exact speeds differ by small amounts that encode
          astronomical modulations. Zoom to see fine structure.
        </p>
      </div>
    </div>
  );
}
