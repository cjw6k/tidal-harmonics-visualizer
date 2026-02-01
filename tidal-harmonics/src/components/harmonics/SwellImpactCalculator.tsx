import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries } from '@/lib/harmonics';
import { addHours, format } from 'date-fns';

interface SwellImpactCalculatorProps {
  onClose: () => void;
}

interface SwellConditions {
  significantHeight: number; // Hs in meters
  period: number; // seconds
  direction: number; // degrees (0 = from N)
}

interface DepthResult {
  time: Date;
  tideHeight: number;
  effectiveMin: number;
  effectiveMax: number;
  orbitalDepth: number;
  squat: number;
  ukc: number; // Under keel clearance
  safe: boolean;
}

// Wave orbital motion decreases exponentially with depth
function calculateOrbitalMotion(waveHeight: number, period: number, depth: number): number {
  // Wavelength approximation for deep water
  const wavelength = (9.81 * period * period) / (2 * Math.PI);

  // Orbital velocity decay factor
  const k = (2 * Math.PI) / wavelength;
  const decayFactor = Math.exp(-k * depth);

  // Orbital amplitude at depth (simplified)
  return (waveHeight / 2) * decayFactor;
}

// Calculate ship squat (speed-dependent vessel sinkage)
function calculateSquat(speed: number, blockCoefficient: number, channelDepth: number, draft: number): number {
  // Simplified squat calculation (Barrass formula)
  // Squat = Cb × (Speed^2.08) / 30 for open water
  const speedKnots = speed;
  const squatFactor = blockCoefficient * Math.pow(speedKnots, 2.08) / 30;

  // Increase squat in shallow water
  const depthRatio = channelDepth / draft;
  const shallowFactor = depthRatio < 1.5 ? 1.5 - (depthRatio - 1) : 1;

  return squatFactor * shallowFactor;
}

