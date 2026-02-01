import { useState } from 'react';

interface ResonantBay {
  name: string;
  location: string;
  naturalPeriod: number; // hours
  tidalRange: number; // meters
  length: number; // km
  depth: number; // meters average
  description: string;
}

const RESONANT_BAYS: ResonantBay[] = [
  {
    name: 'Bay of Fundy',
    location: 'Canada (Nova Scotia/New Brunswick)',
    naturalPeriod: 12.5,
    tidalRange: 16.3,
    length: 270,
    depth: 75,
    description: 'The world\'s highest tides. Natural oscillation period nearly matches M2 semidiurnal tide (~12.42 hours), creating near-perfect resonance amplification.'
  },
  {
    name: 'Bristol Channel',
    location: 'UK (Wales/England)',
    naturalPeriod: 10.5,
    tidalRange: 14.0,
    length: 200,
    depth: 45,
    description: 'Funnel-shaped channel amplifies tides. Strong resonance with semidiurnal tides creates second-largest tidal range in the world.'
  },
  {
    name: 'Ungava Bay',
    location: 'Canada (Quebec)',
    naturalPeriod: 11.8,
    tidalRange: 12.0,
    length: 250,
    depth: 60,
    description: 'Connected to Hudson Strait, creating coupled resonance. Third-largest tidal range globally.'
  },
  {
    name: 'Gulf of Maine',
    location: 'USA/Canada',
    naturalPeriod: 13.2,
    tidalRange: 6.0,
    length: 450,
    depth: 150,
    description: 'Connected to Bay of Fundy, forming a coupled oscillating system. Moderate resonance with M2 tide.'
  },
  {
    name: 'Cook Inlet',
    location: 'USA (Alaska)',
    naturalPeriod: 11.0,
    tidalRange: 10.5,
    length: 280,
    depth: 40,
    description: 'Narrow inlet with good resonance match. Fifth-largest tidal range, strong tidal currents.'
  },
  {
    name: 'Gulf of Khambhat',
    location: 'India (Gujarat)',
    naturalPeriod: 12.0,
    tidalRange: 10.0,
    length: 200,
    depth: 25,
    description: 'Shallow funnel-shaped gulf on India\'s west coast. Significant tidal power potential.'
  }
];

interface TidalResonanceProps {
  onClose: () => void;
}

