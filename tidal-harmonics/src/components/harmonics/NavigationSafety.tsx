import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface Props {
  onClose?: () => void;
}

interface SafeWindow {
  start: Date;
  end: Date;
  duration: number; // minutes
  minHeight: number;
  maxHeight: number;
}

export function NavigationSafety({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // User inputs
  const [vesselDraft, setVesselDraft] = useState(2.0); // meters
  const [safetyMargin, setSafetyMargin] = useState(0.5); // meters
  const [channelDepth, setChannelDepth] = useState(1.5); // meters below chart datum

  // Calculate required tide height
  const requiredHeight = vesselDraft + safetyMargin - channelDepth;

  // Find safe windows for navigation
  const safeWindows = useMemo(() => {
    if (!station) return [];

    const now = new Date();
    const windows: SafeWindow[] = [];
    let windowStart: Date | null = null;
    let windowMin = Infinity;
    let windowMax = -Infinity;

    // Scan next 48 hours in 10-minute increments
    for (let minutes = 0; minutes <= 48 * 60; minutes += 10) {
      const time = new Date(now.getTime() + minutes * 60 * 1000);
      const height = predictTide(station, time);

      if (height >= requiredHeight) {
        if (!windowStart) {
          windowStart = time;
          windowMin = height;
          windowMax = height;
        } else {
          windowMin = Math.min(windowMin, height);
          windowMax = Math.max(windowMax, height);
        }
      } else {
        if (windowStart) {
          // End of safe window
          const duration = (time.getTime() - windowStart.getTime()) / (60 * 1000);
          windows.push({
            start: windowStart,
            end: time,
            duration,
            minHeight: windowMin,
            maxHeight: windowMax,
          });
          windowStart = null;
          windowMin = Infinity;
          windowMax = -Infinity;
        }
      }
    }

    // Handle window that extends to end of search period
    if (windowStart) {
      const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const duration = (endTime.getTime() - windowStart.getTime()) / (60 * 1000);
      windows.push({
        start: windowStart,
        end: endTime,
        duration,
        minHeight: windowMin,
        maxHeight: windowMax,
      });
    }

    return windows;
  }, [station, requiredHeight]);

  // Current status
  const currentStatus = useMemo(() => {
    if (!station) return null;
    const now = new Date();
    const height = predictTide(station, now);
    const isSafe = height >= requiredHeight;
    const clearance = height - requiredHeight + channelDepth;

    return {
      height,
      isSafe,
      clearance,
    };
  }, [station, requiredHeight, channelDepth]);

  const formatHeight = (meters: number) => {
    if (unitSystem === 'imperial') {
      return `${(meters * 3.28084).toFixed(1)} ft`;
    }
    return `${meters.toFixed(2)} m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 border border-slate-700 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Navigation Safety</h3>
          <p className="text-slate-400 text-xs mt-1">
            Calculate safe passage windows based on tide and draft
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4">
        <p className="text-slate-300 text-xs leading-relaxed">
          Enter your vessel's draft and the channel depth below chart datum to find
          <span className="text-green-400"> safe navigation windows</span>. The tool calculates
          when tide height provides sufficient clearance.
        </p>
      </div>

      {/* Input controls */}
      <div className="space-y-3 mb-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 text-sm">Vessel Draft</label>
            <span className="text-cyan-400 font-mono text-sm">{formatHeight(vesselDraft)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={vesselDraft}
            onChange={(e) => setVesselDraft(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0.5m</span>
            <span>5m</span>
            <span>10m</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 text-sm">Channel Depth (below datum)</label>
            <span className="text-blue-400 font-mono text-sm">{formatHeight(channelDepth)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={channelDepth}
            onChange={(e) => setChannelDepth(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0m (dries)</span>
            <span>5m</span>
            <span>10m</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 text-sm">Safety Margin (under keel)</label>
            <span className="text-amber-400 font-mono text-sm">{formatHeight(safetyMargin)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={safetyMargin}
            onChange={(e) => setSafetyMargin(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0.1m (risky)</span>
            <span>1m (safe)</span>
            <span>2m (cautious)</span>
          </div>
        </div>
      </div>

      {/* Calculation display */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4">
        <h4 className="text-white text-sm font-medium mb-2">Clearance Calculation</h4>
        <div className="text-xs space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Vessel draft:</span>
            <span className="text-cyan-400">{formatHeight(vesselDraft)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">+ Safety margin:</span>
            <span className="text-amber-400">{formatHeight(safetyMargin)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">- Channel depth:</span>
            <span className="text-blue-400">{formatHeight(channelDepth)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="text-white font-medium">= Required tide:</span>
            <span className={requiredHeight > 0 ? 'text-green-400' : 'text-slate-400'}>
              {requiredHeight > 0 ? formatHeight(requiredHeight) : 'Always clear'}
            </span>
          </div>
        </div>
      </div>

      {/* Current status */}
      {currentStatus && station && (
        <div className={`rounded-lg p-4 mb-4 ${
          currentStatus.isSafe
            ? 'bg-green-900/30 border border-green-700'
            : 'bg-red-900/30 border border-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${currentStatus.isSafe ? 'text-green-400' : 'text-red-400'}`}>
                {currentStatus.isSafe ? '✓ SAFE TO TRANSIT' : '✗ INSUFFICIENT DEPTH'}
              </h4>
              <p className="text-slate-400 text-xs mt-1">
                Current at {station.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-mono text-lg">{formatHeight(currentStatus.height)}</p>
              <p className="text-xs text-slate-400">
                Clearance: <span className={currentStatus.isSafe ? 'text-green-400' : 'text-red-400'}>
                  {formatHeight(currentStatus.clearance)}
                </span>
              </p>
            </div>
          </div>

          {/* Visual clearance diagram */}
          <div className="mt-3 relative h-16 bg-slate-900 rounded overflow-hidden">
            {/* Water level */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-500/30"
              style={{ height: `${Math.min(100, Math.max(20, currentStatus.height * 15 + 40))}%` }}
            />
            {/* Channel bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-amber-800"
              style={{ height: `${Math.min(40, channelDepth * 5 + 10)}%` }}
            />
            {/* Vessel hull */}
            <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: '40%' }}>
              <div
                className={`w-20 h-6 rounded-b-lg ${currentStatus.isSafe ? 'bg-green-600' : 'bg-red-600'}`}
              />
              <div className="w-16 h-3 bg-slate-300 mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Safe windows */}
      <div className="bg-slate-800 rounded-lg p-3">
        <h4 className="text-white text-sm font-medium mb-3">
          Safe Transit Windows (Next 48h)
        </h4>

        {safeWindows.length === 0 ? (
          <p className="text-red-400 text-sm">
            No safe windows found. Consider reducing draft, safety margin, or choosing a deeper channel.
          </p>
        ) : (
          <div className="space-y-2">
            {safeWindows.slice(0, 8).map((window, index) => {
              const now = new Date();
              const isActive = now >= window.start && now <= window.end;
              const isUpcoming = now < window.start;
              const timeUntil = isUpcoming
                ? Math.round((window.start.getTime() - now.getTime()) / (60 * 1000))
                : 0;

              return (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    isActive
                      ? 'bg-green-900/40 border border-green-600'
                      : 'bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white text-sm">
                        {formatTime(window.start)} - {formatTime(window.end)}
                      </span>
                      {formatDate(window.start) !== formatDate(now) && (
                        <span className="text-slate-400 text-xs ml-2">
                          ({formatDate(window.start)})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs ${isActive ? 'text-green-400' : 'text-slate-400'}`}>
                        {formatDuration(window.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-400">
                      Tide: {formatHeight(window.minHeight)} - {formatHeight(window.maxHeight)}
                    </span>
                    {isActive && (
                      <span className="text-green-400 font-medium">NOW SAFE</span>
                    )}
                    {isUpcoming && index === 0 && (
                      <span className="text-cyan-400">in {formatDuration(timeUntil)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="mt-4 bg-gradient-to-r from-amber-900/30 to-red-900/30 rounded-lg p-3 border border-amber-800/30">
        <p className="text-amber-200 text-xs leading-relaxed">
          <span className="font-semibold">⚠️ Important:</span> This tool provides estimates based on
          predicted astronomical tides only. Actual water levels can vary due to weather, barometric
          pressure, and local conditions. Always verify with official sources and use prudent
          seamanship. Consult local tide tables and harbor authorities for actual navigation decisions.
        </p>
      </div>
    </div>
  );
}
