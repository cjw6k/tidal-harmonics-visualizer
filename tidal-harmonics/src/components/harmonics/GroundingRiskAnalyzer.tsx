import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { addHours, format } from 'date-fns';

interface GroundingRiskAnalyzerProps {
  onClose: () => void;
}

interface RiskPoint {
  time: Date;
  tideHeight: number;
  waterDepth: number;
  ukc: number;
  riskLevel: 'safe' | 'caution' | 'danger' | 'grounding';
  percentOfRange: number;
}

interface ShallowPoint {
  name: string;
  chartedDepth: number;
  criticalDepth: number;
}

export function GroundingRiskAnalyzer({ onClose }: GroundingRiskAnalyzerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Vessel parameters
  const [draft, setDraft] = useState(2.5); // meters
  const [safetyMargin, setSafetyMargin] = useState(0.5); // minimum UKC
  const [cautionMargin, setCautionMargin] = useState(1.0); // caution threshold

  // Route shallow points
  const [shallowPoints, setShallowPoints] = useState<ShallowPoint[]>([
    { name: 'Channel entrance', chartedDepth: 3.0, criticalDepth: 2.8 },
  ]);

  // Time range
  const [hoursAhead, setHoursAhead] = useState(24);

  // Get the shallowest point for primary analysis
  const criticalDepth = useMemo(() => {
    return Math.min(...shallowPoints.map(p => p.chartedDepth));
  }, [shallowPoints]);

  // Calculate risk timeline
  const riskAnalysis = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const end = addHours(now, hoursAhead);
    const series = predictTideSeries(selectedStation, now, end, 10);

    // Find extremes for percentage calculation
    const extremes = findExtremes(series);
    const heights = series.map(s => s.height);
    const minTide = Math.min(...heights);
    const maxTide = Math.max(...heights);
    const tideRange = maxTide - minTide;

    const riskPoints: RiskPoint[] = series.map(point => {
      const waterDepth = criticalDepth + point.height;
      const ukc = waterDepth - draft;

      let riskLevel: RiskPoint['riskLevel'];
      if (ukc < 0) {
        riskLevel = 'grounding';
      } else if (ukc < safetyMargin) {
        riskLevel = 'danger';
      } else if (ukc < cautionMargin) {
        riskLevel = 'caution';
      } else {
        riskLevel = 'safe';
      }

      const percentOfRange = tideRange > 0
        ? ((point.height - minTide) / tideRange) * 100
        : 50;

      return {
        time: point.time,
        tideHeight: point.height,
        waterDepth,
        ukc,
        riskLevel,
        percentOfRange,
      };
    });

    // Find safe windows
    const safeWindows: { start: Date; end: Date; minUKC: number }[] = [];
    let windowStart: Date | null = null;
    let windowMinUKC = Infinity;

    for (let i = 0; i < riskPoints.length; i++) {
      const point = riskPoints[i]!;
      const isSafe = point.riskLevel === 'safe';

      if (isSafe && !windowStart) {
        windowStart = point.time;
        windowMinUKC = point.ukc;
      } else if (isSafe && windowStart) {
        windowMinUKC = Math.min(windowMinUKC, point.ukc);
      } else if (!isSafe && windowStart) {
        safeWindows.push({
          start: windowStart,
          end: riskPoints[i - 1]!.time,
          minUKC: windowMinUKC,
        });
        windowStart = null;
        windowMinUKC = Infinity;
      }
    }

    if (windowStart) {
      safeWindows.push({
        start: windowStart,
        end: riskPoints[riskPoints.length - 1]!.time,
        minUKC: windowMinUKC,
      });
    }

    // Summary stats
    const groundingRisk = riskPoints.some(p => p.riskLevel === 'grounding');
    const dangerPeriods = riskPoints.filter(p => p.riskLevel === 'danger' || p.riskLevel === 'grounding').length;
    const safePercentage = (riskPoints.filter(p => p.riskLevel === 'safe').length / riskPoints.length) * 100;

    // Minimum tide height needed for safe passage
    const minSafeTide = draft + safetyMargin - criticalDepth;

    return {
      riskPoints,
      extremes,
      safeWindows,
      stats: {
        groundingRisk,
        dangerPeriods,
        safePercentage,
        minTide,
        maxTide,
        tideRange,
        minSafeTide,
        criticalDepth,
      },
    };
  }, [selectedStation, hoursAhead, draft, safetyMargin, cautionMargin, criticalDepth]);

  const formatLength = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(2)} m`;
  };

  const addShallowPoint = () => {
    setShallowPoints([
      ...shallowPoints,
      { name: `Point ${shallowPoints.length + 1}`, chartedDepth: 3.0, criticalDepth: 2.8 },
    ]);
  };

  const removeShallowPoint = (index: number) => {
    setShallowPoints(shallowPoints.filter((_, i) => i !== index));
  };

  const updateShallowPoint = (index: number, field: keyof ShallowPoint, value: string | number) => {
    setShallowPoints(shallowPoints.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const getRiskColor = (level: RiskPoint['riskLevel']) => {
    switch (level) {
      case 'safe': return 'bg-green-500';
      case 'caution': return 'bg-yellow-500';
      case 'danger': return 'bg-orange-500';
      case 'grounding': return 'bg-red-600';
    }
  };

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Grounding Risk Analyzer</h3>
            <p className="text-slate-400 text-sm">
              Analyze passage safety based on vessel draft and tidal conditions
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

        {/* Risk Warning Banner */}
        {riskAnalysis?.stats.groundingRisk && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold">GROUNDING RISK DETECTED</p>
                <p className="text-sm">
                  Tide height falls below safe passage level during this period.
                  Review safe windows carefully.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Vessel Parameters */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Vessel Parameters</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Vessel Draft</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={draft}
                    onChange={(e) => setDraft(Number(e.target.value))}
                    className="flex-1 bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0.5"
                    step="0.1"
                  />
                  <span className="text-xs text-slate-500">m</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Min Safe UKC</label>
                  <input
                    type="number"
                    value={safetyMargin}
                    onChange={(e) => setSafetyMargin(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Caution UKC</label>
                  <input
                    type="number"
                    value={cautionMargin}
                    onChange={(e) => setCautionMargin(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Analysis Period (hours)</label>
                <input
                  type="range"
                  value={hoursAhead}
                  onChange={(e) => setHoursAhead(Number(e.target.value))}
                  className="w-full"
                  min="6"
                  max="72"
                  step="6"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>6h</span>
                  <span className="text-cyan-400">{hoursAhead}h</span>
                  <span>72h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shallow Points */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-slate-300">Route Shallow Points</h4>
              <button
                onClick={addShallowPoint}
                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {shallowPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-700/50 rounded p-2">
                  <input
                    type="text"
                    value={point.name}
                    onChange={(e) => updateShallowPoint(i, 'name', e.target.value)}
                    className="flex-1 bg-slate-700 rounded px-2 py-1 text-xs"
                    placeholder="Location name"
                  />
                  <input
                    type="number"
                    value={point.chartedDepth}
                    onChange={(e) => updateShallowPoint(i, 'chartedDepth', Number(e.target.value))}
                    className="w-16 bg-slate-700 rounded px-2 py-1 text-xs"
                    step="0.1"
                    title="Charted depth (m)"
                  />
                  <span className="text-xs text-slate-500">m</span>
                  {shallowPoints.length > 1 && (
                    <button
                      onClick={() => removeShallowPoint(i)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Critical depth: {formatLength(criticalDepth)} (shallowest point)
            </p>
          </div>
        </div>

        {/* Results Summary */}
        {riskAnalysis && (
          <>
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-400">Safe Passage</p>
                  <p className={`text-xl font-bold ${
                    riskAnalysis.stats.safePercentage === 100 ? 'text-green-400' :
                    riskAnalysis.stats.safePercentage > 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {riskAnalysis.stats.safePercentage.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tidal Range</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {formatLength(riskAnalysis.stats.tideRange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Min Safe Tide</p>
                  <p className="text-xl font-bold text-amber-400">
                    {formatLength(riskAnalysis.stats.minSafeTide)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Station</p>
                  <p className="text-sm font-medium text-slate-300 truncate">
                    {stationName}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Timeline */}
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Risk Timeline</h4>

              {/* Legend */}
              <div className="flex gap-4 mb-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-slate-400">Safe</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <span className="text-slate-400">Caution</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500" />
                  <span className="text-slate-400">Danger</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-600" />
                  <span className="text-slate-400">Grounding</span>
                </div>
              </div>

              {/* Timeline bars */}
              <div className="h-8 flex rounded overflow-hidden mb-2">
                {riskAnalysis.riskPoints.map((point, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${getRiskColor(point.riskLevel)} transition-colors`}
                    title={`${format(point.time, 'HH:mm')}: UKC ${formatLength(point.ukc)}`}
                  />
                ))}
              </div>

              {/* Time labels */}
              <div className="flex justify-between text-xs text-slate-500">
                <span>Now</span>
                <span>+{Math.round(hoursAhead / 4)}h</span>
                <span>+{Math.round(hoursAhead / 2)}h</span>
                <span>+{Math.round(hoursAhead * 3 / 4)}h</span>
                <span>+{hoursAhead}h</span>
              </div>

              {/* Tide height curve overlay hint */}
              <div className="h-16 relative mt-2 border-t border-slate-700 pt-2">
                <div className="absolute left-0 text-xs text-slate-500">
                  UKC
                </div>
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <path
                    d={`M 0 ${50 - Math.min(50, Math.max(-50, riskAnalysis.riskPoints[0]?.ukc ?? 0) * 15)} ` +
                      riskAnalysis.riskPoints.map((p, i) => {
                        const x = (i / (riskAnalysis.riskPoints.length - 1)) * 100;
                        const y = 50 - Math.min(50, Math.max(-50, p.ukc * 15));
                        return `L ${x} ${y}`;
                      }).join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-cyan-400"
                  />
                  {/* Zero line */}
                  <line x1="0" y1="50" x2="100" y2="50"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    className="text-red-500/50"
                  />
                </svg>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-red-400">
                  0
                </div>
              </div>
            </div>

            {/* Safe Windows */}
            {riskAnalysis.safeWindows.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Safe Passage Windows</h4>
                <div className="space-y-1">
                  {riskAnalysis.safeWindows.slice(0, 6).map((window, i) => (
                    <div key={i} className="flex justify-between bg-green-900/30 rounded px-3 py-2">
                      <span className="text-green-400 font-medium">
                        {format(window.start, 'MMM d HH:mm')} - {format(window.end, 'HH:mm')}
                      </span>
                      <span className="text-slate-400 text-sm">
                        Min UKC: {formatLength(window.minUKC)}
                      </span>
                    </div>
                  ))}
                </div>
                {riskAnalysis.safeWindows.length === 0 && (
                  <p className="text-red-400 text-sm">
                    No safe passage windows found in this period.
                  </p>
                )}
              </div>
            )}

            {/* High/Low Tides */}
            {riskAnalysis.extremes.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Tide Extremes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {riskAnalysis.extremes.slice(0, 8).map((extreme, i) => {
                    const waterDepth = criticalDepth + extreme.height;
                    const ukc = waterDepth - draft;
                    const isSafe = ukc >= safetyMargin;

                    return (
                      <div key={i} className={`rounded p-2 ${
                        extreme.type === 'high' ? 'bg-blue-900/30' : 'bg-slate-700/50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className={extreme.type === 'high' ? 'text-blue-400' : 'text-slate-400'}>
                            {extreme.type === 'high' ? '▲ HW' : '▼ LW'}
                          </span>
                          <span className={`text-xs ${isSafe ? 'text-green-400' : 'text-red-400'}`}>
                            {isSafe ? '✓' : '⚠'}
                          </span>
                        </div>
                        <p className="text-sm font-mono">{format(extreme.time, 'HH:mm')}</p>
                        <p className="text-xs text-slate-500">{formatLength(extreme.height)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Help Text */}
        <div className="mt-4 text-xs text-slate-500">
          <p>
            <strong>UKC (Under Keel Clearance)</strong> = Water Depth - Vessel Draft.
            The minimum safe UKC accounts for vessel motion, squat, and chart accuracy.
          </p>
          <p className="mt-1">
            <strong>Note:</strong> Always apply additional safety margins for wave action,
            squat at speed, and chart datum uncertainties. Verify depths with current charts.
          </p>
        </div>
      </div>
    </div>
  );
}
