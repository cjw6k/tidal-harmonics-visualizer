import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';
import { addDays, differenceInHours, format } from 'date-fns';

interface Props {
  onClose: () => void;
}

// Simplified moon phase calculation
function getMoonPhase(date: Date): { phase: number; name: string; illumination: number } {
  // Synodic month is 29.53059 days
  const SYNODIC_MONTH = 29.53059;

  // Reference new moon: January 6, 2000
  const REFERENCE_NEW_MOON = new Date('2000-01-06T00:00:00Z').getTime();

  const daysSinceRef = (date.getTime() - REFERENCE_NEW_MOON) / (24 * 60 * 60 * 1000);
  const phase = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  // Phase as 0-1 (0 = new, 0.5 = full)
  const normalizedPhase = phase / SYNODIC_MONTH;

  // Illumination (0 at new/full for spring tide relevance)
  const illumination = Math.abs(Math.sin(normalizedPhase * Math.PI * 2));

  let name: string;
  if (normalizedPhase < 0.03 || normalizedPhase > 0.97) {
    name = 'New Moon';
  } else if (normalizedPhase < 0.22) {
    name = 'Waxing Crescent';
  } else if (normalizedPhase < 0.28) {
    name = 'First Quarter';
  } else if (normalizedPhase < 0.47) {
    name = 'Waxing Gibbous';
  } else if (normalizedPhase < 0.53) {
    name = 'Full Moon';
  } else if (normalizedPhase < 0.72) {
    name = 'Waning Gibbous';
  } else if (normalizedPhase < 0.78) {
    name = 'Last Quarter';
  } else {
    name = 'Waning Crescent';
  }

  return { phase: normalizedPhase, name, illumination };
}

// Find the next/previous syzygy (new or full moon)
function findNearestSyzygy(date: Date, direction: 'forward' | 'backward'): { date: Date; type: 'new' | 'full' } {
  const SYNODIC_MONTH = 29.53059;
  const REFERENCE_NEW_MOON = new Date('2000-01-06T00:00:00Z').getTime();

  const daysSinceRef = (date.getTime() - REFERENCE_NEW_MOON) / (24 * 60 * 60 * 1000);
  const phase = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  // Days to next new moon
  const daysToNewMoon = SYNODIC_MONTH - phase;
  // Days to next full moon
  const daysToFullMoon = ((SYNODIC_MONTH / 2) - phase + SYNODIC_MONTH) % SYNODIC_MONTH;

  // Days since last new moon
  const daysSinceNewMoon = phase;
  // Days since last full moon
  const daysSinceFullMoon = (phase + SYNODIC_MONTH / 2) % SYNODIC_MONTH;

  if (direction === 'forward') {
    if (daysToNewMoon < daysToFullMoon) {
      return {
        date: new Date(date.getTime() + daysToNewMoon * 24 * 60 * 60 * 1000),
        type: 'new',
      };
    } else {
      return {
        date: new Date(date.getTime() + daysToFullMoon * 24 * 60 * 60 * 1000),
        type: 'full',
      };
    }
  } else {
    if (daysSinceNewMoon < daysSinceFullMoon) {
      return {
        date: new Date(date.getTime() - daysSinceNewMoon * 24 * 60 * 60 * 1000),
        type: 'new',
      };
    } else {
      return {
        date: new Date(date.getTime() - daysSinceFullMoon * 24 * 60 * 60 * 1000),
        type: 'full',
      };
    }
  }
}

