import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import { getAstronomicalParameters, calculateV0, getNodalFactors, normalizeAngle } from '@/lib/astronomical';

interface PhasorData {
  symbol: string;
  amplitude: number;
  angle: number;
  color: string;
  x: number;
  y: number;
}

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: '#3b82f6',
  diurnal: '#22c55e',
  'long-period': '#f97316',
  'shallow-water': '#a855f7',
};

export function PhasorDiagram() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);

  const { phasors, resultant } = useMemo(() => {
    if (!station) return { phasors: [], resultant: { x: 0, y: 0 } };

    const date = new Date(epoch);
    const astro = getAstronomicalParameters(date);
    const scale = 80; // pixels per meter amplitude

    const phasorList: PhasorData[] = station.constituents
      .filter((c) => visibleConstituents.includes(c.symbol))
      .map((c) => {
        const constituent = CONSTITUENTS[c.symbol];
        if (!constituent) return null;

        const { f, u } = getNodalFactors(c.symbol, astro.N);
        const V0 = calculateV0(constituent.doodson, astro);
        const angle = normalizeAngle(V0 + u - c.phase);

        const rad = (angle * Math.PI) / 180;
        const amp = f * c.amplitude * scale;

        return {
          symbol: c.symbol,
          amplitude: c.amplitude,
          angle,
          color: FAMILY_COLORS[constituent.family] || '#888',
          x: amp * Math.cos(rad),
          y: -amp * Math.sin(rad), // SVG y is inverted
        };
      })
      .filter((p): p is PhasorData => p !== null);

    // Calculate resultant
    const sum = phasorList.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );

    return { phasors: phasorList, resultant: sum };
  }, [epoch, station, visibleConstituents]);

  const cx = 150;
  const cy = 150;

  if (!station) {
    return (
      <div className="w-[300px] h-[300px] bg-slate-900 rounded-lg flex items-center justify-center text-slate-500">
        Select a station
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-2">
      <h3 className="text-xs text-slate-400 mb-1 px-2">Phasor Diagram</h3>
      <svg width={300} height={300} className="block">
        {/* Background grid circles */}
        {[25, 50, 75, 100, 125].map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#334155"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        <line x1={cx - 130} y1={cy} x2={cx + 130} y2={cy} stroke="#475569" strokeWidth={1} />
        <line x1={cx} y1={cy - 130} x2={cx} y2={cy + 130} stroke="#475569" strokeWidth={1} />

        {/* Axis labels */}
        <text x={cx + 135} y={cy + 4} fill="#64748b" fontSize={10}>
          E
        </text>
        <text x={cx - 4} y={cy - 135} fill="#64748b" fontSize={10}>
          N
        </text>

        {/* Phasor vectors */}
        {phasors.map((p) => (
          <g key={p.symbol}>
            <line
              x1={cx}
              y1={cy}
              x2={cx + p.x}
              y2={cy + p.y}
              stroke={p.color}
              strokeWidth={2}
              opacity={0.8}
            />
            <circle cx={cx + p.x} cy={cy + p.y} r={4} fill={p.color} />
            <text
              x={cx + p.x * 1.15}
              y={cy + p.y * 1.15}
              fill={p.color}
              fontSize={9}
              textAnchor="middle"
            >
              {p.symbol}
            </text>
          </g>
        ))}

        {/* Resultant vector */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + resultant.x}
          y2={cy + resultant.y}
          stroke="#ef4444"
          strokeWidth={3}
        />
        <circle cx={cx + resultant.x} cy={cy + resultant.y} r={6} fill="#ef4444" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#94a3b8" />
      </svg>

      {/* Legend */}
      <div className="flex gap-3 justify-center mt-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Semi
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Diurnal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Long
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Sum
        </span>
      </div>
    </div>
  );
}
