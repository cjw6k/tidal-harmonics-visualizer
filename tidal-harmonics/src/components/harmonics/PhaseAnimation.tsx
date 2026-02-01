import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import { getAstronomicalParameters, calculateV0, getNodalFactors, normalizeAngle } from '@/lib/astronomical';
import type { ConstituentFamily } from '@/types/harmonics';

/**
 * Phase Animation Component
 *
 * Animates constituent phasors rotating at their characteristic speeds.
 * Demonstrates how different constituents rotate at different rates:
 * - Semidiurnal (M2, S2): ~29°/hour (complete rotation in ~12 hours)
 * - Diurnal (K1, O1): ~15°/hour (complete rotation in ~24 hours)
 * - Long-period: Very slow rotation (days to months)
 */

interface AnimatedPhasor {
  symbol: string;
  amplitude: number;
  startAngle: number;
  speed: number; // degrees per hour
  color: string;
  family: ConstituentFamily;
}

const FAMILY_COLORS: Record<string, string> = {
  semidiurnal: '#3b82f6',
  diurnal: '#22c55e',
  'long-period': '#f97316',
  'shallow-water': '#a855f7',
};

const SPEED_OPTIONS = [
  { label: '1x', value: 1, description: 'Real-time' },
  { label: '60x', value: 60, description: '1 min = 1 hour' },
  { label: '720x', value: 720, description: '1 min = 12 hours' },
  { label: '1440x', value: 1440, description: '1 min = 1 day' },
];

interface PhaseAnimationProps {
  onClose?: () => void;
}

