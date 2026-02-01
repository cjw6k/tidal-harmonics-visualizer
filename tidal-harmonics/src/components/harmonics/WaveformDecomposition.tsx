import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import { predictTideFromConstituents, predictTide } from '@/lib/harmonics';

const CONSTITUENT_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

interface WaveformDataPoint {
  hour: number;
  total: number;
  [key: string]: number;
}

/**
 * WaveformDecomposition
 *
 * Shows how individual constituent sine waves combine to form the total tide.
 * Helps users understand the superposition principle of harmonic analysis.
 */
export function WaveformDecomposition() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [selectedConstituents, setSelectedConstituents] = useState<string[]>(['M2', 'S2', 'K1', 'O1']);
  const [showTotal, setShowTotal] = useState(true);
  const [hoursToShow, setHoursToShow] = useState(25);

  const availableConstituents = useMemo(() => {
    if (!station) return [];
    return station.constituents
      .map((c) => ({
        symbol: c.symbol,
        amplitude: c.amplitude,
        info: CONSTITUENTS[c.symbol],
      }))
      .filter((c) => c.amplitude > 0.01) // Only show significant ones
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 10); // Top 10
  }, [station]);

  const waveformData = useMemo(() => {
    if (!station) return [];

    const data: WaveformDataPoint[] = [];
    const startTime = new Date(epoch);

    for (let h = 0; h <= hoursToShow; h++) {
      const time = new Date(startTime.getTime() + h * 3600000);
      const point: WaveformDataPoint = { hour: h, total: predictTide(station, time) };

      // Calculate each selected constituent's contribution
      for (const symbol of selectedConstituents) {
        const height = predictTideFromConstituents(station, time, [symbol]);
        point[symbol] = height;
      }

      data.push(point);
    }

    return data;
  }, [epoch, station, selectedConstituents, hoursToShow]);

  const toggleConstituent = (symbol: string) => {
    setSelectedConstituents((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view waveform decomposition
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Waveform Decomposition</h3>

      <p className="text-slate-400 text-xs mb-3">
        See how individual constituent sine waves combine to form the tide.
      </p>

      {/* Constituent toggles */}
      <div className="flex flex-wrap gap-1 mb-3">
        {availableConstituents.map((c, i) => {
          const isSelected = selectedConstituents.includes(c.symbol);
          const colorIndex = i % CONSTITUENT_COLORS.length;
          const color = CONSTITUENT_COLORS[colorIndex] ?? '#888888';
          return (
            <button
              key={c.symbol}
              onClick={() => toggleConstituent(c.symbol)}
              className={`px-2 py-0.5 text-xs rounded transition-colors border ${
                isSelected
                  ? 'text-white border-current'
                  : 'text-slate-500 border-slate-600 hover:border-slate-500'
              }`}
              style={isSelected ? { borderColor: color, color } : undefined}
              title={`${c.info?.name || c.symbol} (${c.amplitude.toFixed(3)}m)`}
            >
              {c.symbol}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showTotal}
            onChange={(e) => setShowTotal(e.target.checked)}
            className="rounded"
          />
          <span className="text-slate-400">Show total</span>
        </label>
        <label className="flex items-center gap-1">
          <span className="text-slate-400">Hours:</span>
          <select
            value={hoursToShow}
            onChange={(e) => setHoursToShow(Number(e.target.value))}
            className="bg-slate-800 text-white rounded px-1 py-0.5"
          >
            <option value={13}>13h (1 cycle)</option>
            <option value={25}>25h (2 cycles)</option>
            <option value={49}>49h (4 cycles)</option>
          </select>
        </label>
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer>
          <LineChart data={waveformData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${v}h`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${v.toFixed(1)}m`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '11px',
              }}
              formatter={(value) => [
                `${Number(value).toFixed(3)}m`,
                undefined,
              ]}
              labelFormatter={(label) => `${label} hours`}
            />

            {/* Individual constituent waves */}
            {selectedConstituents.map((symbol, i) => {
              const colorIndex = i % CONSTITUENT_COLORS.length;
              const color = CONSTITUENT_COLORS[colorIndex] ?? '#888888';
              return (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  opacity={0.7}
                />
              );
            })}

            {/* Total tide */}
            {showTotal && (
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
              />
            )}

            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value: string) => (value === 'total' ? 'Total' : value)}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Selected constituents info */}
      <div className="mt-3 space-y-1">
        {selectedConstituents.slice(0, 4).map((symbol, i) => {
          const constituent = station.constituents.find((c) => c.symbol === symbol);
          const info = CONSTITUENTS[symbol];
          const colorIndex = i % CONSTITUENT_COLORS.length;
          const color = CONSTITUENT_COLORS[colorIndex] ?? '#888888';
          if (!constituent || !info) return null;

          const period = 360 / info.speed;
          return (
            <div key={symbol} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
                <span className="text-white font-mono">{symbol}</span>
                <span className="text-slate-500">{info.name}</span>
              </div>
              <div className="text-slate-400">
                {constituent.amplitude.toFixed(3)}m • {period.toFixed(1)}h period
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Superposition:</strong>
        <p className="mt-1">
          The total tide (white line) is the sum of all constituent waves. Try toggling
          constituents on/off to see how M2 (main lunar) and S2 (main solar) create the
          spring-neap cycle, or how K1 and O1 create diurnal inequality.
        </p>
      </div>
    </div>
  );
}
