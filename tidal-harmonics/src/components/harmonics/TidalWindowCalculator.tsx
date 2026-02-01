import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries } from '@/lib/harmonics';
import { formatHeight, toMeters } from '@/lib/units';
import { addHours, addDays, format, differenceInMinutes } from 'date-fns';

interface Props {
  onClose: () => void;
}

interface TidalWindow {
  start: Date;
  end: Date;
  duration: number; // minutes
  peakHeight: number;
  peakTime: Date;
}

export function TidalWindowCalculator({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [threshold, setThreshold] = useState('1.5');
  const [mode, setMode] = useState<'above' | 'below'>('above');
  const [lookAhead, setLookAhead] = useState(48); // hours

  const windows = useMemo(() => {
    if (!station) return [];

    const thresholdValue = toMeters(parseFloat(threshold), unitSystem);
    if (isNaN(thresholdValue)) return [];

    const now = new Date(epoch);
    const end = addHours(now, lookAhead);
    const series = predictTideSeries(station, now, end, 6); // 6-minute intervals

    const result: TidalWindow[] = [];
    let windowStart: Date | null = null;
    let peakHeight = mode === 'above' ? -Infinity : Infinity;
    let peakTime: Date | null = null;

    for (const point of series) {
      const meetsCondition = mode === 'above'
        ? point.height >= thresholdValue
        : point.height <= thresholdValue;

      if (meetsCondition) {
        if (!windowStart) {
          windowStart = point.time;
          peakHeight = point.height;
          peakTime = point.time;
        }
        if (mode === 'above' && point.height > peakHeight) {
          peakHeight = point.height;
          peakTime = point.time;
        } else if (mode === 'below' && point.height < peakHeight) {
          peakHeight = point.height;
          peakTime = point.time;
        }
      } else if (windowStart) {
        result.push({
          start: windowStart,
          end: point.time,
          duration: differenceInMinutes(point.time, windowStart),
          peakHeight,
          peakTime: peakTime!,
        });
        windowStart = null;
        peakHeight = mode === 'above' ? -Infinity : Infinity;
        peakTime = null;
      }
    }

    // Handle window that extends beyond our search period
    if (windowStart) {
      result.push({
        start: windowStart,
        end: end,
        duration: differenceInMinutes(end, windowStart),
        peakHeight,
        peakTime: peakTime!,
      });
    }

    return result;
  }, [station, epoch, threshold, mode, lookAhead, unitSystem]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (windows.length === 0) return null;

    const firstWindow = windows[0]!;
    const now = new Date(epoch);
    const timeUntilFirst = differenceInMinutes(firstWindow.start, now);
    const totalWindowTime = windows.reduce((sum, w) => sum + w.duration, 0);
    const avgDuration = totalWindowTime / windows.length;
    const longestWindow = windows.reduce((longest, w) =>
      w.duration > longest.duration ? w : longest, windows[0]!);

    return {
      timeUntilFirst: Math.max(0, timeUntilFirst),
      firstWindowDuration: firstWindow.duration,
      totalWindows: windows.length,
      avgDuration,
      longestWindow,
      totalWindowTime,
    };
  }, [windows, epoch]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (date: Date) => {
    const now = new Date(epoch);
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === addDays(now, 1).toDateString();

    if (isToday) return `Today ${format(date, 'HH:mm')}`;
    if (isTomorrow) return `Tomorrow ${format(date, 'HH:mm')}`;
    return format(date, 'EEE HH:mm');
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Tidal Windows</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Select a station to calculate tidal windows</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">Tidal Windows</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Configuration */}
      <div className="bg-slate-800 rounded p-3 mb-3 space-y-3">
        <div>
          <label className="text-slate-400 text-xs block mb-1">Find times when tide is:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('above')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === 'above'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Above
            </button>
            <button
              onClick={() => setMode('below')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === 'below'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Below
            </button>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1">
            Threshold ({unitSystem === 'imperial' ? 'ft' : 'm'}):
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            step="0.1"
            className="w-full px-3 py-1.5 bg-slate-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1">Look ahead:</label>
          <div className="flex gap-1">
            {[24, 48, 72].map((hours) => (
              <button
                key={hours}
                onClick={() => setLookAhead(hours)}
                className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                  lookAhead === hours
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-500 text-xs">Next Window In</div>
            <div className="text-cyan-400 text-sm font-mono">
              {stats.timeUntilFirst === 0 ? 'NOW' : formatDuration(stats.timeUntilFirst)}
            </div>
          </div>
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-500 text-xs">Windows Found</div>
            <div className="text-white text-sm font-mono">{stats.totalWindows}</div>
          </div>
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-500 text-xs">Avg Duration</div>
            <div className="text-white text-sm font-mono">{formatDuration(Math.round(stats.avgDuration))}</div>
          </div>
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-500 text-xs">Total Time</div>
            <div className="text-white text-sm font-mono">{formatDuration(stats.totalWindowTime)}</div>
          </div>
        </div>
      )}

      {/* Windows List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {windows.length === 0 ? (
          <div className="text-slate-400 text-xs text-center py-4">
            No windows found in the next {lookAhead} hours
          </div>
        ) : (
          windows.map((window, i) => {
            const now = new Date(epoch);
            const isActive = window.start <= now && window.end > now;
            return (
              <div
                key={i}
                className={`p-2 rounded ${
                  isActive ? 'bg-cyan-900/50 ring-1 ring-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">
                    {isActive && <span className="text-cyan-400 mr-1">●</span>}
                    Window {i + 1}
                  </span>
                  <span className="text-xs text-cyan-400 font-mono">
                    {formatDuration(window.duration)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{formatDateTime(window.start)}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-300">{formatDateTime(window.end)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Peak: {formatHeight(window.peakHeight, unitSystem)} at {format(window.peakTime, 'HH:mm')}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Usage hints */}
      <div className="mt-3 pt-2 border-t border-slate-800">
        <div className="text-slate-500 text-xs">
          <strong className="text-slate-400">Use cases:</strong> Boat launching, beach access,
          fishing, dock clearance, shallow water navigation
        </div>
      </div>
    </div>
  );
}
