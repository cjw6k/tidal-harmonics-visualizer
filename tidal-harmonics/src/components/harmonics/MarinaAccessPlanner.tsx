import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';
import { format, addHours } from 'date-fns';

interface MarinaAccessPlannerProps {
  onClose: () => void;
}

interface AccessWindow {
  start: Date;
  end: Date;
  minDepth: number;
  maxDepth: number;
  duration: number; // minutes
}

export function MarinaAccessPlanner({ onClose }: MarinaAccessPlannerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Vessel and marina parameters
  const [vesselDraft, setVesselDraft] = useState(1.5); // meters
  const [marinaDepth, setMarinaDepth] = useState(2.0); // meters at chart datum
  const [safetyMargin, setSafetyMargin] = useState(0.5); // extra clearance
  const [channelDepth, setChannelDepth] = useState(1.5); // approach channel depth

  // Time range for planning
  const [hoursAhead, setHoursAhead] = useState(24);

  // Calculate required minimum water depth
  const requiredDepth = vesselDraft + safetyMargin;

  // Find access windows
  const accessData = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const end = addHours(now, hoursAhead);

    // Generate tide predictions every 10 minutes
    const series = predictTideSeries(selectedStation, now, end, 10);

    // Minimum controlling depth is the shallower of marina and channel
    const controllingDepth = Math.min(marinaDepth, channelDepth);

    // Find windows where we have access
    const windows: AccessWindow[] = [];
    let currentWindow: AccessWindow | null = null;

    for (const point of series) {
      const actualDepth = controllingDepth + point.height;
      const hasAccess = actualDepth >= requiredDepth;

      if (hasAccess) {
        if (!currentWindow) {
          // Start new window
          currentWindow = {
            start: point.time,
            end: point.time,
            minDepth: actualDepth,
            maxDepth: actualDepth,
            duration: 0,
          };
        } else {
          // Extend current window
          currentWindow.end = point.time;
          currentWindow.minDepth = Math.min(currentWindow.minDepth, actualDepth);
          currentWindow.maxDepth = Math.max(currentWindow.maxDepth, actualDepth);
          currentWindow.duration = (currentWindow.end.getTime() - currentWindow.start.getTime()) / 60000;
        }
      } else {
        if (currentWindow && currentWindow.duration >= 10) {
          // Close window if it was at least 10 minutes
          windows.push(currentWindow);
        }
        currentWindow = null;
      }
    }

    // Close final window
    if (currentWindow && currentWindow.duration >= 10) {
      windows.push(currentWindow);
    }

    // Get extremes for context
    const extremes = findExtremes(series);

    // Calculate current access status
    const currentTide = series[0]?.height || 0;
    const currentActualDepth = controllingDepth + currentTide;
    const currentHasAccess = currentActualDepth >= requiredDepth;

    return {
      windows,
      extremes,
      currentTide,
      currentActualDepth,
      currentHasAccess,
      controllingDepth,
    };
  }, [selectedStation, marinaDepth, channelDepth, requiredDepth, hoursAhead]);

  // Calculate time until next access or closure
  const timeStatus = useMemo(() => {
    if (!accessData) return null;

    const now = new Date();

    if (accessData.currentHasAccess) {
      // Find when current window closes
      const currentWindow = accessData.windows.find(
        (w) => w.start <= now && w.end >= now
      );
      if (currentWindow) {
        const minutesRemaining = (currentWindow.end.getTime() - now.getTime()) / 60000;
        return {
          status: 'open',
          minutes: Math.round(minutesRemaining),
          until: currentWindow.end,
        };
      }
    }

    // Not currently accessible, find next window
    const next = accessData.windows.find((w) => w.start > now);
    if (next) {
      const minutesUntil = (next.start.getTime() - now.getTime()) / 60000;
      return {
        status: 'closed',
        minutes: Math.round(minutesUntil),
        until: next.start,
      };
    }

    return { status: 'closed', minutes: null, until: null };
  }, [accessData]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!selectedStation || !accessData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🚤 Marina Access Planner
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
            accessData.currentHasAccess ? 'bg-green-900/40 border border-green-700' : 'bg-red-900/40 border border-red-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold ${accessData.currentHasAccess ? 'text-green-400' : 'text-red-400'}`}>
                {accessData.currentHasAccess ? '✓ ACCESS OPEN' : '✗ NO ACCESS'}
              </span>
              <span className="text-slate-300 text-sm">
                Current depth: {formatHeight(accessData.currentActualDepth, unitSystem)}
              </span>
            </div>

            {timeStatus && (
              <div className="text-sm">
                {timeStatus.status === 'open' && timeStatus.minutes !== null ? (
                  <span className="text-green-300">
                    Window closes in {formatDuration(timeStatus.minutes)} ({format(timeStatus.until!, 'HH:mm')})
                  </span>
                ) : timeStatus.status === 'closed' && timeStatus.minutes !== null ? (
                  <span className="text-amber-300">
                    Next window opens in {formatDuration(timeStatus.minutes)} ({format(timeStatus.until!, 'HH:mm')})
                  </span>
                ) : (
                  <span className="text-red-300">No access windows in planning period</span>
                )}
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Vessel & Marina</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Vessel Draft
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={vesselDraft}
                  onChange={(e) => setVesselDraft(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(vesselDraft, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Marina Depth (at chart datum)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={marinaDepth}
                  onChange={(e) => setMarinaDepth(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(marinaDepth, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Approach Channel Depth
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={channelDepth}
                  onChange={(e) => setChannelDepth(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{formatHeight(channelDepth, unitSystem)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Safety Margin
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
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

          {/* Requirements Summary */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Required depth:</span>
                <span className="text-white ml-1">{formatHeight(requiredDepth, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Controlling depth:</span>
                <span className="text-white ml-1">{formatHeight(accessData.controllingDepth, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Current tide:</span>
                <span className="text-cyan-400 ml-1">{formatHeight(accessData.currentTide, unitSystem)}</span>
              </div>
              <div>
                <span className="text-slate-400">Minimum tide needed:</span>
                <span className="text-amber-400 ml-1">
                  {formatHeight(requiredDepth - accessData.controllingDepth, unitSystem)}
                </span>
              </div>
            </div>
          </div>

          {/* Access Windows */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Access Windows ({accessData.windows.length} found)
            </h3>

            {accessData.windows.length === 0 ? (
              <div className="text-center text-red-400 py-4">
                No access windows in the next {hoursAhead} hours
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {accessData.windows.map((window, idx) => {
                  const isNow = window.start <= new Date() && window.end >= new Date();
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded ${
                        isNow ? 'bg-green-900/50 border border-green-700' : 'bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {isNow && <span className="text-green-400 text-xs">● NOW</span>}
                          <span className="text-white font-medium">
                            {format(window.start, 'HH:mm')} - {format(window.end, 'HH:mm')}
                          </span>
                        </div>
                        <span className="text-cyan-400 text-sm">
                          {formatDuration(window.duration)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {format(window.start, 'EEE, MMM d')} • Depth: {formatHeight(window.minDepth, unitSystem)} - {formatHeight(window.maxDepth, unitSystem)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tide Extremes Context */}
          {accessData.extremes.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <h4 className="text-xs text-slate-400 mb-2">Upcoming Tides</h4>
              <div className="flex flex-wrap gap-2">
                {accessData.extremes.slice(0, 6).map((extreme, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded text-xs ${
                      extreme.type === 'high' ? 'bg-green-900/50 text-green-300' : 'bg-amber-900/50 text-amber-300'
                    }`}
                  >
                    {extreme.type === 'high' ? '▲' : '▼'} {format(extreme.time, 'HH:mm')} ({formatHeight(extreme.height, unitSystem, { precision: 1 })})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Access requires both marina berth AND approach channel to have sufficient depth</p>
            <p>• The "controlling depth" is the shallower of marina or channel</p>
            <p>• Plan to arrive/depart mid-window for maximum safety margin</p>
            <p>• Weather conditions may affect actual water levels</p>
          </div>
        </div>
      </div>
    </div>
  );
}
