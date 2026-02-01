import { useState, useMemo } from 'react';
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
import { CONSTITUENTS } from '@/data/constituents';

interface BeatPair {
  id: string;
  name: string;
  c1: string;
  c2: string;
  beatPeriod: number; // days
  description: string;
}

// Famous beat patterns in tidal analysis
const BEAT_PAIRS: BeatPair[] = [
  {
    id: 'spring-neap',
    name: 'Spring-Neap Cycle',
    c1: 'M2',
    c2: 'S2',
    beatPeriod: 14.76,
    description: 'The most important beat pattern. M2 (lunar) and S2 (solar) combine to create the ~14.8 day spring-neap cycle.'
  },
  {
    id: 'lunar-declinational',
    name: 'Lunar Declinational',
    c1: 'K1',
    c2: 'O1',
    beatPeriod: 13.66,
    description: 'Diurnal constituents beat to create the ~13.7 day tropical month cycle affecting diurnal inequality.'
  },
  {
    id: 'perigean',
    name: 'Perigean Cycle',
    c1: 'M2',
    c2: 'N2',
    beatPeriod: 27.55,
    description: 'M2 and N2 beat creates the anomalistic month cycle - perigean spring tides ("king tides").'
  },
  {
    id: 'fortnightly',
    name: 'Fortnightly',
    c1: 'K1',
    c2: 'P1',
    beatPeriod: 182.6,
    description: 'K1 and P1 create a semi-annual variation in diurnal tides, affecting seasonal tide patterns.'
  },
  {
    id: 'monthly',
    name: 'Monthly Evection',
    c1: 'M2',
    c2: 'L2',
    beatPeriod: 31.81,
    description: 'M2 and L2 beat creates the evection cycle, modifying the basic spring-neap pattern.'
  }
];

interface BeatPatternVisualizerProps {
  onClose: () => void;
}

export function BeatPatternVisualizer({ onClose }: BeatPatternVisualizerProps) {
  const [selectedPair, setSelectedPair] = useState<BeatPair>(BEAT_PAIRS[0]!);
  const [timeSpan, setTimeSpan] = useState(30); // days
  const [showEnvelope, setShowEnvelope] = useState(true);

  const chartData = useMemo(() => {
    const c1 = CONSTITUENTS[selectedPair.c1];
    const c2 = CONSTITUENTS[selectedPair.c2];

    if (!c1 || !c2) return [];

    // Use normalized amplitudes for visualization
    const amp1 = 1;
    const amp2 = 0.8;

    // Angular speeds in degrees per hour
    const omega1 = c1.speed;
    const omega2 = c2.speed;

    const data = [];
    const hoursTotal = timeSpan * 24;
    const step = Math.max(1, Math.floor(hoursTotal / 500)); // ~500 data points

    for (let h = 0; h < hoursTotal; h += step) {
      const rad1 = (omega1 * h * Math.PI) / 180;
      const rad2 = (omega2 * h * Math.PI) / 180;

      const wave1 = amp1 * Math.cos(rad1);
      const wave2 = amp2 * Math.cos(rad2);
      const combined = wave1 + wave2;

      // Envelope (beat amplitude)
      const beatFreq = Math.abs(omega1 - omega2);
      const beatRad = (beatFreq * h * Math.PI) / 180;
      const envelope = (amp1 + amp2) * Math.abs(Math.cos(beatRad / 2));

      data.push({
        hour: h,
        day: h / 24,
        [selectedPair.c1]: wave1,
        [selectedPair.c2]: wave2,
        combined,
        envelope,
        negEnvelope: -envelope
      });
    }

    return data;
  }, [selectedPair, timeSpan]);

  const c1Info = CONSTITUENTS[selectedPair.c1];
  const c2Info = CONSTITUENTS[selectedPair.c2];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Constituent Beat Patterns</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Explanation */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-2">What are Beat Patterns?</h3>
            <p className="text-slate-300 text-sm">
              When two waves of similar but not identical frequencies combine, they create a
              <span className="text-purple-400"> beat pattern</span> - periodic variations in amplitude.
              The beat period equals 1/(f₁-f₂). This is how the spring-neap cycle emerges from M2 and S2 tides.
            </p>
          </div>

          {/* Beat pair selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {BEAT_PAIRS.map(pair => (
              <button
                key={pair.id}
                onClick={() => setSelectedPair(pair)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedPair.id === pair.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {pair.name}
              </button>
            ))}
          </div>

          {/* Selected pair info */}
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-4 mb-4 border border-purple-700/50">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <h3 className="text-lg font-bold text-purple-300">{selectedPair.name}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-blue-600 rounded text-white">{selectedPair.c1}</span>
                <span className="text-slate-400">+</span>
                <span className="px-2 py-0.5 bg-amber-600 rounded text-white">{selectedPair.c2}</span>
                <span className="text-slate-400">→</span>
                <span className="text-purple-300 font-bold">{selectedPair.beatPeriod.toFixed(2)} days</span>
              </div>
            </div>
            <p className="text-slate-300 text-sm">{selectedPair.description}</p>

            {c1Info && c2Info && (
              <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                <div className="bg-slate-800/50 rounded p-2">
                  <div className="text-blue-400 font-medium">{selectedPair.c1}: {c1Info.name}</div>
                  <div className="text-slate-400">Speed: {c1Info.speed.toFixed(6)}°/hr</div>
                  <div className="text-slate-400">Period: {(360 / c1Info.speed).toFixed(2)} hrs</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <div className="text-amber-400 font-medium">{selectedPair.c2}: {c2Info.name}</div>
                  <div className="text-slate-400">Speed: {c2Info.speed.toFixed(6)}°/hr</div>
                  <div className="text-slate-400">Period: {(360 / c2Info.speed).toFixed(2)} hrs</div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Time span:</label>
              <select
                value={timeSpan}
                onChange={(e) => setTimeSpan(Number(e.target.value))}
                className="px-3 py-1 bg-slate-700 rounded text-white"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={showEnvelope}
                onChange={(e) => setShowEnvelope(e.target.checked)}
                className="accent-purple-500"
              />
              Show beat envelope
            </label>
          </div>

          {/* Chart */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  tickFormatter={(v) => `${v.toFixed(0)}d`}
                  label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fill: '#64748b' }}
                />
                <YAxis
                  stroke="#64748b"
                  domain={[-2, 2]}
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelFormatter={(v) => `Day ${Number(v).toFixed(2)}`}
                  formatter={(value) => [(value as number).toFixed(3)]}
                />
                <Legend />

                {showEnvelope && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="envelope"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Beat envelope"
                    />
                    <Line
                      type="monotone"
                      dataKey="negEnvelope"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      legendType="none"
                    />
                  </>
                )}

                <Line
                  type="monotone"
                  dataKey="combined"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={false}
                  name="Combined"
                />

                <Line
                  type="monotone"
                  dataKey={selectedPair.c1}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.5}
                  name={selectedPair.c1}
                />

                <Line
                  type="monotone"
                  dataKey={selectedPair.c2}
                  stroke="#f59e0b"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.5}
                  name={selectedPair.c2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Educational note */}
          <div className="mt-4 bg-slate-900/50 rounded-lg p-4 text-sm">
            <h3 className="text-slate-400 font-semibold mb-2">The Math Behind Beats</h3>
            <p className="text-slate-500">
              When two cosines are added: cos(ω₁t) + cos(ω₂t) = 2cos((ω₁+ω₂)t/2)cos((ω₁-ω₂)t/2).
              The first term oscillates fast (carrier), while the second term (ω₁-ω₂) creates the
              slow beat envelope. The beat period is 360°/|speed₁-speed₂| hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
