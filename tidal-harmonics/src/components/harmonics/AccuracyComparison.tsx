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
import { format } from 'date-fns';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide, predictTideFromConstituents } from '@/lib/harmonics';

interface ComparisonLevel {
  key: string;
  name: string;
  constituents: string[];
  color: string;
  description: string;
}

const COMPARISON_LEVELS: ComparisonLevel[] = [
  {
    key: 'level1',
    name: 'M2 only',
    constituents: ['M2'],
    color: '#ef4444',
    description: 'Principal lunar semidiurnal - captures basic twice-daily pattern',
  },
  {
    key: 'level2',
    name: 'M2 + S2',
    constituents: ['M2', 'S2'],
    color: '#f59e0b',
    description: 'Add solar - captures spring/neap cycle',
  },
  {
    key: 'level3',
    name: '4 major',
    constituents: ['M2', 'S2', 'K1', 'O1'],
    color: '#22c55e',
    description: 'Add diurnal - captures daily inequality',
  },
  {
    key: 'level4',
    name: '8 common',
    constituents: ['M2', 'S2', 'N2', 'K2', 'K1', 'O1', 'P1', 'Q1'],
    color: '#3b82f6',
    description: 'Add elliptic effects - much improved accuracy',
  },
  {
    key: 'full',
    name: 'All constituents',
    constituents: [], // Empty means use all
    color: '#8b5cf6',
    description: 'Full NOAA prediction - highest accuracy',
  },
];

/**
 * AccuracyComparison
 *
 * Educational component showing how tide prediction accuracy improves
 * as more harmonic constituents are added. Demonstrates why 37+ constituents
 * are needed for accurate predictions.
 */
export function AccuracyComparison() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['level1', 'full']);

  const { data, stats } = useMemo(() => {
    if (!station) {
      return { data: [], stats: {} };
    }

    const now = new Date(epoch);
    const start = new Date(now.getTime() - 12 * 3600000);
    const end = new Date(now.getTime() + 12 * 3600000);
    const intervalMinutes = 10;

    const chartData: Record<string, unknown>[] = [];
    const levelStats: Record<string, { rmsError: number; maxError: number }> = {};

    // Initialize stats tracking
    for (const level of COMPARISON_LEVELS) {
      levelStats[level.key] = { rmsError: 0, maxError: 0 };
    }

    // Generate predictions for each time point
    for (let t = start.getTime(); t <= end.getTime(); t += intervalMinutes * 60 * 1000) {
      const date = new Date(t);
      const point: Record<string, unknown> = {
        time: t,
        label: format(date, 'HH:mm'),
      };

      // Full prediction (reference)
      const fullPrediction = predictTide(station, date);
      point.full = fullPrediction;

      // Each comparison level
      for (const level of COMPARISON_LEVELS) {
        if (level.key === 'full') continue;

        const prediction = predictTideFromConstituents(station, date, level.constituents);
        point[level.key] = prediction;

        // Track error
        const error = Math.abs(fullPrediction - prediction);
        const statEntry = levelStats[level.key];
        if (statEntry) {
          statEntry.rmsError += error * error;
          statEntry.maxError = Math.max(statEntry.maxError, error);
        }
      }

      chartData.push(point);
    }

    // Finalize RMS calculation
    const n = chartData.length;
    for (const level of COMPARISON_LEVELS) {
      if (level.key !== 'full') {
        const statEntry = levelStats[level.key];
        if (statEntry) {
          statEntry.rmsError = Math.sqrt(statEntry.rmsError / n);
        }
      }
    }

    return { data: chartData, stats: levelStats };
  }, [epoch, station]);

  const toggleLevel = (key: string) => {
    setSelectedLevels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to compare accuracy levels
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-3">Prediction Accuracy Comparison</h3>

      <p className="text-slate-400 text-xs mb-3">
        See how adding more constituents improves prediction accuracy. The more constituents,
        the closer to the true prediction (purple line).
      </p>

      {/* Level toggles */}
      <div className="flex flex-wrap gap-2 mb-3">
        {COMPARISON_LEVELS.map((level) => (
          <button
            key={level.key}
            onClick={() => toggleLevel(level.key)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              selectedLevels.includes(level.key)
                ? 'border-transparent'
                : 'border-slate-600 bg-slate-800 text-slate-400'
            }`}
            style={{
              backgroundColor: selectedLevels.includes(level.key) ? level.color + '33' : undefined,
              color: selectedLevels.includes(level.key) ? level.color : undefined,
              borderColor: selectedLevels.includes(level.key) ? level.color + '66' : undefined,
            }}
            title={level.description}
          >
            {level.name}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${v.toFixed(1)}`} />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '11px',
              }}
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : 0;
                const level = COMPARISON_LEVELS.find((l) => l.key === name);
                return [`${num.toFixed(3)}m`, level?.name || name];
              }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />

            {COMPARISON_LEVELS.filter((level) => selectedLevels.includes(level.key)).map(
              (level) => (
                <Line
                  key={level.key}
                  type="monotone"
                  dataKey={level.key}
                  name={level.name}
                  stroke={level.color}
                  dot={false}
                  strokeWidth={level.key === 'full' ? 2.5 : 1.5}
                  strokeDasharray={level.key === 'full' ? '' : '5 5'}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Statistics */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {COMPARISON_LEVELS.filter((l) => l.key !== 'full' && selectedLevels.includes(l.key)).map(
          (level) => (
            <div
              key={level.key}
              className="p-2 rounded text-xs"
              style={{ backgroundColor: level.color + '15' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }} />
                <span className="font-medium" style={{ color: level.color }}>
                  {level.name}
                </span>
              </div>
              <div className="text-slate-400">
                RMS Error: <span className="text-white">{stats[level.key]?.rmsError.toFixed(3)}m</span>
              </div>
              <div className="text-slate-500">
                Max Error: {stats[level.key]?.maxError.toFixed(3)}m
              </div>
            </div>
          )
        )}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
        <strong className="text-slate-300">Why so many constituents?</strong>
        <p className="mt-1">
          Real tides are influenced by many astronomical factors: lunar/solar distances,
          orbital tilts, the 18.6-year nodal cycle, and more. Each constituent captures
          one specific effect. NOAA uses 37+ constituents for official predictions.
        </p>
      </div>
    </div>
  );
}
