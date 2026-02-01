import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';
import type { TideStation } from '@/types/harmonics';

interface TideRate {
  rate: number; // meters per hour
  direction: 'rising' | 'falling' | 'slack';
  nextSlack: Date | null;
  currentHeight: number;
}

function calculateTideRate(station: TideStation, time: Date): TideRate {
  // Calculate tide at current time and 10 minutes ago/ahead
  const deltaMs = 10 * 60 * 1000; // 10 minutes
  const timeBefore = new Date(time.getTime() - deltaMs);
  const timeAfter = new Date(time.getTime() + deltaMs);

  const heightNow = predictTide(station, time);
  const heightBefore = predictTide(station, timeBefore);
  const heightAfter = predictTide(station, timeAfter);

  // Rate in meters per hour
  const rate = ((heightAfter - heightBefore) / 2) * 6; // 10-minute delta * 6 = hourly rate

  // Determine direction
  let direction: 'rising' | 'falling' | 'slack';
  if (Math.abs(rate) < 0.01) {
    direction = 'slack';
  } else if (rate > 0) {
    direction = 'rising';
  } else {
    direction = 'falling';
  }

  // Find next slack (simplified - look for rate sign change)
  let nextSlack: Date | null = null;
  const searchInterval = 15 * 60 * 1000; // 15 minutes
  const maxSearch = 12 * 60 * 60 * 1000; // 12 hours

  let prevRate = rate;
  for (let offset = searchInterval; offset < maxSearch; offset += searchInterval) {
    const futureTime = new Date(time.getTime() + offset);
    const futureTimeBefore = new Date(futureTime.getTime() - deltaMs);
    const futureTimeAfter = new Date(futureTime.getTime() + deltaMs);

    const futureHeightBefore = predictTide(station, futureTimeBefore);
    const futureHeightAfter = predictTide(station, futureTimeAfter);
    const futureRate = ((futureHeightAfter - futureHeightBefore) / 2) * 6;

    // Sign change indicates slack
    if ((prevRate > 0 && futureRate < 0) || (prevRate < 0 && futureRate > 0)) {
      nextSlack = futureTime;
      break;
    }
    prevRate = futureRate;
  }

  return {
    rate: Math.abs(rate),
    direction,
    nextSlack,
    currentHeight: heightNow,
  };
}

function formatRate(rate: number): string {
  return `${rate.toFixed(2)} m/hr`;
}

function formatTimeUntil(target: Date): string {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

export function TideRateIndicator() {
  const station = useHarmonicsStore((s) => s.selectedStation);

  const tideRate = useMemo(() => {
    if (!station) return null;
    return calculateTideRate(station, new Date());
  }, [station]);

  if (!tideRate) return null;

  const directionIcon = tideRate.direction === 'rising' ? '↑' : tideRate.direction === 'falling' ? '↓' : '↔';
  const directionColor = tideRate.direction === 'rising' ? 'text-green-400' : tideRate.direction === 'falling' ? 'text-red-400' : 'text-yellow-400';

  // Rate intensity (for visual indicator)
  const intensity = Math.min(tideRate.rate / 0.5, 1); // 0.5 m/hr = max intensity

  return (
    <div className="bg-slate-800 rounded-lg p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${directionColor}`}>{directionIcon}</span>
          <div>
            <h3 className="text-white font-medium text-sm">Tide Rate</h3>
            <p className="text-xs text-slate-400 capitalize">{tideRate.direction}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-mono ${directionColor}`}>
            {formatRate(tideRate.rate)}
          </p>
        </div>
      </div>

      {/* Rate intensity bar */}
      <div className="mb-3">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              tideRate.direction === 'rising' ? 'bg-gradient-to-r from-green-600 to-green-400' :
              tideRate.direction === 'falling' ? 'bg-gradient-to-r from-red-600 to-red-400' :
              'bg-yellow-500'
            }`}
            style={{ width: `${intensity * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Next slack water */}
      {tideRate.nextSlack && (
        <div className="flex items-center justify-between text-sm border-t border-slate-700 pt-2">
          <span className="text-slate-400">Next slack water:</span>
          <div className="text-right">
            <span className="text-white">
              {tideRate.nextSlack.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className="text-slate-500 text-xs ml-1">
              ({formatTimeUntil(tideRate.nextSlack)})
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-slate-500 mt-2">
        {tideRate.direction === 'slack'
          ? 'Tide is near high or low water. Current flow is minimal.'
          : `Water level ${tideRate.direction === 'rising' ? 'increasing' : 'decreasing'} at ${formatRate(tideRate.rate)}.`}
      </p>
    </div>
  );
}
