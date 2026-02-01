import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface ShellfishHarvestPlannerProps {
  onClose: () => void;
}

interface HarvestWindow {
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  minTide: number;
  quality: 'excellent' | 'good' | 'fair';
  daylight: boolean;
}

interface ShellfishType {
  name: string;
  minExposure: number;
  icon: string;
  description: string;
}

// Common shellfish types and their typical harvest elevations
const SHELLFISH_TYPES: ShellfishType[] = [
  { name: 'Oysters', minExposure: 0.3, icon: '🦪', description: 'Usually on rocks at mid-tide level' },
  { name: 'Clams', minExposure: 0.0, icon: '🐚', description: 'Sandy/muddy substrate at low tide' },
  { name: 'Mussels', minExposure: 0.5, icon: '🦐', description: 'Rocks and pilings, exposed at mid-low tide' },
  { name: 'Cockles', minExposure: -0.2, icon: '🐚', description: 'Sandy beaches, need very low tides' },
  { name: 'Razor Clams', minExposure: -0.3, icon: '🔪', description: 'Low sandy beaches, need extreme lows' },
  { name: 'Geoduck', minExposure: -0.5, icon: '💎', description: 'Deep in sand, need extremely low tides' },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function isDaytime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 6 && hour < 20; // Approximate daylight hours
}

export function ShellfishHarvestPlanner({ onClose }: ShellfishHarvestPlannerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [daysAhead, setDaysAhead] = useState(14);
  const [selectedShellfish, setSelectedShellfish] = useState<ShellfishType>(SHELLFISH_TYPES[0]!);
  const [customThreshold, setCustomThreshold] = useState<number | null>(null);
  const [daytimeOnly, setDaytimeOnly] = useState(true);

  const harvestWindows = useMemo(() => {
    if (!selectedStation) return [];

    const threshold = customThreshold ?? selectedShellfish.minExposure;
    const windows: HarvestWindow[] = [];
    const now = new Date();
    const searchInterval = 10 * 60000; // 10 minutes
    const endTime = new Date(now.getTime() + daysAhead * 24 * 3600000);

    let inWindow = false;
    let windowStart: Date | null = null;
    let windowMinTide = Infinity;

    for (let time = now.getTime(); time < endTime.getTime(); time += searchInterval) {
      const currentTime = new Date(time);
      const tideHeight = predictTide(selectedStation, currentTime);

      if (tideHeight <= threshold) {
        if (!inWindow) {
          inWindow = true;
          windowStart = currentTime;
          windowMinTide = tideHeight;
        } else {
          windowMinTide = Math.min(windowMinTide, tideHeight);
        }
      } else if (inWindow && windowStart) {
        // Window ended
        const duration = (time - windowStart.getTime()) / 60000;

        // Only include windows that are at least 30 minutes
        if (duration >= 30) {
          const midpoint = new Date(windowStart.getTime() + duration * 30000);
          const daylight = isDaytime(midpoint);

          if (!daytimeOnly || daylight) {
            let quality: 'excellent' | 'good' | 'fair';
            if (duration >= 120 && windowMinTide <= threshold - 0.3) {
              quality = 'excellent';
            } else if (duration >= 60) {
              quality = 'good';
            } else {
              quality = 'fair';
            }

            windows.push({
              date: windowStart,
              startTime: windowStart,
              endTime: new Date(time),
              duration,
              minTide: windowMinTide,
              quality,
              daylight,
            });
          }
        }

        inWindow = false;
        windowStart = null;
        windowMinTide = Infinity;
      }
    }

    return windows;
  }, [selectedStation, daysAhead, selectedShellfish, customThreshold, daytimeOnly]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const qualityColors = {
    excellent: 'bg-green-900/40 border-green-500/50',
    good: 'bg-blue-900/40 border-blue-500/50',
    fair: 'bg-yellow-900/40 border-yellow-500/50',
  };

  if (!selectedStation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to plan harvest times</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-emerald-400">🦪 Shellfish Harvest Planner</h3>
            <p className="text-slate-400 text-sm">{selectedStation.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Safety Notice */}
        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-amber-300 font-medium">⚠️ Important Safety Notice</p>
          <p className="text-slate-300 text-xs mt-1">
            Always check local regulations, red tide alerts, and harvest closures before
            collecting shellfish. Verify safe areas with local authorities.
          </p>
        </div>

        {/* Shellfish Type Selection */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 block mb-2">Target Species</label>
          <div className="grid grid-cols-3 gap-2">
            {SHELLFISH_TYPES.map((type) => (
              <button
                key={type.name}
                onClick={() => {
                  setSelectedShellfish(type);
                  setCustomThreshold(null);
                }}
                className={`p-2 rounded-lg border text-center transition-colors ${
                  selectedShellfish.name === type.name
                    ? 'bg-emerald-900/40 border-emerald-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-2xl">{type.icon}</div>
                <div className="text-xs text-slate-300">{type.name}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">{selectedShellfish.description}</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Days Ahead</label>
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              <option value={7}>1 Week</option>
              <option value={14}>2 Weeks</option>
              <option value={30}>1 Month</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Exposure Level ({unitSystem === 'metric' ? 'm' : 'ft'})
            </label>
            <input
              type="number"
              value={customThreshold ?? selectedShellfish.minExposure}
              onChange={(e) => setCustomThreshold(parseFloat(e.target.value))}
              step={0.1}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={daytimeOnly}
            onChange={(e) => setDaytimeOnly(e.target.checked)}
            className="rounded bg-slate-700 border-slate-600"
          />
          ☀️ Daylight hours only
        </label>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {harvestWindows.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>No suitable harvest windows found.</p>
              <p className="text-sm mt-2">Try adjusting the exposure level or time range.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {harvestWindows.slice(0, 30).map((window, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 border ${qualityColors[window.quality]}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-slate-200">
                      {window.daylight ? '☀️' : '🌙'} {formatDate(window.date)}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs uppercase ${
                      window.quality === 'excellent' ? 'bg-green-600' :
                      window.quality === 'good' ? 'bg-blue-600' : 'bg-yellow-600'
                    }`}>
                      {window.quality}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Window</div>
                      <div className="text-slate-200">
                        {formatTime(window.startTime)} - {formatTime(window.endTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Duration</div>
                      <div className="text-slate-200">{formatDuration(window.duration)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Low Point</div>
                      <div className="text-slate-200">{formatHeight(window.minTide)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">🦪 Harvesting Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Arrive 30 min before low tide to maximize collection time</li>
            <li>• Wear appropriate footwear for slippery rocks/mud</li>
            <li>• Keep shellfish cool and refrigerate within 4 hours</li>
            <li>• Check bag limits and minimum size regulations</li>
            <li>• Never collect from polluted areas or closed beaches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
