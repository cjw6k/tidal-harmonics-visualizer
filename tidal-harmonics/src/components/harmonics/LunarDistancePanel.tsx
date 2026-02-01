import { useMemo } from 'react';
import { addDays, format, differenceInDays } from 'date-fns';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';

interface LunarDistancePanelProps {
  onClose: () => void;
}

// Average lunar distance in km
const MEAN_LUNAR_DISTANCE = 384400;
const PERIGEE_DISTANCE = 356500; // Closest
const APOGEE_DISTANCE = 406700; // Farthest

// Lunar orbital period in days
const ANOMALISTIC_MONTH = 27.554551;

// Calculate lunar distance for a given date
// Uses simplified model based on anomalistic month
function calculateLunarDistance(date: Date): {
  distance: number;
  percentDeviation: number;
  phase: 'approaching' | 'receding';
  amplitudeFactor: number;
} {
  // Reference perigee: January 13, 2026 (approximate)
  const referencePerigee = new Date('2026-01-13T12:00:00Z');
  const daysSinceRef = (date.getTime() - referencePerigee.getTime()) / (1000 * 60 * 60 * 24);

  // Position in anomalistic cycle (0 = perigee, 0.5 = apogee)
  const cyclePosition = ((daysSinceRef % ANOMALISTIC_MONTH) + ANOMALISTIC_MONTH) % ANOMALISTIC_MONTH;
  const normalizedPosition = cyclePosition / ANOMALISTIC_MONTH; // 0-1

  // Use cosine for distance (0 = perigee = closest, 0.5 = apogee = farthest)
  const distanceRange = APOGEE_DISTANCE - PERIGEE_DISTANCE;
  const distance = PERIGEE_DISTANCE + (distanceRange / 2) * (1 - Math.cos(normalizedPosition * 2 * Math.PI));

  // Percent deviation from mean
  const percentDeviation = ((distance - MEAN_LUNAR_DISTANCE) / MEAN_LUNAR_DISTANCE) * 100;

  // Phase: approaching if in first half of cycle past apogee
  const phase: 'approaching' | 'receding' = normalizedPosition > 0.5 ? 'approaching' : 'receding';

  // Amplitude factor: tidal force varies inversely with cube of distance
  // At perigee: ~12% stronger tides, at apogee: ~12% weaker
  const amplitudeFactor = Math.pow(MEAN_LUNAR_DISTANCE / distance, 3);

  return {
    distance,
    percentDeviation,
    phase,
    amplitudeFactor,
  };
}

// Find upcoming perigee/apogee events
function findLunarEvents(startDate: Date, count: number = 6): Array<{
  type: 'perigee' | 'apogee';
  date: Date;
  distance: number;
}> {
  const events: Array<{ type: 'perigee' | 'apogee'; date: Date; distance: number }> = [];
  const referencePerigee = new Date('2026-01-13T12:00:00Z');
  const halfMonth = ANOMALISTIC_MONTH / 2;

  // Find the first perigee after startDate
  let daysSinceRef = (startDate.getTime() - referencePerigee.getTime()) / (1000 * 60 * 60 * 24);
  let cyclesSinceRef = Math.floor(daysSinceRef / ANOMALISTIC_MONTH);

  // Start from slightly before to catch recent events
  let currentPerigee = addDays(referencePerigee, cyclesSinceRef * ANOMALISTIC_MONTH);

  while (events.length < count) {
    // Check if this perigee is in the future
    if (currentPerigee > startDate) {
      events.push({
        type: 'perigee',
        date: currentPerigee,
        distance: PERIGEE_DISTANCE + Math.random() * 5000 - 2500, // Add some variation
      });
    }

    // Add corresponding apogee (half month later)
    const apogeeDate = addDays(currentPerigee, halfMonth);
    if (apogeeDate > startDate && events.length < count) {
      events.push({
        type: 'apogee',
        date: apogeeDate,
        distance: APOGEE_DISTANCE + Math.random() * 5000 - 2500,
      });
    }

    // Move to next cycle
    currentPerigee = addDays(currentPerigee, ANOMALISTIC_MONTH);
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, count);
}

