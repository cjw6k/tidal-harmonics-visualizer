import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';
import { format, addHours } from 'date-fns';

interface BridgeClearanceCalculatorProps {
  onClose: () => void;
}

interface ClearanceWindow {
  start: Date;
  end: Date;
  minClearance: number;
  maxClearance: number;
  duration: number; // minutes
}

export function BridgeClearanceCalculator({ onClose }: BridgeClearanceCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Bridge and vessel parameters
  const [bridgeHeight, setBridgeHeight] = useState(20); // meters above chart datum
  const [vesselAirDraft, setVesselAirDraft] = useState(15); // height above waterline
  const [safetyMargin, setSafetyMargin] = useState(1.0); // extra clearance needed

  // Time range
  const [hoursAhead, setHoursAhead] = useState(24);

  // Required clearance
  const requiredClearance = vesselAirDraft + safetyMargin;

  // Calculate clearance windows
  const clearanceData = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const end = addHours(now, hoursAhead);

    // Generate tide predictions
    const series = predictTideSeries(selectedStation, now, end, 10);

    // Find windows where we can pass
    const windows: ClearanceWindow[] = [];
    let currentWindow: ClearanceWindow | null = null;

    for (const point of series) {
      // Actual clearance = Bridge height - Tide height
      // Higher tide = less clearance
      const actualClearance = bridgeHeight - point.height;
      const canPass = actualClearance >= requiredClearance;

      if (canPass) {
        if (!currentWindow) {
          currentWindow = {
            start: point.time,
            end: point.time,
            minClearance: actualClearance,
            maxClearance: actualClearance,
            duration: 0,
          };
        } else {
          currentWindow.end = point.time;
          currentWindow.minClearance = Math.min(currentWindow.minClearance, actualClearance);
          currentWindow.maxClearance = Math.max(currentWindow.maxClearance, actualClearance);
          currentWindow.duration = (currentWindow.end.getTime() - currentWindow.start.getTime()) / 60000;
        }
      } else {
        if (currentWindow && currentWindow.duration >= 10) {
          windows.push(currentWindow);
        }
        currentWindow = null;
      }
    }

    if (currentWindow && currentWindow.duration >= 10) {
      windows.push(currentWindow);
    }

    // Get extremes
    const extremes = findExtremes(series);

    // Current status
    const currentTide = series[0]?.height || 0;
    const currentClearance = bridgeHeight - currentTide;
    const currentCanPass = currentClearance >= requiredClearance;

    // Find best window (maximum clearance)
    const bestWindow = windows.length > 0
      ? windows.reduce((best, w) => w.maxClearance > best.maxClearance ? w : best)
      : null;

    return {
      windows,
      extremes,
      currentTide,
      currentClearance,
      currentCanPass,
      bestWindow,
    };
  }, [selectedStation, bridgeHeight, requiredClearance, hoursAhead]);

  // Time status
  const timeStatus = useMemo(() => {
    if (!clearanceData) return null;

    const now = new Date();

    if (clearanceData.currentCanPass) {
      const currentWindow = clearanceData.windows.find(
        (w) => w.start <= now && w.end >= now
      );
      if (currentWindow) {
        const minutesRemaining = (currentWindow.end.getTime() - now.getTime()) / 60000;
        return {
          status: 'clear',
          minutes: Math.round(minutesRemaining),
          until: currentWindow.end,
        };
      }
    }

    const next = clearanceData.windows.find((w) => w.start > now);
    if (next) {
      const minutesUntil = (next.start.getTime() - now.getTime()) / 60000;
      return {
        status: 'blocked',
        minutes: Math.round(minutesUntil),
        until: next.start,
      };
    }

    return { status: 'blocked', minutes: null, until: null };
  }, [clearanceData]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Clearance assessment color
  const getClearanceColor = (clearance: number) => {
    const margin = clearance - vesselAirDraft;
    if (margin >= 3) return 'text-green-400';
    if (margin >= 1.5) return 'text-lime-400';
    if (margin >= 0.5) return 'text-yellow-400';
    if (margin >= 0) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!selectedStation || !clearanceData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🌉 Bridge Clearance Calculator
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
          {/* Current Status */}
          <div className={`rounded-lg p-4 ${
            clearanceData.currentCanPass ? 'bg-green-900/40 border border-green-700' : 'bg-red-900/40 border border-red-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold ${clearanceData.currentCanPass ? 'text-green-400' : 'text-red-400'}`}>
                {clearanceData.currentCanPass ? '✓ PASSAGE CLEAR' : '✗ CANNOT PASS'}
              </span>
              <span className={`text-sm ${getClearanceColor(clearanceData.currentClearance)}`}>
                Clearance: {formatHeight(clearanceData.currentClearance, unitSystem)}
              </span>
            </div>

            {timeStatus && (
              <div className="text-sm">
                {timeStatus.status === 'clear' && timeStatus.minutes !== null ? (
                  <span className="text-green-300">
                    Window closes in {formatDuration(timeStatus.minutes)} ({format(timeStatus.until!, 'HH:mm')})
                  </span>
                ) : timeStatus.status === 'blocked' && timeStatus.minutes !== null ? (
                  <span className="text-amber-300">
                    Next window in {formatDuration(timeStatus.minutes)} ({format(timeStatus.until!, 'HH:mm')})
                  </span>
                ) : (
                  <span className="text-red-300">No passage windows in planning period</span>
                )}
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Bridge & Vessel</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Bridge Height (above chart datum)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="0.5"
                  value={bridgeHeight}
                  onChange={(e) => setBridgeHeight(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(bridgeHeight, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Vessel Air Draft (mast height above waterline)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="0.5"
                  value={vesselAirDraft}
                  onChange={(e) => setVesselAirDraft(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(vesselAirDraft, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Safety Margin
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(safetyMargin, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Planning Window
              </label>
              <div className="flex gap-2">
                {[12, 24, 48].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setHoursAhead(hours)}
                    className={`flex-1 px-3 py-2 rounded text-sm ${
                      hoursAhead === hours
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Required clearance:</span>
                <span className="text-white ml-1">{formatHeight(requiredClearance, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Current tide:</span>
                <span className="text-cyan-400 ml-1">{formatHeight(clearanceData.currentTide, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Current clearance:</span>
                <span className={`ml-1 ${getClearanceColor(clearanceData.currentClearance)}`}>
                  {formatHeight(clearanceData.currentClearance, unitSystem)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Max tide for passage:</span>
                <span className="text-amber-400 ml-1">
                  {formatHeight(bridgeHeight - requiredClearance, unitSystem)}
                </span>
              </div>
            </div>
          </div>

          {/* Diagram */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <svg viewBox="0 0 300 100" className="w-full h-24">
              {/* Water */}
              <rect x="0" y="70" width="300" height="30" fill="#0ea5e9" opacity="0.3" />
              <line x1="0" y1="70" x2="300" y2="70" stroke="#38bdf8" strokeWidth="2" />

              {/* Bridge */}
              <rect x="100" y="20" width="100" height="8" fill="#94a3b8" />
              <rect x="90" y="20" width="10" height="50" fill="#64748b" />
              <rect x="200" y="20" width="10" height="50" fill="#64748b" />

              {/* Boat silhouette */}
              <path d="M40 70 L60 70 L65 80 L35 80 Z" fill="#3b82f6" />
              <line x1="50" y1="70" x2="50" y2="45" stroke="#94a3b8" strokeWidth="2" />

              {/* Clearance indicator */}
              <line x1="150" y1="28" x2="150" y2="70" stroke="#fbbf24" strokeDasharray="4,2" />
              <text x="160" y="50" fill="#fbbf24" fontSize="8">Clearance</text>

              {/* Labels */}
              <text x="150" y="15" fill="#94a3b8" fontSize="8" textAnchor="middle">Bridge</text>
              <text x="50" y="90" fill="#94a3b8" fontSize="8" textAnchor="middle">Vessel</text>

              {/* Tide level indicator */}
              <path d="M280 70 L290 65 L280 60" fill="none" stroke="#38bdf8" strokeWidth="1" />
              <text x="270" y="58" fill="#38bdf8" fontSize="7" textAnchor="end">Tide</text>
            </svg>
          </div>

          {/* Passage Windows */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Passage Windows ({clearanceData.windows.length} found)
            </h3>

            {clearanceData.windows.length === 0 ? (
              <div className="text-center text-red-400 py-4">
                No passage windows in the next {hoursAhead} hours
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {clearanceData.windows.map((window, idx) => {
                  const isNow = window.start <= new Date() && window.end >= new Date();
                  const isBest = clearanceData.bestWindow === window;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded ${
                        isNow ? 'bg-green-900/50 border border-green-700' :
                        isBest ? 'bg-blue-900/50 border border-blue-700' : 'bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {isNow && <span className="text-green-400 text-xs">● NOW</span>}
                          {isBest && !isNow && <span className="text-blue-400 text-xs">★ BEST</span>}
                          <span className="text-white font-medium">
                            {format(window.start, 'HH:mm')} - {format(window.end, 'HH:mm')}
                          </span>
                        </div>
                        <span className="text-cyan-400 text-sm">
                          {formatDuration(window.duration)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {format(window.start, 'EEE, MMM d')} •
                        Clearance: {formatHeight(window.minClearance, unitSystem, { precision: 1 })} - {formatHeight(window.maxClearance, unitSystem, { precision: 1 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Bridge heights are typically referenced to Mean High Water Springs (MHWS)</p>
            <p>• Measure air draft from waterline to highest point (masthead, antenna, etc.)</p>
            <p>• Allow extra margin for wave action and vessel motion</p>
            <p>• Best passage is at low tide when clearance is maximum</p>
          </div>
        </div>
      </div>
    </div>
  );
}