export function SwellImpactCalculator({ onClose }: SwellImpactCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Swell conditions
  const [swell, setSwell] = useState<SwellConditions>({
    significantHeight: 1.5,
    period: 8,
    direction: 270,
  });

  // Vessel and channel parameters
  const [draft, setDraft] = useState(3.5); // meters
  const [speed, setSpeed] = useState(8); // knots
  const [blockCoefficient, setBlockCoefficient] = useState(0.65);
  const [chartedDepth, setChartedDepth] = useState(6); // meters below chart datum
  const [requiredUKC, setRequiredUKC] = useState(1.0); // minimum under keel clearance

  // Calculate 24-hour analysis
  const analysis = useMemo(() => {
    if (!selectedStation) return [];

    const now = new Date();
    const end = addHours(now, 24);
    const tideSeries = predictTideSeries(selectedStation, now, end, 30);

    const results: DepthResult[] = [];

    for (const point of tideSeries) {
      // Total water depth = charted depth + tide height
      const totalDepth = chartedDepth + point.height;

      // Wave orbital motion at vessel draft depth
      const orbitalAmplitude = calculateOrbitalMotion(swell.significantHeight, swell.period, draft);

      // Squat effect
      const squat = calculateSquat(speed, blockCoefficient, totalDepth, draft);

      // Effective depth range (accounting for wave-induced motion)
      // H1/10 (average of highest 10%) ≈ 1.27 × Hs
      const waveMax = swell.significantHeight * 1.27;
      const effectiveMin = totalDepth - (waveMax / 2) - orbitalAmplitude;
      const effectiveMax = totalDepth + (waveMax / 2) + orbitalAmplitude;

      // Under keel clearance (worst case)
      const ukc = effectiveMin - draft - squat;

      results.push({
        time: point.time,
        tideHeight: point.height,
        effectiveMin,
        effectiveMax,
        orbitalDepth: orbitalAmplitude,
        squat,
        ukc,
        safe: ukc >= requiredUKC,
      });
    }

    return results;
  }, [selectedStation, swell, draft, speed, blockCoefficient, chartedDepth, requiredUKC]);

  // Summary statistics
  const summary = useMemo(() => {
    if (analysis.length === 0) return null;

    const minUKC = Math.min(...analysis.map(r => r.ukc));
    const maxUKC = Math.max(...analysis.map(r => r.ukc));
    const unsafeCount = analysis.filter(r => !r.safe).length;

    // Find safe passage windows
    const windows: { start: Date; end: Date }[] = [];
    let windowStart: Date | null = null;

    for (let i = 0; i < analysis.length; i++) {
      const point = analysis[i]!;
      if (point.safe && !windowStart) {
        windowStart = point.time;
      } else if (!point.safe && windowStart) {
        windows.push({ start: windowStart, end: analysis[i - 1]!.time });
        windowStart = null;
      }
    }
    if (windowStart) {
      windows.push({ start: windowStart, end: analysis[analysis.length - 1]!.time });
    }

    return {
      minUKC,
      maxUKC,
      unsafeCount,
      totalPoints: analysis.length,
      safePercentage: ((analysis.length - unsafeCount) / analysis.length) * 100,
      windows,
    };
  }, [analysis]);

  const formatLength = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(2)} m`;
  };

  const getBeaufortDescription = (hs: number): string => {
    if (hs < 0.1) return 'Calm (Sea 0)';
    if (hs < 0.5) return 'Smooth (Sea 2)';
    if (hs < 1.25) return 'Slight (Sea 3)';
    if (hs < 2.5) return 'Moderate (Sea 4)';
    if (hs < 4) return 'Rough (Sea 5)';
    if (hs < 6) return 'Very Rough (Sea 6)';
    if (hs < 9) return 'High (Sea 7)';
    return 'Very High (Sea 8+)';
  };

  const getDirectionName = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index] ?? 'N';
  };

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Swell & Wave Impact Calculator</h3>
            <p className="text-slate-400 text-sm">
              Calculate effective water depth accounting for wave motion and vessel squat
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Swell Conditions */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Swell Conditions</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Significant Wave Height (Hs)</label>
                <input
                  type="range"
                  value={swell.significantHeight}
                  onChange={(e) => setSwell({ ...swell, significantHeight: Number(e.target.value) })}
                  className="w-full"
                  min="0"
                  max="8"
                  step="0.1"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Calm</span>
                  <span className="text-cyan-400">
                    {formatLength(swell.significantHeight)} - {getBeaufortDescription(swell.significantHeight)}
                  </span>
                  <span className="text-slate-500">Storm</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Wave Period (seconds)</label>
                <input
                  type="range"
                  value={swell.period}
                  onChange={(e) => setSwell({ ...swell, period: Number(e.target.value) })}
                  className="w-full"
                  min="4"
                  max="20"
                  step="0.5"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Wind waves</span>
                  <span className="text-cyan-400">{swell.period}s</span>
                  <span className="text-slate-500">Long swell</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Direction (from)</label>
                <input
                  type="range"
                  value={swell.direction}
                  onChange={(e) => setSwell({ ...swell, direction: Number(e.target.value) })}
                  className="w-full"
                  min="0"
                  max="360"
                  step="15"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">N</span>
                  <span className="text-cyan-400">{swell.direction}° ({getDirectionName(swell.direction)})</span>
                  <span className="text-slate-500">N</span>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded p-2 text-xs">
                <p className="text-slate-400">
                  Wavelength: ~{((9.81 * swell.period * swell.period) / (2 * Math.PI)).toFixed(0)}m
                </p>
                <p className="text-slate-400">
                  Max wave (H1/10): {formatLength(swell.significantHeight * 1.27)}
                </p>
              </div>
            </div>
          </div>

          {/* Vessel & Channel Parameters */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Vessel & Channel</h4>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Vessel Draft (m)</label>
                  <input
                    type="number"
                    value={draft}
                    onChange={(e) => setDraft(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0.5"
                    max="20"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Speed (knots)</label>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    max="30"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Charted Depth (m)</label>
                  <input
                    type="number"
                    value={chartedDepth}
                    onChange={(e) => setChartedDepth(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Required UKC (m)</label>
                  <input
                    type="number"
                    value={requiredUKC}
                    onChange={(e) => setRequiredUKC(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Block Coefficient (Cb)</label>
                <input
                  type="range"
                  value={blockCoefficient}
                  onChange={(e) => setBlockCoefficient(Number(e.target.value))}
                  className="w-full"
                  min="0.4"
                  max="0.9"
                  step="0.01"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Yacht (0.4)</span>
                  <span className="text-cyan-400">{blockCoefficient.toFixed(2)}</span>
                  <span className="text-slate-500">Tanker (0.9)</span>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded p-2 text-xs space-y-1">
                <p className="text-slate-400">
                  Station: {stationName}
                </p>
                <p className="text-slate-400">
                  Estimated squat at {speed} kts: {formatLength(calculateSquat(speed, blockCoefficient, chartedDepth + 1, draft))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Results */}
        {summary && (
          <div className={`mt-4 bg-slate-800 rounded-lg p-4 border-l-4 ${
            summary.safePercentage === 100 ? 'border-green-500' :
            summary.safePercentage > 50 ? 'border-amber-500' :
            'border-red-500'
          }`}>
            <h4 className="text-sm font-medium text-slate-300 mb-3">24-Hour Analysis Summary</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Minimum UKC</p>
                <p className={`text-xl font-mono ${summary.minUKC < requiredUKC ? 'text-red-400' : 'text-green-400'}`}>
                  {formatLength(summary.minUKC)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Maximum UKC</p>
                <p className="text-xl font-mono text-cyan-400">
                  {formatLength(summary.maxUKC)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Safe Passage</p>
                <p className={`text-xl font-mono ${summary.safePercentage === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                  {summary.safePercentage.toFixed(0)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-xl">
                  {summary.safePercentage === 100 ? '✓ Safe' :
                   summary.safePercentage > 50 ? '⚠ Caution' : '⛔ Restricted'}
                </p>
              </div>
            </div>

            {/* Safe Windows */}
            {summary.windows.length > 0 && summary.safePercentage < 100 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Safe Passage Windows:</p>
                <div className="space-y-1">
                  {summary.windows.slice(0, 5).map((window, i) => (
                    <div key={i} className="bg-slate-700/50 rounded px-2 py-1 text-sm flex justify-between">
                      <span className="text-green-400">
                        {format(window.start, 'HH:mm')} - {format(window.end, 'HH:mm')}
                      </span>
                      <span className="text-slate-400">
                        {format(window.start, 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline View */}
        {analysis.length > 0 && (
          <div className="mt-4 bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">24-Hour Timeline</h4>
            <div className="h-32 relative">
              {/* UKC requirement line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-amber-500/50"
                style={{
                  top: `${Math.max(0, Math.min(100, 50 - (requiredUKC / 4) * 50))}%`,
                }}
              >
                <span className="absolute right-0 -top-3 text-xs text-amber-400">
                  Req: {formatLength(requiredUKC)}
                </span>
              </div>

              {/* Zero line */}
              <div className="absolute left-0 right-0 border-t border-slate-600" style={{ top: '50%' }}>
                <span className="absolute right-0 -top-3 text-xs text-slate-500">0</span>
              </div>

              {/* UKC bars */}
              <div className="absolute inset-0 flex items-end">
                {analysis.map((point, i) => {
                  const normalizedUKC = (point.ukc / 4) * 50 + 50; // -4m to +4m range
                  const height = Math.max(2, Math.min(100, normalizedUKC));

                  return (
                    <div
                      key={i}
                      className="flex-1 mx-px"
                      title={`${format(point.time, 'HH:mm')}: UKC ${formatLength(point.ukc)}`}
                    >
                      <div
                        className={`w-full transition-all ${
                          point.safe ? 'bg-cyan-500/70' : 'bg-red-500/70'
                        }`}
                        style={{
                          height: `${height}%`,
                          marginTop: `${100 - height}%`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Now</span>
              <span>+6h</span>
              <span>+12h</span>
              <span>+18h</span>
              <span>+24h</span>
            </div>
          </div>
        )}

        {/* Detailed Data Table */}
        <details className="mt-4">
          <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
            Show detailed calculations
          </summary>
          <div className="mt-2 bg-slate-800 rounded-lg p-2 max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-1">Time</th>
                  <th className="text-right">Tide</th>
                  <th className="text-right">Depth</th>
                  <th className="text-right">Squat</th>
                  <th className="text-right">UKC</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {analysis.slice(0, 24).map((point, i) => (
                  <tr key={i} className={!point.safe ? 'bg-red-900/20' : ''}>
                    <td className="py-1">{format(point.time, 'HH:mm')}</td>
                    <td className="text-right">{formatLength(point.tideHeight)}</td>
                    <td className="text-right">{formatLength(point.effectiveMin)}</td>
                    <td className="text-right">{formatLength(point.squat)}</td>
                    <td className={`text-right ${point.ukc < requiredUKC ? 'text-red-400' : 'text-green-400'}`}>
                      {formatLength(point.ukc)}
                    </td>
                    <td className="text-center">{point.safe ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Educational Notes */}
        <div className="mt-4 text-xs text-slate-500 space-y-2">
          <p>
            <strong>Key Factors:</strong> Effective depth is reduced by wave orbital motion (vessels heave in swells),
            squat (hull sinks at speed), and the trough of passing waves. H1/10 (average of highest 10%) is used
            for safety calculations.
          </p>
          <p>
            <strong>Note:</strong> This is a simplified calculation. Actual conditions depend on wave direction,
            vessel heading, sea bed slope, and many other factors. Always maintain adequate safety margins
            and consult official navigation publications.
          </p>
        </div>
      </div>
    </div>
  );
}