export function AgeOfTide({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const analysis = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);

    // Get current moon phase
    const moonPhase = getMoonPhase(now);

    // Find the nearest past syzygy (new or full moon)
    const lastSyzygy = findNearestSyzygy(now, 'backward');
    const nextSyzygy = findNearestSyzygy(now, 'forward');

    // Get tide predictions for 30 days around the last syzygy
    const analysisStart = addDays(lastSyzygy.date, -3);
    const analysisEnd = addDays(lastSyzygy.date, 5);

    const series = predictTideSeries(station, analysisStart, analysisEnd, 15);
    const extremes = findExtremes(series);

    if (extremes.length < 2) return null;

    // Find the maximum tidal range after the syzygy
    let maxRange = 0;
    let maxRangeDate: Date | null = null;

    const highTides = extremes.filter(e => e.type === 'high');
    const lowTides = extremes.filter(e => e.type === 'low');

    for (const high of highTides) {
      // Find the nearest low tide after this high
      const nearbyLow = lowTides.find(
        low => Math.abs(differenceInHours(low.time, high.time)) < 8
      );

      if (nearbyLow) {
        const range = Math.abs(high.height - nearbyLow.height);
        if (range > maxRange && high.time >= lastSyzygy.date) {
          maxRange = range;
          maxRangeDate = high.time;
        }
      }
    }

    // Calculate age of tide (hours from syzygy to max range)
    const ageOfTideHours = maxRangeDate
      ? differenceInHours(maxRangeDate, lastSyzygy.date)
      : null;

    const ageOfTideDays = ageOfTideHours ? ageOfTideHours / 24 : null;

    // Calculate current tidal range
    const recentHigh = extremes.find(e => e.type === 'high' && e.time <= now);
    const recentLow = extremes.find(e => e.type === 'low' && e.time <= now);
    const currentRange = recentHigh && recentLow
      ? Math.abs(recentHigh.height - recentLow.height)
      : null;

    // Time since/until syzygies
    const hoursSinceLastSyzygy = differenceInHours(now, lastSyzygy.date);
    const hoursUntilNextSyzygy = differenceInHours(nextSyzygy.date, now);

    // Predict when next spring tide peak will occur
    const nextSpringPeak = ageOfTideHours !== null
      ? addDays(nextSyzygy.date, ageOfTideHours / 24)
      : null;

    return {
      moonPhase,
      lastSyzygy,
      nextSyzygy,
      ageOfTideHours,
      ageOfTideDays,
      maxRange,
      maxRangeDate,
      currentRange,
      hoursSinceLastSyzygy,
      hoursUntilNextSyzygy,
      nextSpringPeak,
    };
  }, [station, epoch]);

  const formatHours = (hours: number) => {
    if (Math.abs(hours) < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = Math.floor(Math.abs(hours) / 24);
    const h = Math.round(Math.abs(hours) % 24);
    return `${days}d ${h}h`;
  };

  const getMoonEmoji = (phase: number) => {
    if (phase < 0.03 || phase > 0.97) return '🌑';
    if (phase < 0.25) return '🌒';
    if (phase < 0.28) return '🌓';
    if (phase < 0.47) return '🌔';
    if (phase < 0.53) return '🌕';
    if (phase < 0.72) return '🌖';
    if (phase < 0.78) return '🌗';
    return '🌘';
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Age of Tide</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Select a station to analyze</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Age of Tide</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Unable to calculate age of tide</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">Age of Tide</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Explanation */}
      <div className="bg-slate-800 rounded p-2 mb-3">
        <p className="text-slate-300 text-xs leading-relaxed">
          The <span className="text-amber-400">age of tide</span> is the delay between
          new/full moon and the resulting spring tide peak. This varies by location.
        </p>
      </div>

      {/* Current Moon Phase */}
      <div className="bg-slate-800 rounded p-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getMoonEmoji(analysis.moonPhase.phase)}</span>
          <div>
            <div className="text-white font-medium">{analysis.moonPhase.name}</div>
            <div className="text-slate-400 text-xs">
              {(analysis.moonPhase.phase * 100).toFixed(0)}% through lunar cycle
            </div>
          </div>
        </div>
      </div>

      {/* Age of Tide Measurement */}
      {analysis.ageOfTideDays !== null && (
        <div className="bg-amber-900/30 border border-amber-700 rounded p-3 mb-3">
          <div className="text-amber-400 text-xs font-medium mb-1">Age of Tide at this Station</div>
          <div className="text-white text-lg font-bold">
            ~{analysis.ageOfTideDays.toFixed(1)} days
          </div>
          <div className="text-slate-400 text-xs mt-1">
            Spring tide peak occurs about {formatHours(analysis.ageOfTideHours!)} after syzygy
          </div>
        </div>
      )}

      {/* Syzygy Timeline */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-500 text-xs">Last Syzygy</div>
          <div className="text-white text-sm font-medium">
            {analysis.lastSyzygy.type === 'new' ? '🌑 New Moon' : '🌕 Full Moon'}
          </div>
          <div className="text-slate-400 text-xs">
            {format(analysis.lastSyzygy.date, 'MMM d, HH:mm')}
          </div>
          <div className="text-cyan-400 text-xs mt-1">
            {formatHours(analysis.hoursSinceLastSyzygy)} ago
          </div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-500 text-xs">Next Syzygy</div>
          <div className="text-white text-sm font-medium">
            {analysis.nextSyzygy.type === 'new' ? '🌑 New Moon' : '🌕 Full Moon'}
          </div>
          <div className="text-slate-400 text-xs">
            {format(analysis.nextSyzygy.date, 'MMM d, HH:mm')}
          </div>
          <div className="text-cyan-400 text-xs mt-1">
            in {formatHours(analysis.hoursUntilNextSyzygy)}
          </div>
        </div>
      </div>

      {/* Spring Tide Predictions */}
      <div className="bg-slate-800 rounded p-3 mb-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Spring Tide Peaks</div>

        {analysis.maxRangeDate && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300 text-xs">Recent max range:</span>
            <span className="text-white text-sm font-mono">
              {formatHeight(analysis.maxRange, unitSystem)}
            </span>
          </div>
        )}

        {analysis.nextSpringPeak && (
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-xs">Next spring peak:</span>
            <span className="text-amber-400 text-sm">
              ~{format(analysis.nextSpringPeak, 'MMM d')}
            </span>
          </div>
        )}
      </div>

      {/* Educational Notes */}
      <div className="border-t border-slate-800 pt-2">
        <div className="text-slate-500 text-xs space-y-1">
          <p>
            <strong className="text-slate-400">Typical range:</strong> 1-3 days lag
          </p>
          <p>
            <strong className="text-slate-400">Causes:</strong> Ocean basin resonance,
            water inertia, coastal geometry
          </p>
          <p>
            <strong className="text-slate-400">Priming:</strong> When spring tides arrive
            before syzygy (rare)
          </p>
        </div>
      </div>
    </div>
  );
}
