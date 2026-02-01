import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface KayakLaunchPlannerProps {
  onClose: () => void;
}

interface LaunchWindow {
  date: Date;
  launchTime: Date;
  returnTime: Date;
  launchTide: number;
  returnTide: number;
  launchCurrent: 'ebb' | 'flood' | 'slack';
  returnCurrent: 'ebb' | 'flood' | 'slack';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string[];
}

// Launch site types with different tide requirements
const LAUNCH_TYPES = [
  {
    name: 'Beach Launch',
    icon: '🏖️',
    minTide: 0.5,
    maxTide: null,
    description: 'Sandy beach with gradual slope',
  },
  {
    name: 'Boat Ramp',
    icon: '🚗',
    minTide: 0.3,
    maxTide: null,
    description: 'Paved ramp, needs water at end',
  },
  {
    name: 'Rocky Shore',
    icon: '🪨',
    minTide: 1.0,
    maxTide: null,
    description: 'Requires higher tide for clearance',
  },
  {
    name: 'Mudflat',
    icon: '🦀',
    minTide: 1.5,
    maxTide: null,
    description: 'Avoid low tides - muddy and difficult',
  },
  {
    name: 'Marina/Dock',
    icon: '⛵',
    minTide: null,
    maxTide: null,
    description: 'Usually accessible any tide',
  },
];

const TRIP_DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '3 hours', hours: 3 },
  { label: '4 hours', hours: 4 },
  { label: 'Half day (6h)', hours: 6 },
  { label: 'Full day (8h)', hours: 8 },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function getCurrentState(rate: number): 'ebb' | 'flood' | 'slack' {
  if (Math.abs(rate) < 0.05) return 'slack';
  return rate > 0 ? 'flood' : 'ebb';
}

