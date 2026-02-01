import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface SurfConditionsCalculatorProps {
  onClose: () => void;
}

interface SurfWindow {
  date: Date;
  startTime: Date;
  endTime: Date;
  avgTide: number;
  tideState: 'rising' | 'falling' | 'high' | 'low';
  quality: 'firing' | 'good' | 'fair' | 'poor';
  reason: string;
}

// Different break types have different tide preferences
const BREAK_TYPES = [
  {
    name: 'Beach Break',
    icon: '🏖️',
    bestTide: 'mid',
    minTide: 0.5,
    maxTide: 3.0,
    description: 'Sandy bottom, works best mid-tide (not too shallow, not too deep)',
  },
  {
    name: 'Point Break',
    icon: '🏄',
    bestTide: 'mid-low',
    minTide: 0.3,
    maxTide: 2.5,
    description: 'Rocky point, often better on incoming/mid tide',
  },
  {
    name: 'Reef Break',
    icon: '🪸',
    bestTide: 'mid-high',
    minTide: 1.0,
    maxTide: 3.5,
    description: 'Coral/rock reef, needs enough water for safety',
  },
  {
    name: 'River Mouth',
    icon: '🌊',
    bestTide: 'outgoing',
    minTide: 0.5,
    maxTide: 2.5,
    description: 'Where river meets ocean, outgoing tide creates better shape',
  },
  {
    name: 'Slab/Ledge',
    icon: '⚡',
    bestTide: 'specific',
    minTide: 1.5,
    maxTide: 2.5,
    description: 'Shallow ledge, works in narrow tide window',
  },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function SurfConditionsCalculator({ onClose }: SurfConditionsCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [daysAhead, setDaysAhead] = useState(3);
  const [selectedBreakType, setSelectedBreakType] = useState(BREAK_TYPES[0]!);

  const surfWindows = useMemo(() => {
    if (!selectedStation) return [];

    const windows: SurfWindow[] = [];
    const now = new Date();

    // Group consecutive good conditions into windows
    let currentWindow: {
      start: Date;
      tides: number[];
      states: string[];
    } | null = null;

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);

      // Check from 5am to 8pm (surfing hours)
      for (let hour = 5; hour <= 20; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const time = new Date(date);
          time.setHours(hour, min, 0, 0);

          if (time < now) continue;

          const tide = predictTide(selectedStation, time);
          const tideBefore = predictTide(selectedStation, new Date(time.getTime() - 30 * 60000));
          const tideAfter = predictTide(selectedStation, new Date(time.getTime() + 30 * 60000));
          const rate = tideAfter - tideBefore;

          let tideState: 'rising' | 'falling' | 'high' | 'low';
          if (Math.abs(rate) < 0.03) {
            tideState = rate >= 0 ? 'high' : 'low';
          } else {
            tideState = rate > 0 ? 'rising' : 'falling';
          }

          // Check if conditions are good for this break type
          let isGood = false;

          if (tide >= selectedBreakType.minTide && tide <= selectedBreakType.maxTide) {
            switch (selectedBreakType.bestTide) {
              case 'mid':
                // Mid-tide is best (avoid extremes)
                isGood = tide > 1.0 && tide < 2.5;
                break;
              case 'mid-low':
                // Lower mid-tide preferred
                isGood = tide > 0.5 && tide < 2.0;
                break;
              case 'mid-high':
                // Higher mid-tide preferred
                isGood = tide > 1.5 && tide < 3.0;
                break;
              case 'outgoing':
                // Outgoing (falling) tide preferred
                isGood = tideState === 'falling' || tideState === 'low';
                break;
              case 'specific':
                // Narrow window
                isGood = tide >= 1.5 && tide <= 2.5;
                break;
              default:
                isGood = true;
            }
          }

          if (isGood) {
            if (!currentWindow) {
              currentWindow = { start: time, tides: [tide], states: [tideState] };
            } else {
              currentWindow.tides.push(tide);
              currentWindow.states.push(tideState);
            }
          } else if (currentWindow) {
            // End current window
            const duration = currentWindow.tides.length * 30;
            if (duration >= 60) { // At least 1 hour window
              const avgTide = currentWindow.tides.reduce((a, b) => a + b, 0) / currentWindow.tides.length;
              const mainState = getMostCommon(currentWindow.states);

              let quality: 'firing' | 'good' | 'fair' | 'poor';
              let reason: string;

              if (duration >= 180 && avgTide > 1.0 && avgTide < 2.5) {
                quality = 'firing';
                reason = 'Extended optimal tide window';
              } else if (duration >= 120) {
                quality = 'good';
                reason = 'Solid session window';
              } else if (duration >= 60) {
                quality = 'fair';
                reason = 'Short but surfable window';
              } else {
                quality = 'poor';
                reason = 'Very limited window';
              }

              const endTime = new Date(currentWindow.start.getTime() + duration * 60000);

              windows.push({
                date: currentWindow.start,
                startTime: currentWindow.start,
                endTime,
                avgTide,
                tideState: mainState as 'rising' | 'falling' | 'high' | 'low',
                quality,
                reason,
              });
            }
            currentWindow = null;
          }
        }
      }
    }

    // Sort by quality then date
    const qualityOrder = { firing: 0, good: 1, fair: 2, poor: 3 };
    return windows.sort((a, b) =>
      qualityOrder[a.quality] - qualityOrder[b.quality] ||
      a.startTime.getTime() - b.startTime.getTime()
    );
  }, [selectedStation, daysAhead, selectedBreakType]);

  function getMostCommon(arr: string[]): string {
    const counts: Record<string, number> = {};
    for (const item of arr) {
      counts[item] = (counts[item] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mid';
  }

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  const qualityColors = {
    firing: 'bg-purple-900/40 border-purple-500/50',
    good: 'bg-green-900/40 border-green-500/50',
    fair: 'bg-blue-900/40 border-blue-500/50',
    poor: 'bg-slate-700/40 border-slate-500/50',
  };

  const qualityEmoji = {
    firing: '🔥',
    good: '🤙',
    fair: '👍',
    poor: '😐',
  };

  const tideStateIcons = {
    rising: '📈',
    falling: '📉',
    high: '🔝',
    low: '⬇️',
  };

  if (!selectedStation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to check surf conditions</p>
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
            <h3 className="text-lg font-semibold text-cyan-400">🏄 Surf Conditions</h3>
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

        {/* Info */}
        <div className="bg-cyan-900/30 border border-cyan-500/50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-cyan-300 font-medium">📊 Tide-Based Estimation</p>
          <p className="text-slate-300 text-xs mt-1">
            This shows optimal tide windows for surfing. Actual conditions depend on
            swell, wind, and local factors. Check a surf forecast for complete info.
          </p>
        </div>

        {/* Break Type Selection */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 block mb-2">Break Type</label>
          <div className="flex flex-wrap gap-2">
            {BREAK_TYPES.map((type) => (
              <button
                key={type.name}
                onClick={() => setSelectedBreakType(type)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedBreakType.name === type.name
                    ? 'bg-cyan-900/40 border-cyan-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">{selectedBreakType.description}</p>
        </div>

        {/* Days selector */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1">Days Ahead</label>
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              <option value={1}>Today</option>
              <option value={3}>3 Days</option>
              <option value={7}>1 Week</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {surfWindows.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>No optimal surf windows found.</p>
              <p className="text-sm mt-2">Try a different break type or check a longer timeframe.</p>
            </div>
          ) : (
            surfWindows.slice(0, 20).map((window, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${qualityColors[window.quality]}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-slate-200">
                      {qualityEmoji[window.quality]} {formatDate(window.date)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                    window.quality === 'firing' ? 'bg-purple-600' :
                    window.quality === 'good' ? 'bg-green-600' :
                    window.quality === 'fair' ? 'bg-blue-600' : 'bg-slate-600'
                  }`}>
                    {window.quality}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                  <div>
                    <div className="text-xs text-slate-400">Window</div>
                    <div className="text-cyan-300">
                      {formatTime(window.startTime)} - {formatTime(window.endTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Avg Tide</div>
                    <div className="text-slate-200">{formatHeight(window.avgTide)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Tide State</div>
                    <div className="text-slate-200">
                      {tideStateIcons[window.tideState]} {window.tideState}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{window.reason}</p>
              </div>
            ))
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">🏄 Surf Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Beach breaks often work best 2 hours either side of low tide</li>
            <li>• Reef breaks need enough water for safety - respect the tide</li>
            <li>• Outgoing tide can create stronger currents - be aware</li>
            <li>• Always check actual swell and wind conditions before paddling out</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
