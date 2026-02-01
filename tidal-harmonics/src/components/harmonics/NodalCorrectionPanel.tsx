import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import { format, addYears } from 'date-fns';

interface NodalData {
  year: number;
  label: string;
  N: number;
  M2_f: number;
  K1_f: number;
  O1_f: number;
  isCurrentYear: boolean;
}

/**
 * Calculate approximate nodal correction factor f for a constituent
 * Simplified version based on mean longitude of lunar ascending node
 */
function calculateNodalF(symbol: string, N: number): number {
  // N is mean longitude of ascending node in degrees
  const Nrad = (N * Math.PI) / 180;

  // Common nodal factors (simplified from Schureman)
  const corrections: Record<string, () => number> = {
    M2: () => 1.0 - 0.037 * Math.cos(Nrad),
    S2: () => 1.0, // No nodal correction
    N2: () => 1.0 - 0.037 * Math.cos(Nrad),
    K2: () => 1.024 + 0.286 * Math.cos(Nrad),
    K1: () => 1.006 + 0.115 * Math.cos(Nrad),
    O1: () => 1.009 + 0.187 * Math.cos(Nrad),
    P1: () => 1.0, // No nodal correction
    Q1: () => 1.009 + 0.187 * Math.cos(Nrad),
    M1: () => 1.009 + 0.187 * Math.cos(Nrad),
  };

  const corrFn = corrections[symbol];
  return corrFn ? corrFn() : 1.0;
}

/**
 * Calculate mean longitude of lunar ascending node
 * N decreases by about 19.3° per year (retrograde motion)
 * Full cycle: 18.61 years
 */
function calculateN(date: Date): number {
  // Reference: N = 125.04° - 19.341° * T where T is Julian centuries from J2000.0
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / 86400000;
  const T = daysSinceJ2000 / 36525; // Julian centuries

  let N = 125.04 - 1934.136 * T;
  // Normalize to 0-360
  N = ((N % 360) + 360) % 360;

  return N;
}

/**
 * NodalCorrectionPanel
 *
 * Explains and visualizes the 18.6-year lunar nodal cycle,
 * showing how it affects tidal constituent amplitudes over time.
 */
export function NodalCorrectionPanel() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);

  const nodalData = useMemo(() => {
    const now = new Date(epoch);
    const currentYear = now.getFullYear();
    const data: NodalData[] = [];

    // Generate 20 years of data centered on current year
    for (let i = -10; i <= 10; i++) {
      const date = addYears(now, i);
      const year = date.getFullYear();
      const N = calculateN(date);

      data.push({
        year,
        label: format(date, 'yyyy'),
        N,
        M2_f: calculateNodalF('M2', N),
        K1_f: calculateNodalF('K1', N),
        O1_f: calculateNodalF('O1', N),
        isCurrentYear: year === currentYear,
      });
    }

    return data;
  }, [epoch]);

  const currentN = useMemo(() => calculateN(new Date(epoch)), [epoch]);

  // Current nodal factors for selected constituents
  const currentFactors = useMemo(() => {
    if (!station) return [];

    return ['M2', 'S2', 'K1', 'O1', 'K2', 'N2']
      .map((symbol) => {
        const constituent = station.constituents.find((c) => c.symbol === symbol);
        if (!constituent) return null;

        const f = calculateNodalF(symbol, currentN);
        const info = CONSTITUENTS[symbol];

        return {
          symbol,
          name: info?.name ?? symbol,
          baseAmplitude: constituent.amplitude,
          correctedAmplitude: constituent.amplitude * f,
          factor: f,
          percentChange: ((f - 1) * 100).toFixed(1),
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [station, currentN]);

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Nodal Corrections</h3>

      <p className="text-slate-400 text-xs mb-3">
        The 18.61-year lunar nodal cycle modifies tidal constituent amplitudes.
      </p>

      {/* Current N value */}
      <div className="mb-3 p-2 bg-slate-800 rounded flex items-center justify-between text-xs">
        <span className="text-slate-500">Lunar node longitude (N):</span>
        <span className="text-white font-mono">{currentN.toFixed(1)}°</span>
      </div>

      {/* Chart showing cycle */}
      <div className="w-full h-32 mb-3">
        <ResponsiveContainer>
          <LineChart data={nodalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              interval={2}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              domain={[0.85, 1.35]}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                fontSize: '10px',
              }}
              formatter={(value) => [
                Number(value).toFixed(3),
                'factor',
              ]}
            />
            <ReferenceLine y={1} stroke="#64748b" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="M2_f"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="M2"
            />
            <Line
              type="monotone"
              dataKey="K1_f"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="K1"
            />
            <Line
              type="monotone"
              dataKey="O1_f"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="O1"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-slate-400">M2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500" />
          <span className="text-slate-400">K1</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-amber-500" />
          <span className="text-slate-400">O1</span>
        </div>
      </div>

      {/* Current factors table */}
      {station && currentFactors.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs text-slate-500 mb-1">Current Corrections at {station.name.split(',')[0]}</h4>
          <div className="space-y-1">
            {currentFactors.map((c) => (
              <div key={c.symbol} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono w-6">{c.symbol}</span>
                  <span className="text-slate-500">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {c.baseAmplitude.toFixed(3)}m × {c.factor.toFixed(3)}
                  </span>
                  <span
                    className={`w-12 text-right ${
                      Number(c.percentChange) > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {Number(c.percentChange) > 0 ? '+' : ''}
                    {c.percentChange}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">The 18.6-year cycle:</strong>
        <p className="mt-1">
          The Moon's orbital plane wobbles, causing its ascending node to complete
          a retrograde circuit every 18.61 years. This changes the Moon's maximum
          declination and affects tidal forcing. K1 varies most (±11%), while M2
          varies only ±4%.
        </p>
      </div>
    </div>
  );
}
