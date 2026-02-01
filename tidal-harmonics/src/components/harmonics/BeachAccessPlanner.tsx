import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface AccessWindow {
  start: Date;
  end: Date;
  duration: number; // minutes
  minHeight: number;
  maxHeight: number;
}

interface AccessPoint {
  name: string;
  maxTideHeight: number; // meters - beach accessible below this
  description: string;
  icon: string;
}

// Preset access types (heights in meters)
const ACCESS_PRESETS: AccessPoint[] = [
  {
    name: 'Full Beach',
    maxTideHeight: 0.5,
    description: 'Maximum sand exposed, tidepools accessible',
    icon: '🏖️',
  },
  {
    name: 'Beach Walking',
    maxTideHeight: 1.2,
    description: 'Safe walking along the beach',
    icon: '🚶',
  },
  {
    name: 'Coastal Path',
    maxTideHeight: 1.8,
    description: 'Coastal trail passable at normal tides',
    icon: '🛤️',
  },
  {
    name: 'Boat Launch',
    maxTideHeight: 0.8,
    description: 'Sufficient water for launching small boats',
    icon: '🚣',
  },
];

interface Props {
  onClose: () => void;
}

export function BeachAccessPlanner({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customThreshold, setCustomThreshold] = useState(1.5);
  const [useCustom, setUseCustom] = useState(false);
  const [lookAheadDays, setLookAheadDays] = useState(2);

  const useMetric = unitSystem === 'metric';

  const activeThreshold = useCustom
    ? customThreshold
    : (ACCESS_PRESETS[selectedPreset]?.maxTideHeight ?? 1.5);

  // Find access windows
  const accessWindows = useMemo((): AccessWindow[] => {
    if (!station) return [];

    const windows: AccessWindow[] = [];
    const now = new Date();
    const end = new Date(now.getTime() + lookAheadDays * 24 * 60 * 60 * 1000);

    // Sample at 10-minute intervals
    const intervalMs = 10 * 60 * 1000;
    let windowStart: Date | null = null;
    let windowMinHeight = Infinity;
    let windowMaxHeight = -Infinity;

    for (let t = now.getTime(); t <= end.getTime(); t += intervalMs) {
      const time = new Date(t);
      const height = predictTide(station, time);
      const isAccessible = height < activeThreshold;

      if (isAccessible) {
        if (!windowStart) {
          windowStart = time;
          windowMinHeight = height;
          windowMaxHeight = height;
        } else {
          windowMinHeight = Math.min(windowMinHeight, height);
          windowMaxHeight = Math.max(windowMaxHeight, height);
        }
      } else if (windowStart) {
        // Window ended
        const duration = (t - windowStart.getTime()) / 60000;
        if (duration >= 30) {
          // Only show windows >= 30 minutes
          windows.push({
            start: windowStart,
            end: time,
            duration,
            minHeight: windowMinHeight,
            maxHeight: windowMaxHeight,
          });
        }
        windowStart = null;
        windowMinHeight = Infinity;
        windowMaxHeight = -Infinity;
      }
    }

    // Handle window that extends to end
    if (windowStart) {
      const duration = (end.getTime() - windowStart.getTime()) / 60000;
      if (duration >= 30) {
        windows.push({
          start: windowStart,
          end,
          duration,
          minHeight: windowMinHeight,
          maxHeight: windowMaxHeight,
        });
      }
    }

    return windows;
  }, [station, activeThreshold, lookAheadDays]);

  // Current status
  const currentStatus = useMemo(() => {
    if (!station) return null;
    const height = predictTide(station, new Date());
    const isAccessible = height < activeThreshold;
    const margin = activeThreshold - height;

    return {
      isAccessible,
      height,
      margin,
    };
  }, [station, activeThreshold]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatHeight = (meters: number) => {
    if (useMetric) {
      return `${meters.toFixed(2)} m`;
    }
    return `${(meters * 3.28084).toFixed(2)} ft`;
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) return 'now';

    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (hours === 0) return `in ${mins}m`;
    return `in ${hours}h ${mins}m`;
  };

  // Group windows by day
  const windowsByDay = useMemo(() => {
    const groups: Map<string, AccessWindow[]> = new Map();

    for (const window of accessWindows) {
      const dateKey = window.start.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(window);
    }

    return Array.from(groups.entries());
  }, [accessWindows]);

  if (!station) return null;

  const activePreset = ACCESS_PRESETS[selectedPreset];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Beach Access Planner</h2>
            <p className="text-sm text-slate-400">Find safe access windows</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Access Type Selection */}
          <div>
            <div className="text-sm text-slate-400 mb-2">Access Type</div>
            <div className="grid grid-cols-2 gap-2">
              {ACCESS_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSelectedPreset(idx);
                    setUseCustom(false);
                  }}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedPreset === idx && !useCustom
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="font-medium text-sm">{preset.name}</span>
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Below {formatHeight(preset.maxTideHeight)}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom threshold */}
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="rounded border-slate-500"
                />
                <span className="text-sm text-slate-300">Custom threshold</span>
              </label>
              {useCustom && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.1}
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white font-mono w-20 text-right">
                    {formatHeight(customThreshold)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current Status */}
          {currentStatus && (
            <div
              className={`rounded-lg p-4 ${
                currentStatus.isAccessible
                  ? 'bg-green-900/40 border border-green-700'
                  : 'bg-red-900/40 border border-red-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-300">Current Status</div>
                  <div className={`text-xl font-bold ${
                    currentStatus.isAccessible ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentStatus.isAccessible ? 'Accessible' : 'Not Accessible'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Water Level</div>
                  <div className="text-white font-mono">
                    {formatHeight(currentStatus.height)}
                  </div>
                </div>
              </div>
              {currentStatus.isAccessible && (
                <div className="mt-2 text-sm text-green-300">
                  {formatHeight(Math.abs(currentStatus.margin))} below threshold
                </div>
              )}
            </div>
          )}

          {/* Look ahead selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Show next</span>
            <select
              value={lookAheadDays}
              onChange={(e) => setLookAheadDays(Number(e.target.value))}
              className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
            >
              <option value={1}>24 hours</option>
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
              <option value={7}>1 week</option>
            </select>
          </div>

          {/* Access Windows */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-300">
              Access Windows
              {!useCustom && activePreset && (
                <span className="text-slate-500 ml-2">
                  ({activePreset.description})
                </span>
              )}
            </div>

            {windowsByDay.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No access windows in the selected period</p>
                <p className="text-sm mt-1">Try a higher tide threshold or longer period</p>
              </div>
            ) : (
              windowsByDay.map(([dateKey, windows]) => {
                const firstWindow = windows[0];
                if (!firstWindow) return null;
                return (
                  <div key={dateKey}>
                    <div className="text-sm font-medium text-slate-400 mb-2">
                      {formatDate(firstWindow.start)}
                    </div>
                    <div className="space-y-2">
                      {windows.map((window, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-3"
                        >
                          <div>
                            <div className="text-white font-medium">
                              {formatTime(window.start)} - {formatTime(window.end)}
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatTimeUntil(window.start)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-medium">
                              {formatDuration(window.duration)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatHeight(window.minHeight)} - {formatHeight(window.maxHeight)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Safety Note */}
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-400 mb-1">Safety Note</p>
            <p className="text-slate-300">
              These are predictions based on astronomical tides. Actual water levels may vary
              due to weather, waves, and surge. Always check local conditions and never turn
              your back on the ocean.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