export function LunarDistancePanel({ onClose }: LunarDistancePanelProps) {
  const epoch = useTimeStore((s) => s.epoch);
  const currentTime = useMemo(() => new Date(epoch), [epoch]);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const data = useMemo(() => {
    const lunar = calculateLunarDistance(currentTime);
    const events = findLunarEvents(currentTime);
    return { lunar, events };
  }, [currentTime]);

  const formatDistance = (km: number) => {
    if (unitSystem === 'imperial') {
      const miles = km * 0.621371;
      return `${miles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`;
    }
    return `${km.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
  };

  // Visual representation of distance
  const distancePercent = ((data.lunar.distance - PERIGEE_DISTANCE) / (APOGEE_DISTANCE - PERIGEE_DISTANCE)) * 100;

  // Amplitude effect as percentage
  const amplitudeEffect = ((data.lunar.amplitudeFactor - 1) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-indigo-400">Lunar Distance & Tides</h3>
            <p className="text-slate-400 text-sm">
              How the Moon's orbital distance affects tidal amplitudes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Current Distance Display */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Current Lunar Distance</p>
          <p className="text-3xl font-mono font-bold text-indigo-400 mb-1">
            {formatDistance(data.lunar.distance)}
          </p>
          <p className="text-sm text-slate-400">
            {data.lunar.percentDeviation > 0 ? '+' : ''}{data.lunar.percentDeviation.toFixed(1)}% from mean
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-sm ${data.lunar.phase === 'approaching' ? 'text-green-400' : 'text-orange-400'}`}>
              {data.lunar.phase === 'approaching' ? '← Approaching' : 'Receding →'}
            </span>
          </div>
        </div>

        {/* Distance Scale */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Perigee</span>
            <span>Mean</span>
            <span>Apogee</span>
          </div>
          <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
            {/* Mean marker */}
            <div
              className="absolute w-0.5 h-full bg-slate-500"
              style={{ left: '50%' }}
            />
            {/* Current position */}
            <div
              className="absolute w-4 h-4 bg-indigo-500 rounded-full border-2 border-white transform -translate-x-1/2 shadow-lg transition-all"
              style={{ left: `${distancePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatDistance(PERIGEE_DISTANCE)}</span>
            <span>{formatDistance(MEAN_LUNAR_DISTANCE)}</span>
            <span>{formatDistance(APOGEE_DISTANCE)}</span>
          </div>
        </div>

        {/* Tidal Effect */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Tidal Amplitude Effect</h4>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-mono font-bold ${amplitudeEffect > 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {amplitudeEffect > 0 ? '+' : ''}{amplitudeEffect.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400">
              {amplitudeEffect > 0
                ? 'Tides are stronger than average'
                : 'Tides are weaker than average'}
            </div>
          </div>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                amplitudeEffect > 0 ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{
                width: `${50 + amplitudeEffect * 4}%`,
                marginLeft: amplitudeEffect < 0 ? 'auto' : 0,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Weaker (-12%)</span>
            <span>Average</span>
            <span>Stronger (+12%)</span>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Upcoming Lunar Events</h4>
          <div className="space-y-2">
            {data.events.map((event, i) => {
              const daysAway = differenceInDays(event.date, currentTime);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded ${
                    event.type === 'perigee' ? 'bg-indigo-900/30' : 'bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${event.type === 'perigee' ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {event.type === 'perigee' ? '🌑' : '🌕'}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${
                        event.type === 'perigee' ? 'text-indigo-300' : 'text-slate-300'
                      }`}>
                        {event.type === 'perigee' ? 'Perigee' : 'Apogee'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(event.date, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">
                      {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway} days`}
                    </p>
                    <p className="text-xs text-slate-500">
                      ~{formatDistance(event.distance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Understanding Perigean Tides</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <p>
              The Moon's orbit is elliptical, varying its distance from Earth by about 50,000 km
              (~31,000 mi) over each 27.5-day anomalistic month.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-900/30 rounded p-2">
                <p className="text-indigo-300 font-medium">Perigee (Closest)</p>
                <p className="text-xs mt-1">
                  Moon is ~12% closer than average. Tidal forces are ~12% stronger due to
                  inverse-cube relationship. Combined with spring tides, creates "king tides."
                </p>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <p className="text-slate-300 font-medium">Apogee (Farthest)</p>
                <p className="text-xs mt-1">
                  Moon is ~6% farther than average. Tidal forces are ~12% weaker.
                  Even spring tides during apogee are more moderate.
                </p>
              </div>
            </div>
            <p>
              <strong className="text-amber-400">Perigean Spring Tides:</strong> When perigee
              aligns with new or full moon (within a few days), the combined effect produces
              exceptionally high and low tides—often called "king tides" or "proxigean tides."
            </p>
            <p className="text-xs text-slate-500">
              Note: Tidal force varies with the inverse cube of distance (1/r³), making distance
              effects more pronounced than linear proportions would suggest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
