import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';

interface AnchorScopeCalculatorProps {
  onClose: () => void;
}

export function AnchorScopeCalculator({ onClose }: AnchorScopeCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [chartDepth, setChartDepth] = useState(5); // meters at chart datum
  const [freeboard, setFreeboard] = useState(1.5); // bow height above water
  const [desiredScope, setDesiredScope] = useState(7); // scope ratio
  const [rodeType, setRodeType] = useState<'chain' | 'mixed' | 'rope'>('chain');
  const [expectedWindKnots, setExpectedWindKnots] = useState(15);

  // Calculate current tide height
  const currentTide = useMemo(() => {
    if (!selectedStation) return 0;
    const now = new Date();
    return predictTide(selectedStation, now);
  }, [selectedStation]);

  // Calculate high tide for worst-case scenario (next 12 hours)
  const highTideToday = useMemo(() => {
    if (!selectedStation) return 0;
    const now = new Date();
    let maxTide = currentTide;
    // Sample every 30 minutes for next 12 hours
    for (let i = 0; i < 24; i++) {
      const checkTime = new Date(now.getTime() + i * 30 * 60 * 1000);
      const tide = predictTide(selectedStation, checkTime);
      if (tide > maxTide) maxTide = tide;
    }
    return maxTide;
  }, [selectedStation, currentTide]);

  // Calculate actual water depths
  const currentWaterDepth = chartDepth + currentTide;
  const maxWaterDepth = chartDepth + highTideToday;

  // Calculate total depth to anchor (water depth + freeboard)
  const currentTotalDepth = currentWaterDepth + freeboard;
  const maxTotalDepth = maxWaterDepth + freeboard;

  // Calculate required rode length
  const currentRodeLength = currentTotalDepth * desiredScope;
  const maxRodeLength = maxTotalDepth * desiredScope;

  // Calculate swing radius (horizontal distance from anchor)
  const currentSwingRadius = Math.sqrt(Math.max(0, currentRodeLength ** 2 - currentTotalDepth ** 2));
  const maxSwingRadius = Math.sqrt(Math.max(0, maxRodeLength ** 2 - maxTotalDepth ** 2));

  // Wind condition recommendations
  const getRecommendedScope = () => {
    if (rodeType === 'rope') {
      if (expectedWindKnots > 30) return 10;
      if (expectedWindKnots > 20) return 8;
      return 7;
    }
    if (rodeType === 'mixed') {
      if (expectedWindKnots > 30) return 7;
      if (expectedWindKnots > 20) return 6;
      return 5;
    }
    // Chain
    if (expectedWindKnots > 30) return 7;
    if (expectedWindKnots > 20) return 5;
    return 4;
  };

  const recommendedScope = getRecommendedScope();

  // Holding power assessment
  const getHoldingAssessment = () => {
    const scopeDiff = desiredScope - recommendedScope;
    if (scopeDiff >= 2) return { status: 'excellent', color: 'text-green-400', icon: '✓✓' };
    if (scopeDiff >= 0) return { status: 'good', color: 'text-green-400', icon: '✓' };
    if (scopeDiff >= -1) return { status: 'marginal', color: 'text-yellow-400', icon: '⚠' };
    return { status: 'insufficient', color: 'text-red-400', icon: '✗' };
  };

  const holding = getHoldingAssessment();

  // Catenary effect note
  const getCatenaryNote = () => {
    if (rodeType === 'chain') {
      return 'Chain catenary provides shock absorption and keeps pull angle low.';
    }
    if (rodeType === 'mixed') {
      return 'Use at least 1 boat length of chain before the rope for better hold.';
    }
    return 'All-rope requires more scope. Consider a chain leader for better holding.';
  };

  if (!selectedStation) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            ⚓ Anchor Scope Calculator
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Conditions */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Current Conditions</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Station:</span>
                <span className="text-white ml-1">{selectedStation.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Current Tide:</span>
                <span className="text-cyan-400 ml-1">{formatHeight(currentTide, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">High Tide (12h):</span>
                <span className="text-amber-400 ml-1">{formatHeight(highTideToday, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Tide Range:</span>
                <span className="text-white ml-1">{formatHeight(highTideToday - currentTide, unitSystem)}</span>
              </div>
            </div>
          </div>

          {/* Input Parameters */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Chart Depth (at datum)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.5"
                  value={chartDepth}
                  onChange={(e) => setChartDepth(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(chartDepth, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Bow Freeboard (height above water)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={freeboard}
                  onChange={(e) => setFreeboard(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(freeboard, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Desired Scope Ratio
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={desiredScope}
                  onChange={(e) => setDesiredScope(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{desiredScope}:1</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Recommended for conditions: {recommendedScope}:1 minimum
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Rode Type
              </label>
              <div className="flex gap-2">
                {(['chain', 'mixed', 'rope'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setRodeType(type)}
                    className={`flex-1 px-3 py-2 rounded text-sm capitalize ${
                      rodeType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {type === 'mixed' ? 'Chain + Rope' : type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Expected Wind
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={expectedWindKnots}
                  onChange={(e) => setExpectedWindKnots(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{expectedWindKnots} kts</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-900 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-white mb-2">Rode Requirements</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Current Tide</div>
                <div className="text-xl font-bold text-cyan-400">{formatHeight(currentRodeLength, unitSystem)}</div>
                <div className="text-xs text-slate-500">
                  Water depth: {formatHeight(currentWaterDepth, unitSystem)}
                </div>
              </div>

              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">At High Tide</div>
                <div className="text-xl font-bold text-amber-400">{formatHeight(maxRodeLength, unitSystem)}</div>
                <div className="text-xs text-slate-500">
                  Water depth: {formatHeight(maxWaterDepth, unitSystem)}
                </div>
              </div>
            </div>

            {/* Swing Radius */}
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-slate-400 mb-1">Swing Radius</div>
              <div className="flex justify-between items-center">
                <span className="text-white">Current: {formatHeight(currentSwingRadius, unitSystem)}</span>
                <span className="text-amber-400">Max: {formatHeight(maxSwingRadius, unitSystem)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Ensure adequate clearance from obstacles and other boats
              </div>
            </div>

            {/* Holding Assessment */}
            <div className={`flex items-center gap-2 p-2 rounded ${
              holding.status === 'excellent' || holding.status === 'good' ? 'bg-green-900/30' :
              holding.status === 'marginal' ? 'bg-yellow-900/30' : 'bg-red-900/30'
            }`}>
              <span className={`text-lg ${holding.color}`}>{holding.icon}</span>
              <span className={`text-sm ${holding.color}`}>
                Holding power: <span className="font-medium capitalize">{holding.status}</span>
              </span>
            </div>
          </div>

          {/* Scope Diagram */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h4 className="text-xs text-slate-400 mb-2">Scope Visualization</h4>
            <svg viewBox="0 0 300 100" className="w-full h-24">
              {/* Water surface */}
              <line x1="0" y1="30" x2="300" y2="30" stroke="#38bdf8" strokeWidth="2" />
              <text x="5" y="25" fill="#94a3b8" fontSize="8">Water Surface</text>

              {/* Seabed */}
              <line x1="0" y1="80" x2="300" y2="80" stroke="#78716c" strokeWidth="2" />
              <text x="5" y="95" fill="#94a3b8" fontSize="8">Seabed</text>

              {/* Boat */}
              <ellipse cx="250" cy="30" rx="20" ry="8" fill="#3b82f6" />
              <line x1="250" y1="22" x2="250" y2="10" stroke="#94a3b8" strokeWidth="1" />

              {/* Anchor */}
              <path d="M40 80 L45 70 L35 70 Z" fill="#fbbf24" />

              {/* Rode */}
              <path
                d={`M45 75 Q100 ${85 - desiredScope * 2} 248 32`}
                stroke={rodeType === 'chain' ? '#94a3b8' : rodeType === 'rope' ? '#f59e0b' : 'url(#mixedGradient)'}
                strokeWidth="2"
                fill="none"
              />

              {/* Gradient for mixed rode */}
              <defs>
                <linearGradient id="mixedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="30%" stopColor="#94a3b8" />
                  <stop offset="70%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Depth marker */}
              <line x1="270" y1="32" x2="270" y2="80" stroke="#64748b" strokeDasharray="2,2" />
              <text x="275" y="55" fill="#94a3b8" fontSize="8">Depth</text>

              {/* Scope indicator */}
              <text x="150" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">
                {desiredScope}:1 scope
              </text>
            </svg>
          </div>

          {/* Catenary Note */}
          <div className="text-xs text-slate-400 bg-slate-700/30 rounded p-2">
            <span className="text-slate-300">💡 </span>
            {getCatenaryNote()}
          </div>

          {/* Tips */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• <strong>Scope</strong> = Rode length ÷ (Depth + Freeboard)</p>
            <p>• Always account for tide changes when anchoring overnight</p>
            <p>• In coral/rock, use higher scope to avoid chafe on bottom</p>
            <p>• Set anchor in reverse at 1/3 throttle to test holding</p>
          </div>
        </div>
      </div>
    </div>
  );
}