export function PhaseAnimation({ onClose }: PhaseAnimationProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(720);
  const [elapsedHours, setElapsedHours] = useState(0);
  const [showTrails, setShowTrails] = useState(true);
  const [selectedPhasor, setSelectedPhasor] = useState<string | null>(null);

  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const trailsRef = useRef<Map<string, { x: number; y: number }[]>>(new Map());

  const startDate = useMemo(() => new Date(), []);

  // Initialize phasors
  const phasors = useMemo(() => {
    if (!station) return [];

    const date = startDate;
    const astro = getAstronomicalParameters(date);

    return station.constituents
      .filter((c) => visibleConstituents.includes(c.symbol))
      .map((c) => {
        const constituent = CONSTITUENTS[c.symbol];
        if (!constituent) return null;

        const { f, u } = getNodalFactors(c.symbol, astro.N);
        const V0 = calculateV0(constituent.doodson, astro);
        const startAngle = normalizeAngle(V0 + u - c.phase);

        return {
          symbol: c.symbol,
          amplitude: f * c.amplitude,
          startAngle,
          speed: constituent.speed,
          color: FAMILY_COLORS[constituent.family] || '#888',
          family: constituent.family,
        };
      })
      .filter((p): p is AnimatedPhasor => p !== null)
      .slice(0, 12); // Limit for performance
  }, [station, visibleConstituents, startDate]);

  // Calculate current positions
  const currentPositions = useMemo(() => {
    const scale = 80;
    return phasors.map((p) => {
      const currentAngle = normalizeAngle(p.startAngle + p.speed * elapsedHours);
      const rad = (currentAngle * Math.PI) / 180;
      const amp = p.amplitude * scale;
      return {
        symbol: p.symbol,
        angle: currentAngle,
        x: amp * Math.cos(rad),
        y: -amp * Math.sin(rad),
        color: p.color,
        amplitude: p.amplitude,
        speed: p.speed,
        family: p.family,
      };
    });
  }, [phasors, elapsedHours]);

  // Calculate resultant
  const resultant = useMemo(() => {
    return currentPositions.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
  }, [currentPositions]);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Convert real milliseconds to simulated hours
      const deltaHours = (deltaMs / 1000 / 3600) * speedMultiplier;
      setElapsedHours((prev) => prev + deltaHours);

      // Update trails
      if (showTrails) {
        currentPositions.forEach((p) => {
          const trail = trailsRef.current.get(p.symbol) || [];
          trail.push({ x: p.x, y: p.y });
          if (trail.length > 60) trail.shift();
          trailsRef.current.set(p.symbol, trail);
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [speedMultiplier, showTrails, currentPositions]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Reset trails when speed changes
  useEffect(() => {
    trailsRef.current.clear();
  }, [speedMultiplier]);

  const reset = () => {
    setElapsedHours(0);
    trailsRef.current.clear();
    lastTimeRef.current = 0;
  };

  const formatElapsed = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = hours / 24;
      return `${days.toFixed(1)}d`;
    }
  };

  const cx = 200;
  const cy = 200;

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 text-center text-slate-500">
        Select a station to see phase animation
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Phase Animation</h2>
            <p className="text-slate-400 text-sm">
              Watch constituents rotate at their characteristic speeds
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isPlaying
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              ↺ Reset
            </button>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Speed:</span>
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSpeedMultiplier(opt.value)}
                  title={opt.description}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    speedMultiplier === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="rounded"
              />
              Trails
            </label>
          </div>

          {/* Time display */}
          <div className="text-center mb-4">
            <div className="text-2xl font-mono text-white">
              T + {formatElapsed(elapsedHours)}
            </div>
            <div className="text-slate-500 text-sm">
              {new Date(startDate.getTime() + elapsedHours * 3600 * 1000).toLocaleString()}
            </div>
          </div>

          {/* Animation canvas */}
          <div className="flex justify-center mb-4">
            <svg width={400} height={400} className="block bg-slate-800 rounded-xl">
              {/* Background grid circles */}
              {[40, 80, 120, 160].map((r) => (
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
              <line x1={cx - 180} y1={cy} x2={cx + 180} y2={cy} stroke="#475569" strokeWidth={1} />
              <line x1={cx} y1={cy - 180} x2={cx} y2={cy + 180} stroke="#475569" strokeWidth={1} />

              {/* Trails */}
              {showTrails &&
                currentPositions.map((p) => {
                  const trail = trailsRef.current.get(p.symbol) || [];
                  if (trail.length < 2) return null;
                  const pathData =
                    'M ' +
                    trail.map((pt) => `${cx + pt.x},${cy + pt.y}`).join(' L ');
                  return (
                    <path
                      key={`trail-${p.symbol}`}
                      d={pathData}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={1}
                      opacity={0.3}
                    />
                  );
                })}

              {/* Phasor vectors */}
              {currentPositions.map((p) => (
                <g
                  key={p.symbol}
                  className="cursor-pointer"
                  onClick={() => setSelectedPhasor(p.symbol === selectedPhasor ? null : p.symbol)}
                >
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + p.x}
                    y2={cy + p.y}
                    stroke={p.color}
                    strokeWidth={selectedPhasor === p.symbol ? 3 : 2}
                    opacity={selectedPhasor && selectedPhasor !== p.symbol ? 0.3 : 0.8}
                  />
                  <circle
                    cx={cx + p.x}
                    cy={cy + p.y}
                    r={selectedPhasor === p.symbol ? 6 : 4}
                    fill={p.color}
                  />
                  <text
                    x={cx + p.x * 1.2}
                    y={cy + p.y * 1.2}
                    fill={p.color}
                    fontSize={selectedPhasor === p.symbol ? 11 : 9}
                    textAnchor="middle"
                    fontWeight={selectedPhasor === p.symbol ? 'bold' : 'normal'}
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

              {/* Rotation indicator */}
              <text x={cx + 175} y={cy + 4} fill="#64748b" fontSize={10}>
                →
              </text>
              <text x={cx - 8} y={cy - 175} fill="#64748b" fontSize={10}>
                ↑
              </text>
            </svg>
          </div>

          {/* Selected phasor info */}
          {selectedPhasor && (
            <div className="mb-4 p-4 bg-slate-800 rounded-lg">
              {(() => {
                const p = currentPositions.find((pos) => pos.symbol === selectedPhasor);
                const constituent = CONSTITUENTS[selectedPhasor];
                if (!p || !constituent) return null;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">{p.symbol}</span>
                      <span className="text-slate-400">{constituent.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Speed: </span>
                        <span className="text-white">{p.speed.toFixed(4)}°/hr</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Period: </span>
                        <span className="text-white">{(360 / p.speed).toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Current angle: </span>
                        <span className="text-white">{currentPositions.find((pos) => pos.symbol === selectedPhasor)?.angle.toFixed(1)}°</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Amplitude: </span>
                        <span className="text-white">{p.amplitude.toFixed(3)}m</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Educational note */}
          <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-300">
            <p className="mb-2">
              <strong className="text-cyan-400">Why do they rotate at different speeds?</strong>
            </p>
            <p className="mb-2">
              Each constituent rotates at its characteristic angular speed. Semidiurnal
              constituents (M2, S2) complete a full rotation in ~12 hours, while diurnal
              constituents (K1, O1) take ~24 hours. Long-period constituents rotate
              extremely slowly (days to months).
            </p>
            <p>
              The <span className="text-red-400 font-semibold">red vector</span> shows the
              sum of all constituents—this determines the actual tide level. Watch how
              it moves as the individual phasors rotate at their different rates.
            </p>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Semidiurnal (~29°/hr)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Diurnal (~15°/hr)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Long-period (very slow)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Resultant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
