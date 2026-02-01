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
import { STATIONS, getTidalType, getTidalTypeLabel } from '@/data/stations';
import { predictTideSeries } from '@/lib/harmonics';
import type { TideStation } from '@/types/harmonics';

const STATION_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
];

/**
 * StationComparison
 *
 * Compare tidal patterns between multiple stations simultaneously.
 * Helps understand how geography affects tidal type and range.
 */
export function StationComparison() {
  const epoch = useTimeStore((s) => s.epoch);
  const primaryStation = useHarmonicsStore((s) => s.selectedStation);
  const [comparisonStations, setComparisonStations] = useState<string[]>([]);

  const toggleStation = (stationId: string) => {
    setComparisonStations((prev) =>
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : prev.length < 3
        ? [...prev, stationId]
        : prev
    );
  };

  const { chartData, stationStats } = useMemo(() => {
    const allStations: TideStation[] = [
      primaryStation,
      ...comparisonStations
        .map((id) => STATIONS.find((s) => s.id === id))
        .filter((s): s is TideStation => s !== undefined),
    ].filter((s): s is TideStation => s !== null && s !== undefined);

    if (allStations.length === 0) {
      return { chartData: [], stationStats: [] };
    }

    const now = new Date(epoch);
    const start = new Date(now.getTime() - 12 * 3600000);
    const end = new Date(now.getTime() + 12 * 3600000);

    // Generate predictions for each station
    const predictions = allStations.map((station) => ({
      station,
      series: predictTideSeries(station, start, end, 10),
    }));

    // Build combined chart data
    const data: Record<string, unknown>[] = [];
    const firstPrediction = predictions[0];
    if (!firstPrediction) {
      return { chartData: [], stationStats: [] };
    }
    const timePoints = firstPrediction.series.map((p) => p.time.getTime());

    for (let i = 0; i < timePoints.length; i++) {
      const timeValue = timePoints[i];
      if (timeValue === undefined) continue;
      const point: Record<string, unknown> = {
        time: timeValue,
        label: format(new Date(timeValue), 'HH:mm'),
      };

      predictions.forEach((p) => {
        const key = p.station.id;
        point[key] = p.series[i]?.height ?? 0;
      });

      data.push(point);
    }

    // Calculate stats for each station
    const stats = allStations.map((station) => {
      const series = predictions.find((p) => p.station.id === station.id)?.series || [];
      const heights = series.map((p) => p.height);
      const min = Math.min(...heights);
      const max = Math.max(...heights);
      const range = max - min;
      const tidalType = getTidalType(station);

      return {
        station,
        min,
        max,
        range,
        tidalType,
        typeLabel: getTidalTypeLabel(tidalType),
      };
    });

    return { chartData: data, stationStats: stats };
  }, [epoch, primaryStation, comparisonStations]);

  if (!primaryStation) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to compare
      </div>
    );
  }

  // Available stations for comparison (excluding primary)
  const availableStations = STATIONS.filter((s) => s.id !== primaryStation.id);

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Station Comparison</h3>

      <p className="text-slate-400 text-xs mb-3">
        Compare tidal patterns between stations. Select up to 3 additional stations.
      </p>

      {/* Station selector */}
      <div className="mb-3 flex flex-wrap gap-1">
        {availableStations.map((station) => {
          const isSelected = comparisonStations.includes(station.id);
          const colorIndex = comparisonStations.indexOf(station.id) + 1;
          return (
            <button
              key={station.id}
              onClick={() => toggleStation(station.id)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                isSelected
                  ? 'text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              style={{
                backgroundColor: isSelected ? STATION_COLORS[colorIndex] + '33' : undefined,
                borderColor: isSelected ? STATION_COLORS[colorIndex] : undefined,
                color: isSelected ? STATION_COLORS[colorIndex] : undefined,
              }}
              disabled={!isSelected && comparisonStations.length >= 3}
            >
              {station.name}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              interval={Math.floor(chartData.length / 6)}
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
                const station = STATIONS.find((s) => s.id === name);
                return [`${num.toFixed(2)}m`, station?.name || name];
              }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />

            {/* Primary station */}
            <Line
              type="monotone"
              dataKey={primaryStation.id}
              name={primaryStation.name}
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />

            {/* Comparison stations */}
            {comparisonStations.map((id, index) => {
              const station = STATIONS.find((s) => s.id === id);
              if (!station) return null;
              const color = STATION_COLORS[index + 1] || '#888888';
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={station.name}
                  stroke={color}
                  dot={false}
                  strokeWidth={1.5}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Station stats comparison */}
      <div className="mt-3 space-y-2">
        {stationStats.map((stat, index) => (
          <div
            key={stat.station.id}
            className="flex items-center justify-between p-2 rounded"
            style={{ backgroundColor: STATION_COLORS[index] + '15' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATION_COLORS[index] }}
              />
              <span className="text-white text-sm">{stat.station.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Range: <span className="text-white">{stat.range.toFixed(2)}m</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  stat.tidalType === 'semidiurnal'
                    ? 'bg-blue-500/20 text-blue-400'
                    : stat.tidalType === 'mixed-semidiurnal'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : stat.tidalType === 'mixed-diurnal'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {stat.tidalType.replace('-', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Educational note */}
      {comparisonStations.length > 0 && (
        <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
          <strong className="text-slate-400">What to look for:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Different tidal ranges reflect local geography</li>
            <li>Semidiurnal stations show two similar highs/day</li>
            <li>Mixed stations show unequal daily highs</li>
            <li>Phase differences show tidal wave propagation</li>
          </ul>
        </div>
      )}
    </div>
  );
}
