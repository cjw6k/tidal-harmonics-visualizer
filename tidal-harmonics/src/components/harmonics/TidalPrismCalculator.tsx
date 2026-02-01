import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';

interface TidalPrismCalculatorProps {
  onClose: () => void;
}

export function TidalPrismCalculator({ onClose }: TidalPrismCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Basin parameters
  const [basinArea, setBasinArea] = useState(1.0); // km²
  const [meanDepth, setMeanDepth] = useState(3.0); // meters
  const [inletWidth, setInletWidth] = useState(100); // meters
  const [inletDepth, setInletDepth] = useState(5); // meters

  // Calculate tidal range for current period
  const tidalData = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 48 * 60 * 60 * 1000); // 48 hours

    const series = predictTideSeries(selectedStation, start, end, 10);
    const extremes = findExtremes(series);

    if (extremes.length < 2) {
      return { range: 2.0, highTide: 1.0, lowTide: -1.0 }; // Default values
    }

    // Find consecutive high and low
    let maxRange = 0;
    let highTide = 0;
    let lowTide = 0;

    for (let i = 0; i < extremes.length - 1; i++) {
      const e1 = extremes[i];
      const e2 = extremes[i + 1];
      if (!e1 || !e2) continue;

      const range = Math.abs(e1.height - e2.height);
      if (range > maxRange) {
        maxRange = range;
        if (e1.height > e2.height) {
          highTide = e1.height;
          lowTide = e2.height;
        } else {
          highTide = e2.height;
          lowTide = e1.height;
        }
      }
    }

    return { range: maxRange, highTide, lowTide };
  }, [selectedStation]);

  const tidalRange = tidalData?.range || 2.0;

  // Tidal prism = Surface Area × Tidal Range
  // Volume in cubic meters
  const tidalPrism = basinArea * 1e6 * tidalRange; // km² to m², then multiply by range

  // Basin volume at mean tide
  const basinVolume = basinArea * 1e6 * meanDepth;

  // Flushing ratio (what fraction of the basin is exchanged)
  const flushingRatio = tidalPrism / basinVolume;

  // Simple flushing time estimate (tidal cycles to replace basin water)
  const flushingTime = 1 / flushingRatio;

  // Inlet cross-sectional area
  const inletArea = inletWidth * inletDepth;

  // Average flow velocity through inlet
  // Q = P / T where P is prism volume and T is half tidal period (~6.21 hours)
  const halfTidalPeriod = 6.21 * 3600; // seconds
  const avgFlowRate = tidalPrism / halfTidalPeriod; // m³/s
  const avgVelocity = avgFlowRate / inletArea; // m/s

  // Peak velocity (roughly π/2 times average for sinusoidal tide)
  const peakVelocity = avgVelocity * (Math.PI / 2);

  // Format volume for display
  const formatVolume = (cubicMeters: number) => {
    if (cubicMeters >= 1e9) {
      return `${(cubicMeters / 1e9).toFixed(2)} km³`;
    } else if (cubicMeters >= 1e6) {
      return `${(cubicMeters / 1e6).toFixed(2)} million m³`;
    } else if (cubicMeters >= 1e3) {
      return `${(cubicMeters / 1e3).toFixed(1)} thousand m³`;
    }
    return `${cubicMeters.toFixed(0)} m³`;
  };

  const formatVelocity = (ms: number) => {
    const knots = ms * 1.94384;
    return `${ms.toFixed(2)} m/s (${knots.toFixed(1)} kts)`;
  };

  const formatFlowRate = (cubicMeterPerSec: number) => {
    if (cubicMeterPerSec >= 1000) {
      return `${(cubicMeterPerSec / 1000).toFixed(1)} thousand m³/s`;
    }
    return `${cubicMeterPerSec.toFixed(1)} m³/s`;
  };

  // Flushing quality assessment
  const getFlushingAssessment = () => {
    if (flushingRatio > 0.5) return { status: 'Excellent', color: 'text-green-400', desc: 'Strong tidal flushing, good water quality' };
    if (flushingRatio > 0.3) return { status: 'Good', color: 'text-green-400', desc: 'Adequate flushing for most conditions' };
    if (flushingRatio > 0.15) return { status: 'Moderate', color: 'text-yellow-400', desc: 'May accumulate pollutants during calm weather' };
    if (flushingRatio > 0.05) return { status: 'Poor', color: 'text-orange-400', desc: 'Limited exchange, potential water quality issues' };
    return { status: 'Very Poor', color: 'text-red-400', desc: 'Stagnant conditions likely, poor water quality' };
  };

  const flushing = getFlushingAssessment();

  if (!selectedStation) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🌊 Tidal Prism Calculator
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
          {/* Current Tidal Conditions */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Tidal Conditions at {selectedStation.name}</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Range:</span>
                <span className="text-cyan-400 ml-1">{formatHeight(tidalRange, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">High:</span>
                <span className="text-green-400 ml-1">{formatHeight(tidalData?.highTide || 0, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Low:</span>
                <span className="text-amber-400 ml-1">{formatHeight(tidalData?.lowTide || 0, unitSystem)}</span>
              </div>
            </div>
          </div>

          {/* Basin Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Basin Parameters</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Basin Surface Area
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={basinArea}
                  onChange={(e) => setBasinArea(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-24 text-right">{basinArea.toFixed(2)} km²</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Mean Basin Depth
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={meanDepth}
                  onChange={(e) => setMeanDepth(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-24 text-right">{formatHeight(meanDepth, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Inlet Width
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={inletWidth}
                  onChange={(e) => setInletWidth(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-24 text-right">{inletWidth} m</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Inlet Depth
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={inletDepth}
                  onChange={(e) => setInletDepth(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-24 text-right">{formatHeight(inletDepth, unitSystem)}</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-900 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-white mb-2">Tidal Exchange Results</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Tidal Prism</div>
                <div className="text-lg font-bold text-cyan-400">{formatVolume(tidalPrism)}</div>
                <div className="text-xs text-slate-500">Volume exchanged per cycle</div>
              </div>

              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Basin Volume</div>
                <div className="text-lg font-bold text-blue-400">{formatVolume(basinVolume)}</div>
                <div className="text-xs text-slate-500">At mean tide level</div>
              </div>

              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Flushing Ratio</div>
                <div className="text-lg font-bold text-amber-400">{(flushingRatio * 100).toFixed(1)}%</div>
                <div className="text-xs text-slate-500">Per tidal cycle</div>
              </div>

              <div className="bg-slate-800 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Flushing Time</div>
                <div className="text-lg font-bold text-purple-400">
                  {flushingTime < 1 ? `${(flushingTime * 12.42).toFixed(1)} hrs` : `${flushingTime.toFixed(1)} cycles`}
                </div>
                <div className="text-xs text-slate-500">To replace basin water</div>
              </div>
            </div>

            {/* Flow Parameters */}
            <div className="bg-slate-800 rounded p-3">
              <div className="text-xs text-slate-400 mb-2">Inlet Flow</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Avg Flow:</span>
                  <span className="text-white ml-1">{formatFlowRate(avgFlowRate)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Inlet Area:</span>
                  <span className="text-white ml-1">{inletArea.toLocaleString()} m²</span>
                </div>
                <div>
                  <span className="text-slate-400">Avg Velocity:</span>
                  <span className="text-white ml-1">{formatVelocity(avgVelocity)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Peak Velocity:</span>
                  <span className="text-amber-400 ml-1">{formatVelocity(peakVelocity)}</span>
                </div>
              </div>
            </div>

            {/* Flushing Assessment */}
            <div className={`flex items-start gap-2 p-3 rounded ${
              flushing.status === 'Excellent' || flushing.status === 'Good' ? 'bg-green-900/30' :
              flushing.status === 'Moderate' ? 'bg-yellow-900/30' :
              flushing.status === 'Poor' ? 'bg-orange-900/30' : 'bg-red-900/30'
            }`}>
              <span className={`text-sm font-medium ${flushing.color}`}>
                {flushing.status} Flushing
              </span>
              <span className="text-xs text-slate-400">{flushing.desc}</span>
            </div>
          </div>

          {/* Diagram */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <h4 className="text-xs text-slate-400 mb-2">Tidal Prism Concept</h4>
            <svg viewBox="0 0 300 80" className="w-full h-20">
              {/* Basin outline */}
              <path d="M20 60 L20 40 L130 40 L130 60" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <path d="M170 60 L170 40 L280 40 L280 60" fill="none" stroke="#38bdf8" strokeWidth="2" />

              {/* Water at different levels */}
              <rect x="20" y="50" width="110" height="10" fill="#0ea5e9" opacity="0.3" />
              <rect x="20" y="40" width="110" height="10" fill="#0ea5e9" opacity="0.5" />

              {/* Inlet */}
              <rect x="130" y="45" width="40" height="15" fill="#1e40af" opacity="0.5" />

              {/* Arrows showing flow */}
              <path d="M145 50 L155 50 M152 47 L155 50 L152 53" stroke="#fbbf24" strokeWidth="2" fill="none" />

              {/* Labels */}
              <text x="75" y="35" fill="#94a3b8" fontSize="8" textAnchor="middle">High Tide</text>
              <text x="75" y="70" fill="#94a3b8" fontSize="8" textAnchor="middle">Low Tide</text>
              <text x="150" y="70" fill="#fbbf24" fontSize="8" textAnchor="middle">Inlet</text>
              <text x="225" y="50" fill="#94a3b8" fontSize="8" textAnchor="middle">Ocean</text>

              {/* Prism indicator */}
              <rect x="22" y="40" width="106" height="10" fill="#fbbf24" opacity="0.3" />
              <text x="75" y="47" fill="#fbbf24" fontSize="7" textAnchor="middle">Prism</text>
            </svg>
          </div>

          {/* Educational Notes */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• <strong>Tidal Prism</strong> = water volume exchanged between high and low tide</p>
            <p>• <strong>Flushing Ratio</strong> = prism ÷ basin volume (exchange efficiency)</p>
            <p>• Higher ratios mean better water quality and pollutant dispersal</p>
            <p>• Peak velocities occur mid-tide when flow rate is highest</p>
          </div>
        </div>
      </div>
    </div>
  );
}
