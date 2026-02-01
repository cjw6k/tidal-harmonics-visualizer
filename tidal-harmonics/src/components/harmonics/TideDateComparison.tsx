import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  onClose: () => void;
}

export function TideDateComparison({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0] ?? today.toISOString().slice(0, 10);

  const [date1, setDate1] = useState(todayStr);
  const [date2, setDate2] = useState(() => {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0] ?? nextWeek.toISOString().slice(0, 10);
  });

  const useMetric = unitSystem === 'metric';

  // Generate tide data for both dates
  const comparisonData = useMemo(() => {
    if (!station) return { chartData: [], date1Extremes: [], date2Extremes: [] };

    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d1End = new Date(d1);
    d1End.setHours(23, 59, 59, 999);

    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    const d2End = new Date(d2);
    d2End.setHours(23, 59, 59, 999);

    const series1 = predictTideSeries(station, d1, d1End, 15);
    const series2 = predictTideSeries(station, d2, d2End, 15);

    const extremes1 = findExtremes(series1);
    const extremes2 = findExtremes(series2);

    // Normalize to hours for x-axis comparison
    const chartData = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const idx = hour * 4 + min / 15;
        const s1 = series1[idx];
        const s2 = series2[idx];

        chartData.push({
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          hour: hour + min / 60,
          date1: s1 ? (useMetric ? s1.height : s1.height * 3.28084) : null,
          date2: s2 ? (useMetric ? s2.height : s2.height * 3.28084) : null,
        });
      }
    }

    return {
      chartData,
      date1Extremes: extremes1,
      date2Extremes: extremes2,
    };
  }, [station, date1, date2, useMetric]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatHeight = (meters: number) => {
    if (useMetric) {
      return `${meters.toFixed(2)} m`;
    }
    return `${(meters * 3.28084).toFixed(2)} ft`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const { date1Extremes, date2Extremes } = comparisonData;

    const getRange = (extremes: typeof date1Extremes) => {
      if (extremes.length < 2) return { high: null, low: null, range: null };
      const highs = extremes.filter((e) => e.type === 'high').map((e) => e.height);
      const lows = extremes.filter((e) => e.type === 'low').map((e) => e.height);
      const maxHigh = highs.length > 0 ? Math.max(...highs) : null;
      const minLow = lows.length > 0 ? Math.min(...lows) : null;
      return {
        high: maxHigh,
        low: minLow,
        range: maxHigh !== null && minLow !== null ? maxHigh - minLow : null,
      };
    };

    return {
      date1: getRange(date1Extremes),
      date2: getRange(date2Extremes),
    };
  }, [comparisonData]);

  if (!station) return null;

  const heightUnit = useMetric ? 'm' : 'ft';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Tide Date Comparison</h2>
            <p className="text-sm text-slate-400">Compare tidal patterns between dates</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Date Selectors */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-slate-400 mb-1">Date 1 (Blue)</label>
              <input
                type="date"
                value={date1}
                onChange={(e) => setDate1(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-slate-400 mb-1">Date 2 (Orange)</label>
              <input
                type="date"
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-orange-500"
              />
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={comparisonData.chartData}>
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => value.split(':')[0] + ':00'}
                  interval={3}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => `${value.toFixed(1)}`}
                  label={{
                    value: heightUnit,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value, name) => {
                    if (value === undefined || value === null) return ['—', name ?? ''];
                    return [
                      `${Number(value).toFixed(2)} ${heightUnit}`,
                      name === 'date1' ? formatDate(date1) : formatDate(date2),
                    ];
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === 'date1' ? formatDate(date1) : formatDate(date2)
                  }
                />
                <Line
                  type="monotone"
                  dataKey="date1"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="date1"
                />
                <Line
                  type="monotone"
                  dataKey="date2"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="date2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date 1 Stats */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <div className="text-blue-400 font-medium mb-2">{formatDate(date1)}</div>
              <div className="space-y-2 text-sm">
                {stats.date1.high !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">High tide:</span>
                    <span className="text-white">{formatHeight(stats.date1.high)}</span>
                  </div>
                )}
                {stats.date1.low !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Low tide:</span>
                    <span className="text-white">{formatHeight(stats.date1.low)}</span>
                  </div>
                )}
                {stats.date1.range !== null && (
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">Tidal range:</span>
                    <span className="text-blue-300">{formatHeight(stats.date1.range)}</span>
                  </div>
                )}
              </div>
              {/* High/Low times */}
              <div className="mt-3 pt-3 border-t border-blue-800/50">
                {comparisonData.date1Extremes.map((e, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-400">
                    <span>{e.type === 'high' ? 'H' : 'L'} {formatTime(e.time)}</span>
                    <span>{formatHeight(e.height)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date 2 Stats */}
            <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-4">
              <div className="text-orange-400 font-medium mb-2">{formatDate(date2)}</div>
              <div className="space-y-2 text-sm">
                {stats.date2.high !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">High tide:</span>
                    <span className="text-white">{formatHeight(stats.date2.high)}</span>
                  </div>
                )}
                {stats.date2.low !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Low tide:</span>
                    <span className="text-white">{formatHeight(stats.date2.low)}</span>
                  </div>
                )}
                {stats.date2.range !== null && (
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">Tidal range:</span>
                    <span className="text-orange-300">{formatHeight(stats.date2.range)}</span>
                  </div>
                )}
              </div>
              {/* High/Low times */}
              <div className="mt-3 pt-3 border-t border-orange-800/50">
                {comparisonData.date2Extremes.map((e, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-400">
                    <span>{e.type === 'high' ? 'H' : 'L'} {formatTime(e.time)}</span>
                    <span>{formatHeight(e.height)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Difference Summary */}
          {stats.date1.range !== null && stats.date2.range !== null && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-2">Comparison</div>
              <div className="text-white">
                {stats.date2.range > stats.date1.range ? (
                  <>
                    <span className="text-orange-400 font-medium">{formatDate(date2)}</span>
                    {' has '}
                    <span className="font-medium">
                      {formatHeight(stats.date2.range - stats.date1.range)}
                    </span>
                    {' larger tidal range'}
                  </>
                ) : stats.date1.range > stats.date2.range ? (
                  <>
                    <span className="text-blue-400 font-medium">{formatDate(date1)}</span>
                    {' has '}
                    <span className="font-medium">
                      {formatHeight(stats.date1.range - stats.date2.range)}
                    </span>
                    {' larger tidal range'}
                  </>
                ) : (
                  'Both dates have the same tidal range'
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-slate-500">
            Tip: Compare dates 7 days apart to see spring vs neap tide differences, or
            compare the same date in different months to see seasonal variation.
          </div>
        </div>
      </div>
    </div>
  );
}
