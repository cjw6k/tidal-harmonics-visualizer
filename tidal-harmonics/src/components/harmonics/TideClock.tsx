import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { findExtremes, predictTideSeries, predictTide } from '@/lib/harmonics';
import { addHours, differenceInMinutes, format } from 'date-fns';
import { formatHeight } from '@/lib/units';

/**
 * TideClock
 *
 * A traditional tide clock visualization showing the current position
 * in the tidal cycle. The clock face represents one complete tidal cycle
 * (~12h 25m for semidiurnal tides).
 */
export function TideClock() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const tideState = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);
    const start = addHours(now, -12);
    const end = addHours(now, 12);

    // Get tide predictions
    const series = predictTideSeries(station, start, end, 6);
    const extremes = findExtremes(series);
    const currentHeight = predictTide(station, now);

    // Find the most recent and next extremes
    let prevExtreme = extremes[0];
    let nextExtreme = extremes[1];

    for (let i = 0; i < extremes.length - 1; i++) {
      const current = extremes[i];
      const next = extremes[i + 1];
      if (current && next && current.time <= now && next.time > now) {
        prevExtreme = current;
        nextExtreme = next;
        break;
      }
    }

    if (!prevExtreme || !nextExtreme) {
      return null;
    }

    // Calculate position in cycle (0-1)
    const cycleDuration = differenceInMinutes(nextExtreme.time, prevExtreme.time);
    const elapsedMinutes = differenceInMinutes(now, prevExtreme.time);
    const cyclePosition = elapsedMinutes / cycleDuration;

    // Determine if rising or falling
    const isRising = nextExtreme.type === 'high';

    // Calculate rate of change
    const lookAhead = addHours(now, 0.1);
    const futureHeight = predictTide(station, lookAhead);
    const ratePerHour = (futureHeight - currentHeight) * 10; // per hour

    return {
      currentHeight,
      prevExtreme,
      nextExtreme,
      cyclePosition,
      isRising,
      ratePerHour,
      cycleDuration,
    };
  }, [epoch, station]);

  if (!station || !tideState) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view tide clock
      </div>
    );
  }

  // Convert cycle position to angle (0 = top, clockwise)
  // Rising: 0-180° (right side), Falling: 180-360° (left side)
  let angle: number;
  if (tideState.isRising) {
    // Rising tide: 0° (low) to 180° (high)
    angle = tideState.cyclePosition * 180;
  } else {
    // Falling tide: 180° (high) to 360° (low)
    angle = 180 + tideState.cyclePosition * 180;
  }

  // Clock hand position
  const handAngle = (angle - 90) * (Math.PI / 180); // Adjust for CSS rotation
  const handLength = 35;
  const centerX = 50;
  const centerY = 50;
  const handX = centerX + Math.cos(handAngle) * handLength;
  const handY = centerY + Math.sin(handAngle) * handLength;

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>🕐</span>
        Tide Clock
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        Current position in tidal cycle at {station.name}
      </p>

      <div className="flex gap-4">
        {/* Clock face */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-700"
            />

            {/* Water level gradient (rising = blue, falling = cyan) */}
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>

            {/* Water fill based on current height relative to range */}
            <clipPath id="waterClip">
              <rect
                x="5"
                y={5 + (1 - (tideState.currentHeight / (tideState.nextExtreme.height - tideState.prevExtreme.height + 2) + 0.5)) * 90}
                width="90"
                height="90"
              />
            </clipPath>
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="url(#waterGradient)"
              clipPath="url(#waterClip)"
              opacity="0.5"
            />

            {/* Hour markers */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => {
              const tickAngle = ((hour * 30) - 90) * (Math.PI / 180);
              const innerR = 38;
              const outerR = 43;
              const x1 = 50 + Math.cos(tickAngle) * innerR;
              const y1 = 50 + Math.sin(tickAngle) * innerR;
              const x2 = 50 + Math.cos(tickAngle) * outerR;
              const y2 = 50 + Math.sin(tickAngle) * outerR;
              return (
                <line
                  key={hour}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={hour % 3 === 0 ? 2 : 1}
                  className="text-slate-500"
                />
              );
            })}

            {/* High/Low labels */}
            <text x="50" y="18" textAnchor="middle" className="text-[8px] fill-blue-400">HIGH</text>
            <text x="50" y="88" textAnchor="middle" className="text-[8px] fill-amber-400">LOW</text>
            <text x="12" y="52" textAnchor="middle" className="text-[7px] fill-slate-500">FALL</text>
            <text x="88" y="52" textAnchor="middle" className="text-[7px] fill-slate-500">RISE</text>

            {/* Clock hand */}
            <line
              x1={centerX}
              y1={centerY}
              x2={handX}
              y2={handY}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className={tideState.isRising ? 'text-cyan-400' : 'text-amber-400'}
            />

            {/* Center dot */}
            <circle cx="50" cy="50" r="4" className="fill-slate-300" />
          </svg>
        </div>

        {/* Current state info */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="text-center">
            <div className="text-2xl font-mono text-white">
              {formatHeight(tideState.currentHeight, unitSystem)}
            </div>
            <div className={`text-sm ${tideState.isRising ? 'text-cyan-400' : 'text-amber-400'}`}>
              {tideState.isRising ? '↑ Rising' : '↓ Falling'}
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Rate:</span>
              <span className={`font-mono ${tideState.ratePerHour > 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {tideState.ratePerHour > 0 ? '+' : ''}{formatHeight(tideState.ratePerHour, unitSystem)}/hr
              </span>
            </div>
            <div className="flex justify-between">
              <span>Next {tideState.nextExtreme.type}:</span>
              <span className="text-white">{format(tideState.nextExtreme.time, 'h:mm a')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{tideState.prevExtreme.type === 'high' ? '▲ High' : '▼ Low'}</span>
          <span>{Math.round(tideState.cyclePosition * 100)}% through cycle</span>
          <span>{tideState.nextExtreme.type === 'high' ? '▲ High' : '▼ Low'}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              tideState.isRising
                ? 'bg-gradient-to-r from-amber-500 to-cyan-500'
                : 'bg-gradient-to-r from-cyan-500 to-amber-500'
            }`}
            style={{ width: `${tideState.cyclePosition * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{format(tideState.prevExtreme.time, 'h:mm a')}</span>
          <span>~{Math.round(tideState.cycleDuration / 60)}h {tideState.cycleDuration % 60}m cycle</span>
          <span>{format(tideState.nextExtreme.time, 'h:mm a')}</span>
        </div>
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">About tide clocks:</strong>
        <p className="mt-1">
          Traditional tide clocks assume a regular 12h 25m cycle. This digital version
          tracks actual harmonic predictions, accounting for diurnal inequality and
          station-specific timing.
        </p>
      </div>
    </div>
  );
}
