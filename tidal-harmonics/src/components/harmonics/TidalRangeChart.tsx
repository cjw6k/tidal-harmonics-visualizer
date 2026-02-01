import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { STATIONS, getTidalType } from '@/data/stations';
import { getTidalRange } from '@/lib/harmonics';
import type { TidalType } from '@/data/stations';

const TIDAL_TYPE_COLORS: Record<TidalType, string> = {
  semidiurnal: '#3b82f6',
  'mixed-semidiurnal': '#06b6d4',
  'mixed-diurnal': '#22c55e',
  diurnal: '#f59e0b',
};

interface StationRangeData {
  name: string;
  shortName: string;
  range: number;
  type: TidalType;
  isSelected: boolean;
}

/**
 * TidalRangeChart
 *
 * Horizontal bar chart comparing tidal ranges across all stations.
 * Color-coded by tidal type to show the relationship between
 * tidal type and range.
 */
export function TidalRangeChart() {
  const epoch = useTimeStore((s) => s.epoch);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const selectStation = useHarmonicsStore((s) => s.selectStation);

  const data = useMemo(() => {
    const now = new Date(epoch);

    const stationData: (StationRangeData & { id: string })[] = STATIONS.map((station) => {
      const range = getTidalRange(station, now);
      const tidalRange = range.maxHeight - range.minHeight;
      const type = getTidalType(station);

      return {
        id: station.id,
        name: station.state ? `${station.name}, ${station.state}` : station.name,
        shortName: station.name.length > 12 ? station.name.slice(0, 10) + '...' : station.name,
        range: tidalRange,
        type,
        isSelected: selectedStation?.id === station.id,
      };
    }).sort((a, b) => b.range - a.range);

    return stationData;
  }, [epoch, selectedStation]);

  const handleBarClick = (stationId: string) => {
    selectStation(stationId);
  };

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Tidal Range Comparison</h3>

      <p className="text-slate-400 text-xs mb-3">
        Click a bar to select that station. Colors show tidal type.
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {Object.entries(TIDAL_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-slate-400">
              {type === 'semidiurnal'
                ? 'Semidiurnal'
                : type === 'mixed-semidiurnal'
                ? 'Mixed-Semi'
                : type === 'mixed-diurnal'
                ? 'Mixed-Di'
                : 'Diurnal'}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${v.toFixed(1)}m`}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              width={75}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '11px',
              }}
              formatter={(value) => [`${Number(value).toFixed(2)}m`, 'Range']}
              labelFormatter={(label) => String(label)}
            />
            <Bar
              dataKey="range"
              cursor="pointer"
              onClick={(_, index) => {
                const entry = data[index];
                if (entry) handleBarClick(entry.id);
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={TIDAL_TYPE_COLORS[entry.type]}
                  opacity={entry.isSelected ? 1 : 0.7}
                  stroke={entry.isSelected ? '#fff' : 'none'}
                  strokeWidth={entry.isSelected ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats summary */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-slate-800/50 rounded">
          <span className="text-slate-500">Largest range:</span>
          <div className="text-white">
            {data[0]?.name.split(',')[0]} ({data[0]?.range.toFixed(2)}m)
          </div>
        </div>
        <div className="p-2 bg-slate-800/50 rounded">
          <span className="text-slate-500">Smallest range:</span>
          <div className="text-white">
            {data[data.length - 1]?.name.split(',')[0]} (
            {data[data.length - 1]?.range.toFixed(2)}m)
          </div>
        </div>
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Why such variation?</strong>
        <p className="mt-1">
          Tidal range depends on coastal geometry, water depth, and resonance with
          astronomical periods. Funnel-shaped bays (like Fundy) amplify tides;
          enclosed seas (like the Gulf of Mexico) suppress semidiurnal oscillations.
        </p>
      </div>
    </div>
  );
}
