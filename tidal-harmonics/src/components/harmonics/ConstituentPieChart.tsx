import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: '#3b82f6',
  diurnal: '#22c55e',
  'long-period': '#f59e0b',
  'shallow-water': '#a855f7',
};

interface ConstituentData {
  symbol: string;
  name: string;
  amplitude: number;
  family: string;
  percent: number;
}

/**
 * ConstituentPieChart
 *
 * Pie chart showing the relative amplitude contribution of each constituent
 * at the selected station. Helps visualize which constituents dominate.
 */
export function ConstituentPieChart() {
  const station = useHarmonicsStore((s) => s.selectedStation);

  const { pieData, familyData } = useMemo(() => {
    if (!station) {
      return { pieData: [], familyData: [], totalAmplitude: 0 };
    }

    // Calculate total amplitude for percentages
    const total = station.constituents.reduce((sum, c) => sum + c.amplitude, 0);

    // Individual constituent data
    const constituents: ConstituentData[] = station.constituents
      .map((c) => {
        const info = CONSTITUENTS[c.symbol];
        return {
          symbol: c.symbol,
          name: info?.name || c.symbol,
          amplitude: c.amplitude,
          family: info?.family || 'semidiurnal',
          percent: (c.amplitude / total) * 100,
        };
      })
      .filter((c) => c.percent >= 1) // Only show constituents >= 1%
      .sort((a, b) => b.amplitude - a.amplitude);

    // Group by family
    const familyTotals: Record<string, number> = {};
    for (const c of station.constituents) {
      const info = CONSTITUENTS[c.symbol];
      const family = info?.family || 'semidiurnal';
      familyTotals[family] = (familyTotals[family] || 0) + c.amplitude;
    }

    const families = Object.entries(familyTotals)
      .map(([family, amplitude]) => ({
        name: family,
        value: amplitude,
        percent: (amplitude / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      pieData: constituents,
      familyData: families,
      totalAmplitude: total,
    };
  }, [station]);

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view constituent breakdown
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Constituent Contributions</h3>

      <p className="text-slate-400 text-xs mb-3">
        Relative amplitude contribution of each constituent to total tide.
      </p>

      {/* Family breakdown */}
      <div className="flex gap-2 mb-3">
        {familyData.map((family) => (
          <div
            key={family.name}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{ backgroundColor: FAMILY_COLORS[family.name] + '20' }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: FAMILY_COLORS[family.name] }}
            />
            <span className="text-white">{family.percent.toFixed(0)}%</span>
            <span className="text-slate-400 text-[10px]">
              {family.name === 'semidiurnal'
                ? 'Semi'
                : family.name === 'diurnal'
                ? 'Di'
                : family.name === 'long-period'
                ? 'Long'
                : 'SW'}
            </span>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      <div className="w-full h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="amplitude"
              nameKey="symbol"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={30}
              paddingAngle={1}
              label={({ name, percent }) =>
                (percent ?? 0) > 0.05 ? `${name}` : ''
              }
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={FAMILY_COLORS[entry.family] || '#888'}
                  opacity={0.8 + (entry.percent / 100) * 0.2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '11px',
              }}
              formatter={(value, name) => {
                const entry = pieData.find((p) => p.symbol === name);
                return [
                  `${Number(value).toFixed(3)}m (${entry?.percent.toFixed(1)}%)`,
                  entry?.name || name,
                ];
              }}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value) => {
                const entry = pieData.find((p) => p.symbol === value);
                return `${value} (${entry?.percent.toFixed(0)}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top constituents list */}
      <div className="mt-3 space-y-1">
        <h4 className="text-xs text-slate-500">Dominant Constituents</h4>
        {pieData.slice(0, 5).map((c, i) => (
          <div key={c.symbol} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 w-4">{i + 1}.</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: FAMILY_COLORS[c.family] }}
              />
              <span className="text-white font-mono">{c.symbol}</span>
              <span className="text-slate-500">{c.name}</span>
            </div>
            <div className="text-right">
              <span className="text-white">{c.amplitude.toFixed(3)}m</span>
              <span className="text-slate-500 ml-1">({c.percent.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Understanding the chart:</strong>
        <p className="mt-1">
          M2 (lunar semidiurnal) typically dominates at 50-70%. Stations with
          larger diurnal (green) sectors have more pronounced diurnal inequality.
          Shallow-water constituents (purple) indicate significant nonlinear effects.
        </p>
      </div>
    </div>
  );
}
