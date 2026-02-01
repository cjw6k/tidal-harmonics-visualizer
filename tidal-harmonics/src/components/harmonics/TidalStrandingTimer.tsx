import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { addHours, format, differenceInMinutes } from 'date-fns';

interface TidalStrandingTimerProps {
  onClose: () => void;
}

interface StrandingScenario {
  groundingTime: Date;
  groundingHeight: number;
  refloatTime: Date | null;
  refloatHeight: number | null;
  strandedDuration: number | null; // minutes
  nextHighWater: { time: Date; height: number } | null;
  tideAtGrounding: 'rising' | 'falling';
  immediateRefloat: boolean;
}

export function TidalStrandingTimer({ onClose }: TidalStrandingTimerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Scenario parameters
  const [groundingDepth, setGroundingDepth] = useState(1.5); // depth at grounding location (chart datum)
  const [vesselDraft, setVesselDraft] = useState(2.0); // vessel draft
  const [currentTime, setCurrentTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [refloatMargin, setRefloatMargin] = useState(0.3); // additional water needed above just floating

  // Calculate stranding scenario
  const scenario = useMemo((): StrandingScenario | null => {
    if (!selectedStation) return null;

    const groundingTime = new Date(currentTime);
    const analysisEnd = addHours(groundingTime, 48); // Look ahead 48 hours

    // Get detailed tide series
    const series = predictTideSeries(selectedStation, groundingTime, analysisEnd, 5);

    if (series.length === 0) return null;

    const groundingHeight = series[0]!.height;

    // Calculate minimum water level needed to refloat
    // Water depth = ground depth + tide height
    // To float: water depth >= draft + margin
    // So: ground depth + tide height >= draft + margin
    // Therefore: tide height >= draft + margin - ground depth
    const minRefloatTide = vesselDraft + refloatMargin - groundingDepth;

    // Determine if currently rising or falling
    const secondPoint = series[1];
    const tideAtGrounding: 'rising' | 'falling' =
      secondPoint && secondPoint.height > groundingHeight ? 'rising' : 'falling';

    // Check if vessel is even grounded (current tide might be sufficient)
    const currentWaterDepth = groundingDepth + groundingHeight;
    if (currentWaterDepth >= vesselDraft + refloatMargin) {
      return {
        groundingTime,
        groundingHeight,
        refloatTime: groundingTime,
        refloatHeight: groundingHeight,
        strandedDuration: 0,
        nextHighWater: null,
        tideAtGrounding,
        immediateRefloat: true,
      };
    }

    // Find when tide rises above refloat threshold
    let refloatTime: Date | null = null;
    let refloatHeight: number | null = null;

    for (let i = 1; i < series.length; i++) {
      const point = series[i]!;
      if (point.height >= minRefloatTide) {
        refloatTime = point.time;
        refloatHeight = point.height;
        break;
      }
    }

    // Find next high water
    const extremes = findExtremes(series);
    const nextHigh = extremes.find(e => e.type === 'high' && e.time > groundingTime);

    const strandedDuration = refloatTime
      ? differenceInMinutes(refloatTime, groundingTime)
      : null;

    return {
      groundingTime,
      groundingHeight,
      refloatTime,
      refloatHeight,
      strandedDuration,
      nextHighWater: nextHigh ? { time: nextHigh.time, height: nextHigh.height } : null,
      tideAtGrounding,
      immediateRefloat: false,
    };
  }, [selectedStation, currentTime, groundingDepth, vesselDraft, refloatMargin]);

  // Calculate tide series for visualization
  const tideSeries = useMemo(() => {
    if (!selectedStation) return [];

    const start = new Date(currentTime);
    const end = addHours(start, 24);
    return predictTideSeries(selectedStation, start, end, 10);
  }, [selectedStation, currentTime]);

  const formatLength = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(2)} m`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const minRefloatTide = vesselDraft + refloatMargin - groundingDepth;
  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Tidal Stranding Timer</h3>
            <p className="text-slate-400 text-sm">
              Calculate stranding duration and refloat time if grounded
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Scenario Parameters</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Grounding Time</label>
                <input
                  type="datetime-local"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(e.target.value)}
                  className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Charted Depth (m)</label>
                  <input
                    type="number"
                    value={groundingDepth}
                    onChange={(e) => setGroundingDepth(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Vessel Draft (m)</label>
                  <input
                    type="number"
                    value={vesselDraft}
                    onChange={(e) => setVesselDraft(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0.5"
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Refloat Safety Margin (m)</label>
                <input
                  type="range"
                  value={refloatMargin}
                  onChange={(e) => setRefloatMargin(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="1"
                  step="0.1"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Just floating</span>
                  <span className="text-cyan-400">{formatLength(refloatMargin)}</span>
                  <span>Safe margin</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Calculated Values</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Station:</span>
                <span className="text-slate-200 truncate ml-2">{stationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min tide to refloat:</span>
                <span className="text-cyan-400 font-mono">{formatLength(minRefloatTide)}</span>
              </div>
              {scenario && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tide at grounding:</span>
                    <span className="text-slate-200 font-mono">
                      {formatLength(scenario.groundingHeight)} ({scenario.tideAtGrounding})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Water depth at site:</span>
                    <span className="text-slate-200 font-mono">
                      {formatLength(groundingDepth + scenario.groundingHeight)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Result */}
        {scenario && (
          <div className={`rounded-lg p-4 mb-4 ${
            scenario.immediateRefloat
              ? 'bg-green-900/30 border border-green-500'
              : scenario.refloatTime
              ? 'bg-amber-900/30 border border-amber-500'
              : 'bg-red-900/30 border border-red-500'
          }`}>
            {scenario.immediateRefloat ? (
              <div className="text-center">
                <p className="text-2xl mb-1">✓</p>
                <p className="text-green-400 font-bold text-lg">Not Stranded</p>
                <p className="text-slate-300 text-sm">
                  Current water depth ({formatLength(groundingDepth + scenario.groundingHeight)})
                  exceeds required depth ({formatLength(vesselDraft + refloatMargin)})
                </p>
              </div>
            ) : scenario.refloatTime ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Stranded Duration</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {scenario.strandedDuration !== null
                      ? formatDuration(scenario.strandedDuration)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Refloat Time</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {format(scenario.refloatTime, 'HH:mm')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(scenario.refloatTime, 'MMM d')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Refloat Tide Height</p>
                  <p className="text-xl font-bold text-slate-200">
                    {scenario.refloatHeight !== null
                      ? formatLength(scenario.refloatHeight)
                      : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl mb-1">⚠️</p>
                <p className="text-red-400 font-bold text-lg">Extended Stranding</p>
                <p className="text-slate-300 text-sm">
                  Tide will not rise high enough to refloat in the next 48 hours.
                  {scenario.nextHighWater && (
                    <> Next HW: {format(scenario.nextHighWater.time, 'HH:mm')} at {formatLength(scenario.nextHighWater.height)}</>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline Visualization */}
        {tideSeries.length > 0 && scenario && (
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">24-Hour Tide Projection</h4>

            <div className="h-32 relative">
              {/* Refloat threshold line */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500/70"
                style={{
                  top: `${Math.max(5, Math.min(95, 50 - minRefloatTide * 20))}%`,
                }}
              >
                <span className="absolute right-0 -top-4 text-xs text-amber-400 bg-slate-800 px-1">
                  Refloat: {formatLength(minRefloatTide)}
                </span>
              </div>

              {/* Zero line */}
              <div
                className="absolute left-0 right-0 border-t border-slate-600"
                style={{ top: '50%' }}
              >
                <span className="absolute right-0 -top-3 text-xs text-slate-500">0</span>
              </div>

              {/* Tide curve */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* Area below refloat threshold (stranded) */}
                <path
                  d={`M 0 100 ` +
                    tideSeries.map((p, i) => {
                      const x = (i / (tideSeries.length - 1)) * 100;
                      const y = Math.max(0, Math.min(100, 50 - p.height * 20));
                      return `L ${x} ${Math.max(y, 50 - minRefloatTide * 20)}`;
                    }).join(' ') +
                    ` L 100 100 Z`
                  }
                  fill="rgba(239, 68, 68, 0.2)"
                />

                {/* Tide curve line */}
                <path
                  d={`M 0 ${50 - tideSeries[0]!.height * 20} ` +
                    tideSeries.map((p, i) => {
                      const x = (i / (tideSeries.length - 1)) * 100;
                      const y = 50 - p.height * 20;
                      return `L ${x} ${Math.max(0, Math.min(100, y))}`;
                    }).join(' ')
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan-400"
                />

                {/* Grounding point marker */}
                <circle
                  cx="0"
                  cy={50 - scenario.groundingHeight * 20}
                  r="3"
                  className="fill-red-500"
                />

                {/* Refloat point marker */}
                {scenario.refloatTime && scenario.refloatHeight !== null && (
                  <circle
                    cx={(differenceInMinutes(scenario.refloatTime, new Date(currentTime)) / (24 * 60)) * 100}
                    cy={50 - scenario.refloatHeight * 20}
                    r="3"
                    className="fill-green-500"
                  />
                )}
              </svg>
            </div>

            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Now</span>
              <span>+6h</span>
              <span>+12h</span>
              <span>+18h</span>
              <span>+24h</span>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">Grounding</span>
              </div>
              {scenario.refloatTime && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-slate-400">Refloat</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500/30" />
                <span className="text-slate-400">Stranded period</span>
              </div>
            </div>
          </div>
        )}

        {/* Safety Notes */}
        <div className="mt-4 bg-slate-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Important Considerations</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Ensure vessel can safely remain grounded (upright, no structural damage)</li>
            <li>• Consider tidal surge and weather effects on actual water levels</li>
            <li>• Engine/propeller clearance may require more water than hull draft</li>
            <li>• Soft bottom (mud/sand) may allow settling deeper over time</li>
            <li>• Have anchor ready to prevent being pushed further aground by rising tide</li>
            <li>• Contact port authority/coast guard if stranding will be extended</li>
          </ul>
        </div>

        {/* Help */}
        <div className="mt-4 text-xs text-slate-500">
          <p>
            <strong>How it works:</strong> Compares the water depth at the grounding location
            (charted depth + tide height) against your vessel's draft plus safety margin.
            The refloat time is when the tide rises enough to provide adequate water.
          </p>
        </div>
      </div>
    </div>
  );
}
