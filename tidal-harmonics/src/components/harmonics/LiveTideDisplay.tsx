import { useMemo, useState, useEffect } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface LiveTideDisplayProps {
  onClose: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimeUntil(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function LiveTideDisplay({ onClose }: LiveTideDisplayProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [now, setNow] = useState(new Date());

  // Update time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const tideData = useMemo(() => {
    if (!selectedStation) return null;

    const currentHeight = predictTide(selectedStation, now);

    // Calculate rate of change
    const heightBefore = predictTide(selectedStation, new Date(now.getTime() - 600000));
    const heightAfter = predictTide(selectedStation, new Date(now.getTime() + 600000));
    const rate = (heightAfter - heightBefore) / 2; // per 10 min
    const hourlyRate = rate * 6;

    // Determine tide state
    let state: 'rising' | 'falling' | 'high' | 'low';
    if (Math.abs(hourlyRate) < 0.05) {
      state = hourlyRate > 0 ? 'high' : 'low';
    } else {
      state = hourlyRate > 0 ? 'rising' : 'falling';
    }

    // Find next high and low water
    const searchInterval = 10 * 60000; // 10 minutes
    const maxSearch = 14 * 3600000; // 14 hours

    let nextHigh: Date | null = null;
    let nextLow: Date | null = null;
    let nextHighHeight = 0;
    let nextLowHeight = 0;
    let prevSign = hourlyRate > 0 ? 1 : -1;

    for (let offset = searchInterval; offset < maxSearch; offset += searchInterval) {
      const futureTime = new Date(now.getTime() + offset);
      const heightB = predictTide(selectedStation, new Date(futureTime.getTime() - 300000));
      const heightA = predictTide(selectedStation, new Date(futureTime.getTime() + 300000));
      const futureRate = heightA - heightB;
      const sign = futureRate > 0 ? 1 : -1;

      if (sign !== prevSign) {
        // Found an extremum
        const extremumHeight = predictTide(selectedStation, futureTime);
        if (prevSign > 0 && !nextHigh) {
          nextHigh = futureTime;
          nextHighHeight = extremumHeight;
        } else if (prevSign < 0 && !nextLow) {
          nextLow = futureTime;
          nextLowHeight = extremumHeight;
        }

        if (nextHigh && nextLow) break;
      }
      prevSign = sign;
    }

    // Calculate progress in current tide cycle
    let progress = 50;
    if (state === 'rising' && nextHigh) {
      // Estimate time from last low
      const timeToHigh = nextHigh.getTime() - now.getTime();
      const cycleDuration = 6.2 * 3600000; // ~6.2 hours per half-cycle
      progress = 100 - (timeToHigh / cycleDuration) * 100;
    } else if (state === 'falling' && nextLow) {
      const timeToLow = nextLow.getTime() - now.getTime();
      const cycleDuration = 6.2 * 3600000;
      progress = 100 - (timeToLow / cycleDuration) * 100;
    }
    progress = Math.max(0, Math.min(100, progress));

    return {
      currentHeight,
      hourlyRate,
      state,
      progress,
      nextHigh,
      nextHighHeight,
      nextLow,
      nextLowHeight,
    };
  }, [selectedStation, now]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  const stationName = selectedStation?.name ?? 'No Station Selected';

  if (!tideData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to view live tide data</p>
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
      <div className="bg-slate-900 rounded-lg p-4 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-400">Live Tide</h3>
            <p className="text-slate-400 text-sm">{stationName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Main Tide Display */}
        <div className="bg-gradient-to-b from-blue-900/50 to-slate-800 rounded-xl p-6 mb-4">
          {/* Current Height - Big Display */}
          <div className="text-center mb-4">
            <div className="text-5xl font-mono font-bold text-blue-300">
              {formatHeight(tideData.currentHeight)}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              Current tide height
            </div>
          </div>

          {/* State Indicator */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`text-3xl ${
              tideData.state === 'rising' ? 'text-green-400 animate-bounce' :
              tideData.state === 'falling' ? 'text-red-400 animate-bounce' :
              tideData.state === 'high' ? 'text-blue-400' : 'text-amber-400'
            }`}>
              {tideData.state === 'rising' ? '↑' :
               tideData.state === 'falling' ? '↓' :
               tideData.state === 'high' ? '◆' : '◇'}
            </div>
            <div>
              <div className={`text-lg font-medium capitalize ${
                tideData.state === 'rising' ? 'text-green-400' :
                tideData.state === 'falling' ? 'text-red-400' :
                tideData.state === 'high' ? 'text-blue-400' : 'text-amber-400'
              }`}>
                {tideData.state === 'high' ? 'Near High Water' :
                 tideData.state === 'low' ? 'Near Low Water' :
                 tideData.state === 'rising' ? 'Rising' : 'Falling'}
              </div>
              <div className="text-sm text-slate-400">
                {tideData.hourlyRate >= 0 ? '+' : ''}{formatHeight(tideData.hourlyRate)}/hr
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{tideData.state === 'rising' ? 'Low' : 'High'}</span>
              <span>{tideData.state === 'rising' ? 'High' : 'Low'}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  tideData.state === 'rising' ? 'bg-gradient-to-r from-amber-500 to-blue-500' :
                  'bg-gradient-to-r from-blue-500 to-amber-500'
                }`}
                style={{ width: `${tideData.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Next Events */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Next High */}
          <div className="bg-blue-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400">▲</span>
              <span className="text-sm text-slate-300">Next High</span>
            </div>
            {tideData.nextHigh ? (
              <>
                <div className="text-lg font-mono text-blue-300">
                  {formatTime(tideData.nextHigh)}
                </div>
                <div className="text-xs text-slate-400">
                  in {formatTimeUntil(tideData.nextHigh.getTime() - now.getTime())}
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  {formatHeight(tideData.nextHighHeight)}
                </div>
              </>
            ) : (
              <div className="text-slate-500">Calculating...</div>
            )}
          </div>

          {/* Next Low */}
          <div className="bg-amber-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400">▼</span>
              <span className="text-sm text-slate-300">Next Low</span>
            </div>
            {tideData.nextLow ? (
              <>
                <div className="text-lg font-mono text-amber-300">
                  {formatTime(tideData.nextLow)}
                </div>
                <div className="text-xs text-slate-400">
                  in {formatTimeUntil(tideData.nextLow.getTime() - now.getTime())}
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  {formatHeight(tideData.nextLowHeight)}
                </div>
              </>
            ) : (
              <div className="text-slate-500">Calculating...</div>
            )}
          </div>
        </div>

        {/* Visual Tide Gauge */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm text-slate-400 mb-3 text-center">Tide Gauge</h4>
          <div className="flex items-end justify-center gap-2 h-32">
            {/* Gauge */}
            <div className="relative w-16 h-full bg-slate-700 rounded overflow-hidden">
              {/* Water level */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000"
                style={{
                  height: `${Math.max(5, Math.min(95, (tideData.currentHeight / 5) * 100))}%`,
                }}
              >
                {/* Ripple effect */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-blue-300/50 animate-pulse" />
              </div>

              {/* Scale marks */}
              {[0, 1, 2, 3, 4, 5].map((m) => (
                <div
                  key={m}
                  className="absolute left-0 right-0 border-t border-slate-600"
                  style={{ bottom: `${(m / 5) * 100}%` }}
                >
                  <span className="absolute -left-6 -top-2 text-xs text-slate-500">{m}</span>
                </div>
              ))}
            </div>

            {/* Arrow indicator */}
            <div
              className="text-2xl transition-all duration-500"
              style={{
                transform: `translateY(${-((tideData.currentHeight / 5) * 100)}%)`,
              }}
            >
              ◄
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">
            Height in meters (approx. scale)
          </p>
        </div>

        {/* Time */}
        <div className="text-center text-xs text-slate-500 mt-4">
          Last updated: {formatTime(now)}
        </div>
      </div>
    </div>
  );
}
