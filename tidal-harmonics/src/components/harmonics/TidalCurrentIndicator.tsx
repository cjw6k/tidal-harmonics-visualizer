import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTutorialStore } from '@/stores/tutorialStore';
import { predictTide } from '@/lib/harmonics';

/**
 * Calculates the rate of change of tide (dH/dt) in m/hour
 * Positive = flood (rising), Negative = ebb (falling)
 */
function calculateTideRate(station: NonNullable<ReturnType<typeof useHarmonicsStore.getState>['selectedStation']>, time: Date): number {
  // Calculate tide height 30 minutes before and after
  const dt = 30 * 60 * 1000; // 30 minutes in ms
  const before = new Date(time.getTime() - dt);
  const after = new Date(time.getTime() + dt);

  const h1 = predictTide(station, before);
  const h2 = predictTide(station, after);

  // Rate in meters per hour
  return (h2 - h1) / 1; // 1 hour span
}

/**
 * Estimates current speed based on tidal range and rate
 * This is a simplified approximation - real currents depend on local bathymetry
 */
function estimateCurrentSpeed(rate: number, tidalRange: number): number {
  // Rough estimate: current proportional to rate, normalized by tidal range
  // Peak currents typically occur at mid-tide, near slack at high/low
  const normalizedRate = Math.abs(rate) / (tidalRange || 1);
  // Convert to approximate knots (1-4 knots typical range)
  return normalizedRate * 3;
}

export function TidalCurrentIndicator() {
  const tutorialActive = useTutorialStore((s) => s.isActive);
  const epoch = useTimeStore((s) => tutorialActive ? 0 : s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);

  const { rate, direction, currentSpeed, phase } = useMemo(() => {
    if (!station) {
      return { rate: 0, direction: 'slack' as const, currentSpeed: 0, phase: 'unknown' as const };
    }

    const now = new Date(epoch);
    const rateValue = calculateTideRate(station, now);

    // Get approximate tidal range from station's M2 amplitude (dominant semidiurnal)
    const m2 = station.constituents.find((c) => c.symbol === 'M2');
    const tidalRange = m2 ? m2.amplitude * 2 : 1; // Double amplitude for range

    const speed = estimateCurrentSpeed(rateValue, tidalRange);

    // Determine direction and phase
    let dir: 'flood' | 'ebb' | 'slack';
    let phaseDesc: string;

    if (Math.abs(rateValue) < 0.05) {
      dir = 'slack';
      phaseDesc = rateValue > 0 ? 'Slack before ebb' : 'Slack before flood';
    } else if (rateValue > 0) {
      dir = 'flood';
      phaseDesc = 'Rising tide (flood)';
    } else {
      dir = 'ebb';
      phaseDesc = 'Falling tide (ebb)';
    }

    return {
      rate: rateValue,
      direction: dir,
      currentSpeed: speed,
      phase: phaseDesc,
    };
  }, [epoch, station]);

  // Hide during tutorial to reduce visual clutter
  if (tutorialActive) return null;

  if (!station) return null;

  const arrowRotation =
    direction === 'flood' ? 0 : // pointing up (rising)
    direction === 'ebb' ? 180 : // pointing down (falling)
    90; // slack - horizontal

  const directionColor = {
    flood: 'text-blue-400',
    ebb: 'text-cyan-400',
    slack: 'text-slate-400',
  }[direction];

  const bgColor = {
    flood: 'bg-blue-500/20',
    ebb: 'bg-cyan-500/20',
    slack: 'bg-slate-500/20',
  }[direction];

  return (
    <div className={`${bgColor} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-slate-400">Tidal Current</h3>
        <span className={`text-xs font-medium ${directionColor}`}>
          {direction === 'flood' ? 'FLOOD' : direction === 'ebb' ? 'EBB' : 'SLACK'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Direction arrow */}
        <div className={`w-12 h-12 flex items-center justify-center ${directionColor}`}>
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 transition-transform duration-500"
            style={{ transform: `rotate(${arrowRotation}deg)` }}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19V5m0 0l-7 7m7-7l7 7"
            />
          </svg>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1">
          <div className="text-xs text-slate-400">
            Rate: <span className={`font-medium ${directionColor}`}>
              {rate > 0 ? '+' : ''}{rate.toFixed(2)} m/hr
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Est. current: <span className={`font-medium ${directionColor}`}>
              {currentSpeed.toFixed(1)} kn
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {phase}
          </div>
        </div>
      </div>

      {/* Current strength indicator bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              direction === 'flood' ? 'bg-blue-500' :
              direction === 'ebb' ? 'bg-cyan-500' :
              'bg-slate-500'
            }`}
            style={{ width: `${Math.min(currentSpeed / 4 * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
          <span>Slack</span>
          <span>Strong</span>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-500">
        Note: Current estimates are approximate. Actual currents vary by location.
      </div>
    </div>
  );
}
