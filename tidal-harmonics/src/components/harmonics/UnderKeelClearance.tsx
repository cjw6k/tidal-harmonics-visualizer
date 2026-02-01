import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';

interface UnderKeelClearanceProps {
  onClose: () => void;
}

interface SafeWindow {
  start: Date;
  end: Date;
  minClearance: number;
  maxClearance: number;
  maxHeight: number;
}

export function UnderKeelClearance({ onClose }: UnderKeelClearanceProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const epoch = useTimeStore((s) => s.epoch);

  const [vesselDraft, setVesselDraft] = useState(3.5); // meters
  const [channelDepth, setChannelDepth] = useState(5.0); // meters at chart datum
  const [requiredUKC, setRequiredUKC] = useState(0.5); // meters
  const [squat, setSquat] = useState(0.2); // meters (vessel squat at speed)
  const [heelAllowance, setHeelAllowance] = useState(0); // meters

  const isMetric = unitSystem === 'metric';

  // Convert display values to metric for calculations
  const vesselDraftM = isMetric ? vesselDraft : vesselDraft / 3.281;
  const channelDepthM = isMetric ? channelDepth : channelDepth / 3.281;
  const requiredUKCM = isMetric ? requiredUKC : requiredUKC / 3.281;
  const squatM = isMetric ? squat : squat / 3.281;
  const heelM = isMetric ? heelAllowance : heelAllowance / 3.281;

  // Total draft including dynamic allowances
  const totalDraft = vesselDraftM + squatM + heelM;

  // Minimum tide height needed for safe passage
  const minTideRequired = totalDraft + requiredUKCM - channelDepthM;

  const analysis = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get tide predictions for next 24 hours
    const series = predictTideSeries(station, now, end, 10);
    const extremes = findExtremes(series);

    // Find safe passage windows
    const safeWindows: SafeWindow[] = [];
    let windowStart: Date | null = null;
    let windowMinClearance = Infinity;
    let windowMaxClearance = -Infinity;
    let windowMaxHeight = -Infinity;

    for (const point of series) {
      const availableDepth = channelDepthM + point.height;
      const ukc = availableDepth - totalDraft;
      const isSafe = ukc >= requiredUKCM;

      if (isSafe) {
        if (!windowStart) {
          windowStart = point.time;
          windowMinClearance = ukc;
          windowMaxClearance = ukc;
          windowMaxHeight = point.height;
        } else {
          windowMinClearance = Math.min(windowMinClearance, ukc);
          windowMaxClearance = Math.max(windowMaxClearance, ukc);
          windowMaxHeight = Math.max(windowMaxHeight, point.height);
        }
      } else if (windowStart) {
        safeWindows.push({
          start: windowStart,
          end: point.time,
          minClearance: windowMinClearance,
          maxClearance: windowMaxClearance,
          maxHeight: windowMaxHeight
        });
        windowStart = null;
        windowMinClearance = Infinity;
        windowMaxClearance = -Infinity;
        windowMaxHeight = -Infinity;
      }
    }

    // Close any open window
    if (windowStart) {
      safeWindows.push({
        start: windowStart,
        end: series[series.length - 1]!.time,
        minClearance: windowMinClearance,
        maxClearance: windowMaxClearance,
        maxHeight: windowMaxHeight
      });
    }

    // Current status
    const currentTide = series[0]?.height || 0;
    const currentDepth = channelDepthM + currentTide;
    const currentUKC = currentDepth - totalDraft;
    const currentStatus = currentUKC >= requiredUKCM ? 'safe' : 'unsafe';

    return {
      currentTide,
      currentDepth,
      currentUKC,
      currentStatus,
      safeWindows,
      extremes,
      minTideRequired: Math.max(0, minTideRequired)
    };
  }, [station, epoch, channelDepthM, totalDraft, requiredUKCM, minTideRequired]);

  const formatDepth = (d: number) => {
    if (isMetric) return `${d.toFixed(2)} m`;
    return `${(d * 3.281).toFixed(1)} ft`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!station) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-slate-400">No station selected</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Under Keel Clearance Calculator</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Station info */}
          <div className="bg-slate-900/50 rounded-lg p-3 mb-4 text-sm">
            <span className="text-slate-400">Station:</span>
            <span className="text-white ml-2 font-medium">{station.name}</span>
          </div>

          {/* Input parameters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Vessel Draft ({isMetric ? 'm' : 'ft'})
              </label>
              <input
                type="number"
                value={vesselDraft}
                onChange={(e) => setVesselDraft(Number(e.target.value))}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 bg-slate-700 rounded text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Channel Depth ({isMetric ? 'm' : 'ft'})
                <span className="text-xs text-slate-500 ml-1">(at chart datum)</span>
              </label>
              <input
                type="number"
                value={channelDepth}
                onChange={(e) => setChannelDepth(Number(e.target.value))}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 bg-slate-700 rounded text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Required UKC ({isMetric ? 'm' : 'ft'})
              </label>
              <input
                type="number"
                value={requiredUKC}
                onChange={(e) => setRequiredUKC(Number(e.target.value))}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 bg-slate-700 rounded text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Squat Allowance ({isMetric ? 'm' : 'ft'})
                <span className="text-xs text-slate-500 ml-1">(at speed)</span>
              </label>
              <input
                type="number"
                value={squat}
                onChange={(e) => setSquat(Number(e.target.value))}
                step="0.05"
                min="0"
                className="w-full px-3 py-2 bg-slate-700 rounded text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Heel Allowance ({isMetric ? 'm' : 'ft'})
              </label>
              <input
                type="number"
                value={heelAllowance}
                onChange={(e) => setHeelAllowance(Number(e.target.value))}
                step="0.05"
                min="0"
                className="w-full px-3 py-2 bg-slate-700 rounded text-white"
              />
            </div>
          </div>

          {/* Calculation summary */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Draft Calculation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-400 text-xs">Static Draft</div>
                <div className="text-white font-medium">{formatDepth(vesselDraftM)}</div>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-400 text-xs">+ Squat & Heel</div>
                <div className="text-white font-medium">{formatDepth(squatM + heelM)}</div>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-400 text-xs">= Total Draft</div>
                <div className="text-amber-400 font-bold">{formatDepth(totalDraft)}</div>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <div className="text-slate-400 text-xs">Min Tide Required</div>
                <div className="text-cyan-400 font-bold">
                  {minTideRequired > 0 ? formatDepth(minTideRequired) : 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Current status */}
          {analysis && (
            <>
              <div className={`rounded-lg p-4 mb-6 ${
                analysis.currentStatus === 'safe'
                  ? 'bg-green-900/30 border border-green-700/50'
                  : 'bg-red-900/30 border border-red-700/50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`text-4xl ${
                    analysis.currentStatus === 'safe' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {analysis.currentStatus === 'safe' ? '✓' : '✗'}
                  </span>
                  <div>
                    <div className={`font-bold text-lg ${
                      analysis.currentStatus === 'safe' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {analysis.currentStatus === 'safe' ? 'Safe to Transit' : 'Insufficient Clearance'}
                    </div>
                    <div className="text-sm text-slate-300">
                      Current tide: {formatDepth(analysis.currentTide)} |
                      Depth: {formatDepth(analysis.currentDepth)} |
                      UKC: <span className={analysis.currentStatus === 'safe' ? 'text-green-400' : 'text-red-400'}>
                        {formatDepth(analysis.currentUKC)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safe transit windows */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">
                  Safe Transit Windows (Next 24 Hours)
                </h3>
                {analysis.safeWindows.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.safeWindows.map((window, i) => (
                      <div key={i} className="bg-green-900/20 border border-green-700/30 rounded p-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <span className="text-green-400 font-bold">
                              {formatTime(window.start)} - {formatTime(window.end)}
                            </span>
                            <span className="text-slate-400 text-sm ml-2">
                              ({formatDuration(window.start, window.end)})
                            </span>
                          </div>
                          <div className="text-sm text-slate-300">
                            UKC: {formatDepth(window.minClearance)} - {formatDepth(window.maxClearance)}
                          </div>
                          <div className="text-sm text-slate-400">
                            Max tide: {formatDepth(window.maxHeight)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-red-400 py-4">
                    No safe transit windows in the next 24 hours.
                    <div className="text-sm text-slate-400 mt-1">
                      Consider waiting for higher tides or using a different route.
                    </div>
                  </div>
                )}
              </div>

              {/* Upcoming extremes */}
              {analysis.extremes.length > 0 && (
                <div className="mt-4 bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">Upcoming Tide Extremes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {analysis.extremes.slice(0, 4).map((extreme, i) => (
                      <div key={i} className={`rounded p-2 text-center ${
                        extreme.type === 'high' ? 'bg-blue-900/30' : 'bg-orange-900/30'
                      }`}>
                        <div className={`text-xs ${
                          extreme.type === 'high' ? 'text-blue-400' : 'text-orange-400'
                        }`}>
                          {extreme.type === 'high' ? 'High' : 'Low'}
                        </div>
                        <div className="text-white font-medium">{formatDepth(extreme.height)}</div>
                        <div className="text-slate-400 text-xs">{formatTime(extreme.time)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded text-xs text-amber-400">
            <strong>Disclaimer:</strong> This is an educational tool only. Actual navigation decisions
            must account for weather, waves, vessel trim, bottom conditions, and official hydrographic
            data. Always consult current nautical charts and port authorities.
          </div>
        </div>
      </div>
    </div>
  );
}
