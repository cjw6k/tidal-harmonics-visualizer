import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

interface ActivityPeriod {
  type: 'major' | 'minor';
  start: Date;
  end: Date;
  label: string;
}

// Simplified solunar calculation
// Major periods: Moon overhead (transit) and underfoot (anti-transit)
// Minor periods: Moonrise and moonset
function calculateSolunarPeriods(date: Date, _latitude: number, longitude: number): ActivityPeriod[] {
  const periods: ActivityPeriod[] = [];

  // Approximate lunar transit time (when moon is highest)
  // This is simplified - real calculation needs ephemeris data
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  // Moon transits about 50 minutes later each day
  // Average lunar day is 24h 50m
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const lunarOffset = (dayOfYear * 50) % 1440; // minutes offset

  // Estimate moon transit time (very approximate)
  const transitMinutes = (720 + lunarOffset - (longitude / 15) * 60) % 1440;
  const antiTransitMinutes = (transitMinutes + 720) % 1440;

  // Major periods: ~2 hours around transit and anti-transit
  const transitStart = new Date(baseDate);
  transitStart.setMinutes(transitMinutes - 60);
  const transitEnd = new Date(baseDate);
  transitEnd.setMinutes(transitMinutes + 60);

  const antiTransitStart = new Date(baseDate);
  antiTransitStart.setMinutes(antiTransitMinutes - 60);
  const antiTransitEnd = new Date(baseDate);
  antiTransitEnd.setMinutes(antiTransitMinutes + 60);

  // Minor periods: ~1 hour around moonrise/moonset
  // Approximate moonrise/moonset as 6 hours from transit
  const moonriseMinutes = (transitMinutes - 360 + 1440) % 1440;
  const moonsetMinutes = (transitMinutes + 360) % 1440;

  const moonriseStart = new Date(baseDate);
  moonriseStart.setMinutes(moonriseMinutes - 30);
  const moonriseEnd = new Date(baseDate);
  moonriseEnd.setMinutes(moonriseMinutes + 30);

  const moonsetStart = new Date(baseDate);
  moonsetStart.setMinutes(moonsetMinutes - 30);
  const moonsetEnd = new Date(baseDate);
  moonsetEnd.setMinutes(moonsetMinutes + 30);

  periods.push(
    { type: 'major', start: transitStart, end: transitEnd, label: 'Moon Overhead' },
    { type: 'major', start: antiTransitStart, end: antiTransitEnd, label: 'Moon Underfoot' },
    { type: 'minor', start: moonriseStart, end: moonriseEnd, label: 'Moonrise' },
    { type: 'minor', start: moonsetStart, end: moonsetEnd, label: 'Moonset' }
  );

  // Sort by start time
  periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  return periods;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function calculateOverallRating(periods: ActivityPeriod[], currentTime: Date): { score: number; label: string } {
  // Check if we're in a major or minor period
  for (const period of periods) {
    if (currentTime >= period.start && currentTime <= period.end) {
      if (period.type === 'major') {
        return { score: 5, label: 'Excellent' };
      }
      return { score: 4, label: 'Good' };
    }
  }

  // Check proximity to nearest period
  let minDistance = Infinity;
  for (const period of periods) {
    const distToStart = Math.abs(currentTime.getTime() - period.start.getTime());
    const distToEnd = Math.abs(currentTime.getTime() - period.end.getTime());
    minDistance = Math.min(minDistance, distToStart, distToEnd);
  }

  const hoursAway = minDistance / (1000 * 60 * 60);
  if (hoursAway < 1) return { score: 3, label: 'Fair' };
  if (hoursAway < 2) return { score: 2, label: 'Poor' };
  return { score: 1, label: 'Slow' };
}

export function SolunarActivity() {
  const station = useHarmonicsStore((s) => s.selectedStation);

  const { periods, rating } = useMemo(() => {
    const lat = station?.lat ?? 0;
    const lon = station?.lon ?? 0;
    const now = new Date();
    const periods = calculateSolunarPeriods(now, lat, lon);
    const rating = calculateOverallRating(periods, now);
    return { periods, rating };
  }, [station]);

  const now = new Date();

  return (
    <div className="bg-slate-800 rounded-lg p-3 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎣</span>
          <h3 className="text-white font-medium text-sm">Solunar Forecast</h3>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          rating.score >= 4 ? 'bg-green-600/30 text-green-300' :
          rating.score >= 3 ? 'bg-yellow-600/30 text-yellow-300' :
          'bg-slate-600/30 text-slate-300'
        }`}>
          {rating.label}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="space-y-2">
        {periods.map((period, idx) => {
          const isActive = now >= period.start && now <= period.end;
          const isPast = now > period.end;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded ${
                isActive ? 'bg-blue-600/30 border border-blue-500' :
                isPast ? 'opacity-50' : 'bg-slate-700/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                period.type === 'major' ? 'bg-yellow-400' : 'bg-slate-400'
              }`} />
              <div className="flex-1">
                <span className={`text-xs font-medium ${isActive ? 'text-blue-300' : 'text-slate-300'}`}>
                  {period.label}
                </span>
                <span className="text-xs text-slate-500 ml-1">
                  ({period.type})
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {formatTime(period.start)} - {formatTime(period.end)}
              </span>
              {isActive && (
                <span className="text-xs text-blue-400 animate-pulse">NOW</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Major (2hr)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Minor (1hr)
          </span>
        </div>
        <span title="Based on solunar theory">Theory-based</span>
      </div>

      {/* Info note */}
      <p className="mt-2 text-xs text-slate-500">
        Solunar theory suggests fish and wildlife are most active during lunar transit periods.
        Best results during new/full moon phases with stable weather.
      </p>
    </div>
  );
}
