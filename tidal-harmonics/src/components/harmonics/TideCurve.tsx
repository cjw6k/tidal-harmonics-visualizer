import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';

interface ChartDataPoint {
  time: number;
  height: number;
  label: string;
}

export function TideCurve() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const hoursRange = useHarmonicsStore((s) => s.chartHoursRange);

  const { data, extremes, nowLabel, minHeight, maxHeight } = useMemo(() => {
    if (!station) {
      return { data: [], extremes: [], nowLabel: '', minHeight: -1, maxHeight: 1 };
    }

    const now = new Date(epoch);
    const start = new Date(now.getTime() - (hoursRange / 2) * 3600000);
    const end = new Date(now.getTime() + (hoursRange / 2) * 3600000);

    const series = predictTideSeries(station, start, end, 6);
    const chartData: ChartDataPoint[] = series.map((d) => ({
      time: d.time.getTime(),
      height: d.height,
      label: format(d.time, 'HH:mm'),
    }));

    const extremeList = findExtremes(series);

    // Calculate y-axis bounds
    let min = Math.min(...chartData.map((d) => d.height));
    let max = Math.max(...chartData.map((d) => d.height));
    // Add padding
    const padding = (max - min) * 0.1;
    min -= padding;
    max += padding;

    return {
      data: chartData,
      extremes: extremeList,
      nowLabel: format(now, 'HH:mm'),
      minHeight: min,
      maxHeight: max,
    };
  }, [epoch, station, hoursRange]);

  if (!station) {
    return (
      <div className="w-full h-48 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500">
        Select a station
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs text-slate-400">Tide Prediction</h3>
        <span className="text-xs text-slate-500">{station.name}</span>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              interval={Math.floor(data.length / 8)}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              domain={[minHeight, maxHeight]}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '11px',
              }}
              formatter={(value) => {
                const num = typeof value === 'number' ? value : 0;
                return [`${num.toFixed(2)}m`, 'Height'];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {/* Current time marker */}
            <ReferenceLine x={nowLabel} stroke="#ef4444" strokeDasharray="5 5" />
            {/* Zero line */}
            <ReferenceLine y={0} stroke="#475569" />
            <Line
              type="monotone"
              dataKey="height"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* High/Low tide info */}
      <div className="flex gap-4 mt-2 text-xs">
        {extremes.slice(0, 4).map((e, i) => (
          <span
            key={i}
            className={e.type === 'high' ? 'text-blue-400' : 'text-cyan-400'}
          >
            {e.type === 'high' ? '▲' : '▼'} {format(e.time, 'HH:mm')}: {e.height.toFixed(2)}m
          </span>
        ))}
      </div>
    </div>
  );
}