export function KayakLaunchPlanner({ onClose }: KayakLaunchPlannerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [daysAhead, setDaysAhead] = useState(7);
  const [selectedLaunchType, setSelectedLaunchType] = useState(LAUNCH_TYPES[0]!);
  const [tripDuration, setTripDuration] = useState(2);
  const [preferSlack, setPreferSlack] = useState(true);
  const [daytimeOnly, setDaytimeOnly] = useState(true);

  const launchWindows = useMemo(() => {
    if (!selectedStation) return [];

    const windows: LaunchWindow[] = [];
    const now = new Date();
    const searchInterval = 60 * 60000; // 1 hour intervals
    const endTime = new Date(now.getTime() + daysAhead * 24 * 3600000);

    for (let time = now.getTime(); time < endTime.getTime(); time += searchInterval) {
      const launchTime = new Date(time);
      const returnTime = new Date(time + tripDuration * 3600000);

      // Skip night hours if daytime only
      const launchHour = launchTime.getHours();
      const returnHour = returnTime.getHours();
      if (daytimeOnly && (launchHour < 6 || launchHour > 18 || returnHour < 6 || returnHour > 20)) {
        continue;
      }

      const launchTide = predictTide(selectedStation, launchTime);
      const returnTide = predictTide(selectedStation, returnTime);

      // Check tide requirements
      if (selectedLaunchType.minTide !== null && launchTide < selectedLaunchType.minTide) continue;
      if (selectedLaunchType.minTide !== null && returnTide < selectedLaunchType.minTide) continue;
      if (selectedLaunchType.maxTide !== null && launchTide > selectedLaunchType.maxTide) continue;
      if (selectedLaunchType.maxTide !== null && returnTide > selectedLaunchType.maxTide) continue;

      // Calculate current state at launch and return
      const launchBefore = predictTide(selectedStation, new Date(time - 30 * 60000));
      const launchAfter = predictTide(selectedStation, new Date(time + 30 * 60000));
      const launchRate = launchAfter - launchBefore;
      const launchCurrent = getCurrentState(launchRate);

      const returnBefore = predictTide(selectedStation, new Date(returnTime.getTime() - 30 * 60000));
      const returnAfter = predictTide(selectedStation, new Date(returnTime.getTime() + 30 * 60000));
      const returnRate = returnAfter - returnBefore;
      const returnCurrent = getCurrentState(returnRate);

      // Calculate quality score
      let score = 50;
      const notes: string[] = [];

      // Bonus for slack water at launch/return
      if (preferSlack) {
        if (launchCurrent === 'slack') {
          score += 20;
          notes.push('Slack water at launch');
        }
        if (returnCurrent === 'slack') {
          score += 15;
          notes.push('Slack water at return');
        }
      }

      // Bonus for favorable current direction (going with current)
      if (launchCurrent === 'ebb' && returnCurrent === 'flood') {
        score += 10;
        notes.push('Favorable current pattern');
      }

      // Penalty for fighting current both ways
      if (launchCurrent === returnCurrent && launchCurrent !== 'slack') {
        score -= 10;
        notes.push('Same current direction both ways');
      }

      // Good tide heights
      if (launchTide >= 1.5 && returnTide >= 1.5) {
        score += 5;
        notes.push('Good water depth');
      }

      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (score >= 75) quality = 'excellent';
      else if (score >= 60) quality = 'good';
      else if (score >= 45) quality = 'fair';
      else quality = 'poor';

      windows.push({
        date: launchTime,
        launchTime,
        returnTime,
        launchTide,
        returnTide,
        launchCurrent,
        returnCurrent,
        quality,
        notes,
      });
    }

    // Sort by quality
    return windows.sort((a, b) => {
      const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
      return qualityOrder[a.quality] - qualityOrder[b.quality];
    });
  }, [selectedStation, daysAhead, selectedLaunchType, tripDuration, preferSlack, daytimeOnly]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  const currentIcons = {
    ebb: '↓',
    flood: '↑',
    slack: '○',
  };

  const currentColors = {
    ebb: 'text-red-400',
    flood: 'text-green-400',
    slack: 'text-blue-400',
  };

  const qualityColors = {
    excellent: 'bg-green-900/40 border-green-500/50',
    good: 'bg-blue-900/40 border-blue-500/50',
    fair: 'bg-yellow-900/40 border-yellow-500/50',
    poor: 'bg-slate-700/40 border-slate-500/50',
  };

  if (!selectedStation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to plan paddle trips</p>
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
            <h3 className="text-lg font-semibold text-cyan-400">🛶 Kayak Launch Planner</h3>
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
        <div className="bg-cyan-900/30 border border-cyan-500/50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-cyan-300 font-medium">⚠️ Paddling Safety</p>
          <p className="text-slate-300 text-xs mt-1">
            Always check weather, wear a PFD, file a float plan, and know the local
            conditions before launching. Currents can be stronger than expected.
          </p>
        </div>

        {/* Launch Type Selection */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 block mb-2">Launch Type</label>
          <div className="flex flex-wrap gap-2">
            {LAUNCH_TYPES.map((type) => (
              <button
                key={type.name}
                onClick={() => setSelectedLaunchType(type)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedLaunchType.name === type.name
                    ? 'bg-cyan-900/40 border-cyan-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">{selectedLaunchType.description}</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Trip Duration</label>
            <select
              value={tripDuration}
              onChange={(e) => setTripDuration(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              {TRIP_DURATIONS.map((d) => (
                <option key={d.hours} value={d.hours}>{d.label}</option>
              ))}
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
        </div>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preferSlack}
              onChange={(e) => setPreferSlack(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600"
            />
            Prefer slack water
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={daytimeOnly}
              onChange={(e) => setDaytimeOnly(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600"
            />
            ☀️ Daylight only
          </label>
        </div>

        {/* Current Legend */}
        <div className="flex gap-4 mb-3 text-xs text-slate-400 justify-center">
          <span><span className={currentColors.flood}>↑</span> Flood (rising)</span>
          <span><span className={currentColors.ebb}>↓</span> Ebb (falling)</span>
          <span><span className={currentColors.slack}>○</span> Slack</span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {launchWindows.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>No suitable launch windows found.</p>
              <p className="text-sm mt-2">Try adjusting the launch type or time range.</p>
            </div>
          ) : (
            launchWindows.slice(0, 25).map((window, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${qualityColors[window.quality]}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-slate-200">
                    {formatDate(window.date)}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase ${
                    window.quality === 'excellent' ? 'bg-green-600' :
                    window.quality === 'good' ? 'bg-blue-600' :
                    window.quality === 'fair' ? 'bg-yellow-600' : 'bg-slate-600'
                  }`}>
                    {window.quality}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                  <div className="bg-slate-800/50 rounded p-2">
                    <div className="text-xs text-slate-400">Launch</div>
                    <div className="font-mono text-cyan-300">{formatTime(window.launchTime)}</div>
                    <div className="text-xs">
                      {formatHeight(window.launchTide)}{' '}
                      <span className={currentColors[window.launchCurrent]}>
                        {currentIcons[window.launchCurrent]} {window.launchCurrent}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2">
                    <div className="text-xs text-slate-400">Return</div>
                    <div className="font-mono text-cyan-300">{formatTime(window.returnTime)}</div>
                    <div className="text-xs">
                      {formatHeight(window.returnTide)}{' '}
                      <span className={currentColors[window.returnCurrent]}>
                        {currentIcons[window.returnCurrent]} {window.returnCurrent}
                      </span>
                    </div>
                  </div>
                </div>

                {window.notes.length > 0 && (
                  <div className="text-xs text-slate-400">
                    {window.notes.join(' • ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">🛶 Paddling Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Launch during slack water for easiest entry</li>
            <li>• Plan to paddle against current first, return with it</li>
            <li>• Strong currents (1+ knots) can exceed paddling speed</li>
            <li>• Allow extra time for headwind or adverse current</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
