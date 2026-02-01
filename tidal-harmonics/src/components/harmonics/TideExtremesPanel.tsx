import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { findExtremes, predictTideSeries } from '@/lib/harmonics';
import { format, formatDistanceToNow, isFuture, addHours } from 'date-fns';

interface TideExtremeDisplay {
  time: Date;
  height: number;
  type: 'high' | 'low';
  isNext: boolean;
  distanceText: string;
}

/**
 * TideExtremesPanel
 *
 * Shows upcoming high and low tides at the selected station.
 * Highlights the next tide and provides useful timing information.
 */
export function TideExtremesPanel() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);

  const extremes = useMemo(() => {
    if (!station) return [];

    const now = new Date(epoch);
    const start = now;
    const end = addHours(now, 48);

    // Generate fine-grained predictions
    const series = predictTideSeries(station, start, end, 6); // 6-minute intervals
    const rawExtremes = findExtremes(series);

    // Format for display
    const displayed: TideExtremeDisplay[] = rawExtremes
      .filter((e) => isFuture(e.time) || e.time.getTime() >= now.getTime() - 3600000)
      .slice(0, 8)
      .map((e, i, arr) => {
        const firstItem = arr[0];
        const isNextTide = i === 0 || (firstItem !== undefined && firstItem.time.getTime() < now.getTime() && i === 1);
        return {
          time: e.time,
          height: e.height,
          type: e.type,
          isNext: isNextTide,
          distanceText: formatDistanceToNow(e.time, { addSuffix: true }),
        };
      });

    return displayed;
  }, [epoch, station]);

  const nextExtreme = extremes.find((e) => e.isNext);

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view tide predictions
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Tide Predictions</h3>

      <p className="text-slate-400 text-xs mb-3">
        Upcoming high and low tides at {station.name}
      </p>

      {/* Next tide highlight */}
      {nextExtreme && (
        <div
          className={`mb-3 p-3 rounded-lg ${
            nextExtreme.type === 'high'
              ? 'bg-blue-500/20 border border-blue-500/30'
              : 'bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl mr-2">
                {nextExtreme.type === 'high' ? '🌊' : '🏖️'}
              </span>
              <span
                className={`text-lg font-medium ${
                  nextExtreme.type === 'high' ? 'text-blue-400' : 'text-amber-400'
                }`}
              >
                Next {nextExtreme.type === 'high' ? 'High' : 'Low'} Tide
              </span>
            </div>
            <div className="text-right">
              <div className="text-white text-lg font-mono">
                {nextExtreme.height.toFixed(2)}m
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-400">
              {format(nextExtreme.time, 'h:mm a')}
            </span>
            <span className="text-slate-400">{nextExtreme.distanceText}</span>
          </div>
        </div>
      )}

      {/* Tide table */}
      <div className="space-y-1">
        {extremes.map((extreme, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${
              extreme.isNext ? 'bg-slate-800' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {extreme.type === 'high' ? '⬆️' : '⬇️'}
              </span>
              <span
                className={`font-medium ${
                  extreme.type === 'high' ? 'text-blue-400' : 'text-amber-400'
                }`}
              >
                {extreme.type === 'high' ? 'High' : 'Low'}
              </span>
            </div>
            <div className="text-slate-400 text-xs">
              {format(extreme.time, 'EEE h:mm a')}
            </div>
            <div className="text-white font-mono w-16 text-right">
              {extreme.height.toFixed(2)}m
            </div>
          </div>
        ))}
      </div>

      {/* Tidal range for day */}
      {extremes.length >= 2 && (
        <div className="mt-3 p-2 bg-slate-800/50 rounded flex items-center justify-between text-xs">
          <span className="text-slate-500">Daily range:</span>
          <span className="text-white">
            {(
              Math.max(...extremes.slice(0, 4).map((e) => e.height)) -
              Math.min(...extremes.slice(0, 4).map((e) => e.height))
            ).toFixed(2)}
            m
          </span>
        </div>
      )}

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Note:</strong>
        <p className="mt-1">
          These predictions are calculated using {station.constituents.length} harmonic
          constituents. Actual tides may vary due to weather, atmospheric pressure, and
          other non-periodic factors.
        </p>
      </div>
    </div>
  );
}