export function TidalResonance({ onClose }: TidalResonanceProps) {
  const [selectedBay, setSelectedBay] = useState<ResonantBay | null>(null);
  const [simulatedLength, setSimulatedLength] = useState(270);
  const [simulatedDepth, setSimulatedDepth] = useState(75);

  // Calculate natural period using T = 4L / sqrt(gd) for quarter-wave resonance
  const g = 9.81;
  const naturalPeriod = (4 * simulatedLength * 1000) / Math.sqrt(g * simulatedDepth) / 3600;

  // M2 tidal period
  const m2Period = 12.42;

  // Calculate resonance factor (simplified model)
  const periodRatio = naturalPeriod / m2Period;
  const resonanceQ = 1 / Math.abs(1 - periodRatio);
  const resonanceFactor = Math.min(resonanceQ, 20); // Cap for display

  // Determine resonance quality
  const getResonanceQuality = () => {
    if (Math.abs(periodRatio - 1) < 0.05) return { label: 'Near-perfect', color: 'text-red-400' };
    if (Math.abs(periodRatio - 1) < 0.15) return { label: 'Strong', color: 'text-orange-400' };
    if (Math.abs(periodRatio - 1) < 0.3) return { label: 'Moderate', color: 'text-yellow-400' };
    return { label: 'Weak', color: 'text-green-400' };
  };

  const resonanceQuality = getResonanceQuality();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Tidal Resonance: Why Some Bays Have Giant Tides</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Concept explanation */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">The Physics of Tidal Resonance</h3>
            <p className="text-slate-300 text-sm mb-3">
              Just like pushing a child on a swing at the right moment amplifies motion, ocean basins
              can amplify tides when their natural oscillation period matches the tidal forcing period.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800 rounded p-3">
                <h4 className="text-cyan-400 font-medium mb-1">Quarter-Wave Resonance</h4>
                <p className="text-slate-400">
                  In a bay open at one end, water sloshes in and out. The natural period depends on
                  bay length and depth: <span className="text-white font-mono">T = 4L / √(gd)</span>
                </p>
              </div>
              <div className="bg-slate-800 rounded p-3">
                <h4 className="text-cyan-400 font-medium mb-1">M2 Tidal Period</h4>
                <p className="text-slate-400">
                  The dominant semidiurnal tide (M2) has a period of <span className="text-white">12.42 hours</span>.
                  Bays with natural periods near this experience maximum amplification.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive simulator */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">Interactive Resonance Simulator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm block mb-1">
                    Bay Length: <span className="text-white font-mono">{simulatedLength} km</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={simulatedLength}
                    onChange={(e) => setSimulatedLength(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm block mb-1">
                    Average Depth: <span className="text-white font-mono">{simulatedDepth} m</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={simulatedDepth}
                    onChange={(e) => setSimulatedDepth(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <button
                  onClick={() => { setSimulatedLength(270); setSimulatedDepth(75); }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Reset to Bay of Fundy values
                </button>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-center space-y-2">
                  <div>
                    <span className="text-slate-400 text-sm">Natural Period:</span>
                    <span className="text-2xl font-bold text-white ml-2">{naturalPeriod.toFixed(2)} h</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">M2 Period:</span>
                    <span className="text-xl text-cyan-400 ml-2">{m2Period} h</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">Resonance:</span>
                    <span className={`text-xl font-bold ml-2 ${resonanceQuality.color}`}>
                      {resonanceQuality.label}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                        style={{ width: `${Math.min(resonanceFactor / 20 * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Amplification factor: ~{resonanceFactor.toFixed(1)}x
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* World's most resonant bays */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-3">World's Most Resonant Bays</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {RESONANT_BAYS.map((bay) => (
                <button
                  key={bay.name}
                  onClick={() => setSelectedBay(bay)}
                  className={`text-left p-3 rounded-lg transition-colors ${
                    selectedBay?.name === bay.name
                      ? 'bg-amber-600/30 border border-amber-500'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-white">{bay.name}</div>
                  <div className="text-xs text-slate-400">{bay.location}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-amber-400 font-bold">{bay.tidalRange}m</span>
                    <span className="text-slate-500 text-xs">range</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected bay details */}
          {selectedBay && (
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg p-4 mb-6 border border-amber-700/50">
              <h3 className="text-lg font-bold text-amber-300 mb-2">{selectedBay.name}</h3>
              <p className="text-slate-300 text-sm mb-3">{selectedBay.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-800/50 rounded p-2 text-center">
                  <div className="text-slate-400">Tidal Range</div>
                  <div className="text-xl font-bold text-amber-400">{selectedBay.tidalRange}m</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2 text-center">
                  <div className="text-slate-400">Natural Period</div>
                  <div className="text-xl font-bold text-cyan-400">{selectedBay.naturalPeriod}h</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2 text-center">
                  <div className="text-slate-400">Length</div>
                  <div className="text-xl font-bold text-white">{selectedBay.length}km</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2 text-center">
                  <div className="text-slate-400">Avg Depth</div>
                  <div className="text-xl font-bold text-white">{selectedBay.depth}m</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSimulatedLength(selectedBay.length);
                  setSimulatedDepth(selectedBay.depth);
                }}
                className="mt-3 text-sm text-amber-400 hover:text-amber-300"
              >
                → Load into simulator
              </button>
            </div>
          )}

          {/* Additional factors */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Other Amplifying Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-2xl">📐</span>
                  <div>
                    <h4 className="text-white font-medium">Funneling Effect</h4>
                    <p className="text-slate-400">
                      Narrowing bays concentrate tidal energy, raising water levels. The Bristol
                      Channel's funnel shape adds to its resonance amplification.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <h4 className="text-white font-medium">Coupled Oscillators</h4>
                    <p className="text-slate-400">
                      Connected basins (like Gulf of Maine + Bay of Fundy) can create coupled
                      oscillating systems with enhanced resonance.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-2xl">📉</span>
                  <div>
                    <h4 className="text-white font-medium">Shoaling</h4>
                    <p className="text-slate-400">
                      As tidal waves enter shallower water, they slow down and increase in height,
                      similar to ocean waves approaching a beach.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-2xl">🌀</span>
                  <div>
                    <h4 className="text-white font-medium">Coriolis Effect</h4>
                    <p className="text-slate-400">
                      Earth's rotation deflects tidal currents, creating higher tides on one side
                      of bays in the Northern Hemisphere (right side looking in).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
