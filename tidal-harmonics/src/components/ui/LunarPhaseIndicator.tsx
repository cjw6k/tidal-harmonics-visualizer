import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { getSpringNeapIndicator, getLunarPhase } from '@/lib/harmonics';

/**
 * Lunar Phase and Spring/Neap Indicator
 *
 * Shows the current lunar phase and whether we're in spring or neap tide conditions.
 * Spring tides occur at new and full Moon (M2 and S2 in phase).
 * Neap tides occur at quarter Moons (M2 and S2 out of phase).
 */
export function LunarPhaseIndicator() {
  const epoch = useTimeStore((s) => s.epoch);

  const { springNeap, phaseLabel, phaseName } = useMemo(() => {
    const date = new Date(epoch);
    const phase = getLunarPhase(date);
    const indicator = getSpringNeapIndicator(date);

    // Determine phase name
    let name: string;
    let label: string;

    if (phase < 0.0625 || phase >= 0.9375) {
      name = 'New Moon';
      label = '🌑';
    } else if (phase < 0.1875) {
      name = 'Waxing Crescent';
      label = '🌒';
    } else if (phase < 0.3125) {
      name = 'First Quarter';
      label = '🌓';
    } else if (phase < 0.4375) {
      name = 'Waxing Gibbous';
      label = '🌔';
    } else if (phase < 0.5625) {
      name = 'Full Moon';
      label = '🌕';
    } else if (phase < 0.6875) {
      name = 'Waning Gibbous';
      label = '🌖';
    } else if (phase < 0.8125) {
      name = 'Last Quarter';
      label = '🌗';
    } else {
      name = 'Waning Crescent';
      label = '🌘';
    }

    return {
      springNeap: indicator,
      phaseLabel: label,
      phaseName: name,
    };
  }, [epoch]);

  // Spring/neap tide condition
  const isSpring = springNeap > 0.5;
  const isNeap = springNeap < -0.5;
  const tideCondition = isSpring ? 'Spring Tide' : isNeap ? 'Neap Tide' : 'Transition';

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <div className="flex items-center gap-3">
        {/* Moon phase visual */}
        <div className="text-3xl" title={phaseName}>
          {phaseLabel}
        </div>

        <div className="flex-1">
          {/* Phase name */}
          <div className="text-sm text-white">{phaseName}</div>

          {/* Spring/Neap indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              {/* Gradient bar from neap (left) to spring (right) */}
              <div
                className="h-full bg-gradient-to-r from-slate-500 via-blue-500 to-cyan-400"
                style={{
                  width: `${((springNeap + 1) / 2) * 100}%`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <span
              className={`text-xs font-medium ${
                isSpring ? 'text-cyan-400' : isNeap ? 'text-slate-400' : 'text-blue-400'
              }`}
            >
              {tideCondition}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation text */}
      <div className="mt-2 text-xs text-slate-500">
        {isSpring && (
          <span>M2 and S2 aligned — maximum tidal range</span>
        )}
        {isNeap && (
          <span>M2 and S2 at 90° — minimum tidal range</span>
        )}
        {!isSpring && !isNeap && (
          <span>Transitioning between spring and neap</span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for embedding in other panels
 */
export function LunarPhaseCompact() {
  const epoch = useTimeStore((s) => s.epoch);

  const { phaseLabel, springNeap } = useMemo(() => {
    const date = new Date(epoch);
    const phase = getLunarPhase(date);
    const indicator = getSpringNeapIndicator(date);

    let label: string;
    if (phase < 0.0625 || phase >= 0.9375) label = '🌑';
    else if (phase < 0.1875) label = '🌒';
    else if (phase < 0.3125) label = '🌓';
    else if (phase < 0.4375) label = '🌔';
    else if (phase < 0.5625) label = '🌕';
    else if (phase < 0.6875) label = '🌖';
    else if (phase < 0.8125) label = '🌗';
    else label = '🌘';

    return { phaseLabel: label, springNeap: indicator };
  }, [epoch]);

  const isSpring = springNeap > 0.5;
  const isNeap = springNeap < -0.5;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-lg">{phaseLabel}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded ${
          isSpring
            ? 'bg-cyan-500/20 text-cyan-400'
            : isNeap
            ? 'bg-slate-600/50 text-slate-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}
      >
        {isSpring ? 'Spring' : isNeap ? 'Neap' : 'Trans'}
      </span>
    </div>
  );
}
