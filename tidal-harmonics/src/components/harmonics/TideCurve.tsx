import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import {
  predictTideSeries,
  predictTideSeriesWithConstituents,
  findExtremes,
  type ConstituentSeriesData,
} from '@/lib/harmonics';

type ViewMode = 'total' | 'constituents' | 'groups';

const CONSTITUENT_COLORS = {
  M2: '#3b82f6', // blue
  S2: '#f59e0b', // amber
  K1: '#22c55e', // green
  O1: '#14b8a6', // teal
  semidiurnal: '#6366f1', // indigo
  diurnal: '#10b981', // emerald
  total: '#ef4444', // red
};

export function TideCurve() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const hoursRange = useHarmonicsStore((s) => s.chartHoursRange);
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  const { data, extremes, nowLabel, minHeight, maxHeight } = useMemo(() => {
    if (!station) {
      return { data: [], extremes: [], nowLabel: '', minHeight: -1, maxHeight: 1 };
    }

    const now = new Date(epoch);
    const start = new Date(now.getTime() - (hoursRange / 2) * 3600000);
    const end = new Date(now.getTime() + (hoursRange / 2) * 3600000);

    let chartData: ConstituentSeriesData[];

    if (viewMode === 'total') {
      // Simple mode - just total
      const series = predictTideSeries(station, start, end, 6);
      chartData = series.map((d) => ({
        time: d.time.getTime(),
        total: d.height,
        label: format(d.time, 'HH:mm'),
      }));
    } else {
      // Detailed mode with constituent breakdown
      chartData = predictTideSeriesWithConstituents(station, start, end, 6);
    }

    const extremeList = findExtremes(
      chartData.map(d => ({ time: new Date(d.time), height: d.total }))
    );

    // Calculate y-axis bounds
    let min = Math.min(...chartData.map((d) => d.total));
    let max = Math.max(...chartData.map((d) => d.total));
    // Add padding
    const padding = (max - min) * 0.15;
    min -= padding;
    max += padding;

    return {
      data: chartData,
      extremes: extremeList,
      nowLabel: format(now, 'HH:mm'),
      minHeight: min,
      maxHeight: max,
    };
  }, [epoch, station, hoursRange, viewMode]);

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
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('total')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              viewMode === 'total' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setViewMode('constituents')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              viewMode === 'constituents' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            M2+S2+K1+O1
          </button>
          <button
            onClick={() => setViewMode('groups')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              viewMode === 'groups' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            Semi/Di
          </button>
        </div>
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
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : 0;
                return [`${num.toFixed(2)}m`, name];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {viewMode !== 'total' && (
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
              />
            )}
            {/* Current time marker */}
            <ReferenceLine x={nowLabel} stroke="#ef4444" strokeDasharray="5 5" />
            {/* Zero line */}
            <ReferenceLine y={0} stroke="#475569" />

            {/* Constituent lines based on view mode */}
            {viewMode === 'constituents' && (
              <>
                <Line type="monotone" dataKey="M2" stroke={CONSTITUENT_COLORS.M2} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="S2" stroke={CONSTITUENT_COLORS.S2} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="K1" stroke={CONSTITUENT_COLORS.K1} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="O1" stroke={CONSTITUENT_COLORS.O1} dot={false} strokeWidth={1.5} />
              </>
            )}
            {viewMode === 'groups' && (
              <>
                <Line type="monotone" dataKey="semidiurnal" name="Semidiurnal" stroke={CONSTITUENT_COLORS.semidiurnal} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="diurnal" name="Diurnal" stroke={CONSTITUENT_COLORS.diurnal} dot={false} strokeWidth={1.5} />
              </>
            )}

            {/* Total always shown */}
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={viewMode === 'total' ? '#3b82f6' : CONSTITUENT_COLORS.total}
              dot={false}
              strokeWidth={viewMode === 'total' ? 2 : 2.5}
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
