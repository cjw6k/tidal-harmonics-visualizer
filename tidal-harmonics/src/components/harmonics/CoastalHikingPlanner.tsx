import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface CoastalHikingPlannerProps {
  onClose: () => void;
}

interface CrossingWindow {
  startTime: Date;
  endTime: Date;
  duration: number;
  minTide: number;
  safety: 'safe' | 'caution' | 'dangerous';
}

interface HikeSlot {
  date: Date;
  departureTime: Date;
  windows: CrossingWindow[];
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
}

// Common hike types with tide requirements
const HIKE_TYPES = [
  {
    name: 'Beach Walk',
    icon: '🏖️',
    maxTide: 2.0,
    description: 'Beach accessible at moderate to low tide',
  },
  {
    name: 'Headland Crossing',
    icon: '🪨',
    maxTide: 0.8,
    description: 'Rock scramble passable only at low tide',
  },
  {
    name: 'Tidal Causeway',
    icon: '🌊',
    maxTide: 0.5,
    description: 'Land bridge exposed at very low tide',
  },
  {
    name: 'Cliff Base Path',
    icon: '⛰️',
    maxTide: 1.2,
    description: 'Path along cliff base, needs low-mid tide',
  },
  {
    name: 'Estuary Ford',
    icon: '🦀',
    maxTide: 0.6,
    description: 'River/creek crossing at low tide',
  },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function CoastalHikingPlanner({ onClose }: CoastalHikingPlannerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [daysAhead, setDaysAhead] = useState(7);
  const [selectedHikeType, setSelectedHikeType] = useState(HIKE_TYPES[0]!);
  const [customMaxTide, setCustomMaxTide] = useState<number | null>(null);
  const [hikeDuration, setHikeDuration] = useState(3); // hours
  const [returnTrip, setReturnTrip] = useState(true);

  const hikeSlots = useMemo(() => {
    if (!selectedStation) return [];

    const maxTide = customMaxTide ?? selectedHikeType.maxTide;
    const slots: HikeSlot[] = [];
    const now = new Date();

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      date.setHours(0, 0, 0, 0);

      // Check each hour from 5am to 5pm as potential departure times
      for (let hour = 5; hour <= 17; hour++) {
        const departureTime = new Date(date);
        departureTime.setHours(hour, 0, 0, 0);

        if (departureTime < now) continue;

        // Find crossing windows within the hike duration
        const windows: CrossingWindow[] = [];
        const searchInterval = 10 * 60000; // 10 minutes
        const hikeEnd = new Date(departureTime.getTime() + hikeDuration * 3600000);

        let inWindow = false;
        let windowStart: Date | null = null;
        let windowMinTide = Infinity;

        for (let t = departureTime.getTime(); t <= hikeEnd.getTime(); t += searchInterval) {
          const time = new Date(t);
          const tide = predictTide(selectedStation, time);

          if (tide <= maxTide) {
            if (!inWindow) {
              inWindow = true;
              windowStart = time;
              windowMinTide = tide;
            } else {
              windowMinTide = Math.min(windowMinTide, tide);
            }
          } else if (inWindow && windowStart) {
            windows.push({
              startTime: windowStart,
              endTime: time,
              duration: (t - windowStart.getTime()) / 60000,
              minTide: windowMinTide,
              safety: windowMinTide < maxTide - 0.5 ? 'safe' : windowMinTide < maxTide - 0.2 ? 'caution' : 'dangerous',
            });
            inWindow = false;
            windowStart = null;
            windowMinTide = Infinity;
          }
        }

        // Close any open window at hike end
        if (inWindow && windowStart) {
          windows.push({
            startTime: windowStart,
            endTime: hikeEnd,
            duration: (hikeEnd.getTime() - windowStart.getTime()) / 60000,
            minTide: windowMinTide,
            safety: windowMinTide < maxTide - 0.5 ? 'safe' : windowMinTide < maxTide - 0.2 ? 'caution' : 'dangerous',
          });
        }

        // If return trip needed, check there's a window at start AND end of hike
        const hasOutbound = windows.some(w =>
          w.startTime.getTime() <= departureTime.getTime() + 30 * 60000
        );
        const hasReturn = windows.some(w =>
          w.endTime.getTime() >= hikeEnd.getTime() - 30 * 60000
        );

        // Determine quality
        let quality: 'excellent' | 'good' | 'fair' | 'poor';
        let recommendation: string;

        const totalWindowTime = windows.reduce((sum, w) => sum + w.duration, 0);
        const safestWindow = windows.length > 0
          ? windows.reduce((a, b) => a.minTide < b.minTide ? a : b)
          : null;

        if (returnTrip) {
          if (hasOutbound && hasReturn && totalWindowTime >= hikeDuration * 60) {
            quality = 'excellent';
            recommendation = 'Full crossing window available for out and back';
          } else if (hasOutbound && hasReturn) {
            quality = 'good';
            recommendation = 'Windows available but timing is tight';
          } else if (hasOutbound || hasReturn) {
            quality = 'fair';
            recommendation = hasOutbound ? 'Outbound OK, return may be cut off' : 'Outbound risky, return window OK';
          } else {
            quality = 'poor';
            recommendation = 'No safe crossing windows during this hike';
          }
        } else {
          if (windows.length > 0 && totalWindowTime >= hikeDuration * 60 * 0.5) {
            quality = 'excellent';
            recommendation = 'Good crossing conditions throughout';
          } else if (windows.length > 0) {
            quality = 'good';
            recommendation = `Crossing window: ${safestWindow ? formatTime(safestWindow.startTime) + '-' + formatTime(safestWindow.endTime) : 'limited'}`;
          } else {
            quality = 'poor';
            recommendation = 'Tide too high for safe passage';
          }
        }

        // Only include slots with at least fair quality
        if (quality !== 'poor') {
          slots.push({
            date: departureTime,
            departureTime,
            windows,
            quality,
            recommendation,
          });
        }
      }
    }

    // Sort by quality then date
    const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
    return slots.sort((a, b) =>
      qualityOrder[a.quality] - qualityOrder[b.quality] ||
      a.departureTime.getTime() - b.departureTime.getTime()
    );
  }, [selectedStation, daysAhead, selectedHikeType, customMaxTide, hikeDuration, returnTrip]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  const qualityColors = {
    excellent: 'bg-green-900/40 border-green-500/50',
    good: 'bg-blue-900/40 border-blue-500/50',
    fair: 'bg-yellow-900/40 border-yellow-500/50',
    poor: 'bg-red-900/40 border-red-500/50',
  };

  const safetyColors = {
    safe: 'text-green-400',
    caution: 'text-yellow-400',
    dangerous: 'text-red-400',
  };

  if (!selectedStation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to plan coastal hikes</p>
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
            <h3 className="text-lg font-semibold text-orange-400">🥾 Coastal Hiking Planner</h3>
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
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-red-300 font-medium">⚠️ Coastal Safety Warning</p>
          <p className="text-slate-300 text-xs mt-1">
            Tidal crossings can be extremely dangerous. Rising tides can trap
            hikers against cliffs. Always check conditions, tell someone your plans,
            and never attempt crossings in poor visibility or weather.
          </p>
        </div>

        {/* Hike Type Selection */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 block mb-2">Crossing Type</label>
          <div className="flex flex-wrap gap-2">
            {HIKE_TYPES.map((type) => (
              <button
                key={type.name}
                onClick={() => {
                  setSelectedHikeType(type);
                  setCustomMaxTide(null);
                }}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedHikeType.name === type.name
                    ? 'bg-orange-900/40 border-orange-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">{selectedHikeType.description}</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Hike Duration</label>
            <select
              value={hikeDuration}
              onChange={(e) => setHikeDuration(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
              <option value={5}>5 hours</option>
              <option value={6}>6 hours</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Days Ahead</label>
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              <option value={3}>3 Days</option>
              <option value={7}>1 Week</option>
              <option value={14}>2 Weeks</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max Tide (m)</label>
            <input
              type="number"
              value={customMaxTide ?? selectedHikeType.maxTide}
              onChange={(e) => setCustomMaxTide(parseFloat(e.target.value))}
              step={0.1}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={returnTrip}
            onChange={(e) => setReturnTrip(e.target.checked)}
            className="rounded bg-slate-700 border-slate-600"
          />
          🔄 Return trip (need crossing at start and end)
        </label>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {hikeSlots.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>No safe hiking windows found.</p>
              <p className="text-sm mt-2">Try adjusting the maximum tide height or time range.</p>
            </div>
          ) : (
            hikeSlots.slice(0, 20).map((slot, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${qualityColors[slot.quality]}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-slate-200">
                      {formatDate(slot.date)}
                    </span>
                    <span className="text-slate-400 ml-2">
                      Depart {formatTime(slot.departureTime)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase ${
                    slot.quality === 'excellent' ? 'bg-green-600' :
                    slot.quality === 'good' ? 'bg-blue-600' :
                    slot.quality === 'fair' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {slot.quality}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mb-2">{slot.recommendation}</p>

                {slot.windows.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {slot.windows.slice(0, 3).map((w, j) => (
                      <div
                        key={j}
                        className={`text-xs px-2 py-1 rounded bg-slate-800 ${safetyColors[w.safety]}`}
                      >
                        {formatTime(w.startTime)}-{formatTime(w.endTime)}
                        <span className="text-slate-500 ml-1">
                          ({formatHeight(w.minTide)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">🥾 Safety Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Start crossings 1-2 hours before predicted low tide</li>
            <li>• Never turn back on a rising tide - go to high ground</li>
            <li>• Carry a phone, whistle, and tell someone your route</li>
            <li>• Check weather - waves and wind affect safety</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
