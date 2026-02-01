import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface SlackWindow {
  time: Date;
  type: 'high-slack' | 'low-slack';
  duration: number; // minutes of relative slack
  beforeHeight: number;
  afterHeight: number;
}

interface Props {
  onClose: () => void;
}

export function SlackWaterFinder({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [lookAheadDays, setLookAheadDays] = useState(3);
  const [slackThreshold, setSlackThreshold] = useState(0.05); // m/hr

  const useMetric = unitSystem === 'metric';

  // Find all slack water windows
  const slackWindows = useMemo((): SlackWindow[] => {
    if (!station) return [];

    const windows: SlackWindow[] = [];
    const now = new Date();
    const end = new Date(now.getTime() + lookAheadDays * 24 * 60 * 60 * 1000);

    // Sample at 5-minute intervals
    const intervalMs = 5 * 60 * 1000;
    let prevRate = 0;
    let prevHeight = predictTide(station, now);

    for (let t = now.getTime(); t < end.getTime(); t += intervalMs) {
      const time = new Date(t);
      const height = predictTide(station, time);

      // Calculate rate of change (m/hr)
      const rate = (height - prevHeight) / (intervalMs / 3600000);

      // Detect sign change (slack water)
      if (prevRate !== 0 && Math.sign(rate) !== Math.sign(prevRate)) {
        // Refine to find exact slack time
        const slackTime = findExactSlack(station, new Date(t - intervalMs), time);

        // Calculate slack duration (time when rate is below threshold)
        const duration = calculateSlackDuration(station, slackTime, slackThreshold);

        // Determine if high or low slack
        const type: 'high-slack' | 'low-slack' = prevRate > 0 ? 'high-slack' : 'low-slack';

        windows.push({
          time: slackTime,
          type,
          duration,
          beforeHeight: prevHeight,
          afterHeight: height,
        });
      }

      prevRate = rate;
      prevHeight = height;
    }

    return windows;
  }, [station, lookAheadDays, slackThreshold]);

  // Binary search for exact slack time
  function findExactSlack(
    stationData: typeof station,
    start: Date,
    end: Date
  ): Date {
    if (!stationData) return start;

    const threshold = 60000; // 1 minute precision
    let low = start.getTime();
    let high = end.getTime();

    while (high - low > threshold) {
      const mid = (low + high) / 2;

      const deltaMs = 60000; // 1 minute
      const before = predictTide(stationData, new Date(mid - deltaMs));
      const after = predictTide(stationData, new Date(mid + deltaMs));
      const rate = (after - before) / (2 * deltaMs / 3600000);

      const lowBefore = predictTide(stationData, new Date(low - deltaMs));
      const lowAfter = predictTide(stationData, new Date(low + deltaMs));
      const lowRate = (lowAfter - lowBefore) / (2 * deltaMs / 3600000);

      if (Math.sign(rate) === Math.sign(lowRate)) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return new Date((low + high) / 2);
  }

  // Calculate how long the current rate stays below threshold
  function calculateSlackDuration(
    stationData: typeof station,
    slackTime: Date,
    threshold: number
  ): number {
    if (!stationData) return 0;

    const stepMs = 60000; // 1 minute
    let duration = 0;

    // Check backwards
    for (let offset = -stepMs; offset >= -60 * 60 * 1000; offset -= stepMs) {
      const time = new Date(slackTime.getTime() + offset);
      const before = predictTide(stationData, new Date(time.getTime() - stepMs));
      const after = predictTide(stationData, new Date(time.getTime() + stepMs));
      const rate = Math.abs((after - before) / (2 * stepMs / 3600000));

      if (rate < threshold) {
        duration++;
      } else {
        break;
      }
    }

    // Check forwards
    for (let offset = 0; offset <= 60 * 60 * 1000; offset += stepMs) {
      const time = new Date(slackTime.getTime() + offset);
      const before = predictTide(stationData, new Date(time.getTime() - stepMs));
      const after = predictTide(stationData, new Date(time.getTime() + stepMs));
      const rate = Math.abs((after - before) / (2 * stepMs / 3600000));

      if (rate < threshold) {
        duration++;
      } else {
        break;
      }
    }

    return duration;
  }

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

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) return 'now';

    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Group slack windows by day
  const windowsByDay = useMemo(() => {
    const groups: Map<string, SlackWindow[]> = new Map();

    for (const window of slackWindows) {
      const dateKey = window.time.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(window);
    }

    return Array.from(groups.entries());
  }, [slackWindows]);

  if (!station) return null;

  const nextSlack = slackWindows[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Slack Water Finder</h2>
            <p className="text-sm text-slate-400">Find optimal times for diving & boating</p>
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
          {/* Settings */}
          <div className="flex gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Look Ahead</label>
              <select
                value={lookAheadDays}
                onChange={(e) => setLookAheadDays(Number(e.target.value))}
                className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Slack Threshold</label>
              <select
                value={slackThreshold}
                onChange={(e) => setSlackThreshold(Number(e.target.value))}
                className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
              >
                <option value={0.02}>Strict (0.02 {useMetric ? 'm' : 'ft'}/hr)</option>
                <option value={0.05}>Normal (0.05 {useMetric ? 'm' : 'ft'}/hr)</option>
                <option value={0.1}>Relaxed (0.1 {useMetric ? 'm' : 'ft'}/hr)</option>
              </select>
            </div>
          </div>

          {/* Next slack highlight */}
          {nextSlack && (
            <div className={`rounded-lg p-4 ${
              nextSlack.type === 'high-slack'
                ? 'bg-blue-900/40 border border-blue-700'
                : 'bg-teal-900/40 border border-teal-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-300">Next Slack Water</div>
                <div className={`text-xs px-2 py-0.5 rounded ${
                  nextSlack.type === 'high-slack'
                    ? 'bg-blue-600 text-white'
                    : 'bg-teal-600 text-white'
                }`}>
                  {nextSlack.type === 'high-slack' ? 'After High' : 'After Low'}
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold text-white">
                  {formatTime(nextSlack.time)}
                </div>
                <div className="text-slate-400">
                  in {formatTimeUntil(nextSlack.time)}
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-300">
                ~{nextSlack.duration} min window
              </div>
            </div>
          )}

          {/* All slack windows */}
          <div className="space-y-4">
            {windowsByDay.map(([dateKey, windows]) => {
              const firstWindow = windows[0];
              if (!firstWindow) return null;
              return (
              <div key={dateKey}>
                <div className="text-sm font-medium text-slate-400 mb-2">
                  {formatDate(firstWindow.time)}
                </div>
                <div className="space-y-2">
                  {windows.map((window, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded ${
                          window.type === 'high-slack' ? 'bg-blue-500' : 'bg-teal-500'
                        }`} />
                        <div>
                          <div className="text-white font-medium">
                            {formatTime(window.time)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {window.type === 'high-slack' ? 'High water slack' : 'Low water slack'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">
                          ~{window.duration}m
                        </div>
                        <div className="text-xs text-slate-500">
                          window
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">What is Slack Water?</p>
            <p>
              Slack water is the brief period when tidal currents stop as they reverse direction.
              It occurs around high and low tide, making it the ideal time for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Scuba diving (minimal current)</li>
              <li>Entering/exiting narrow channels</li>
              <li>Kayaking in tidal areas</li>
              <li>Dock maneuvers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
