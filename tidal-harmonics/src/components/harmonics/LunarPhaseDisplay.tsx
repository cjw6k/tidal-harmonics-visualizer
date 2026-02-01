import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { getLunarPhase } from '@/lib/harmonics';

interface PhaseInfo {
  name: string;
  emoji: string;
  tidalEffect: string;
  description: string;
}

const PHASE_INFO: Record<string, PhaseInfo> = {
  new: {
    name: 'New Moon',
    emoji: '🌑',
    tidalEffect: 'Spring Tide',
    description: 'Sun and Moon aligned on same side of Earth. Strongest gravitational pull creates highest high tides and lowest low tides.',
  },
  waxingCrescent: {
    name: 'Waxing Crescent',
    emoji: '🌒',
    tidalEffect: 'Moderate',
    description: 'Moon moves out of alignment with Sun. Tidal range decreasing toward neap tides.',
  },
  firstQuarter: {
    name: 'First Quarter',
    emoji: '🌓',
    tidalEffect: 'Neap Tide',
    description: 'Moon at 90° to Sun. Gravitational forces partially cancel, creating smallest tidal range.',
  },
  waxingGibbous: {
    name: 'Waxing Gibbous',
    emoji: '🌔',
    tidalEffect: 'Moderate',
    description: 'Approaching full moon. Tidal range increasing toward spring tides.',
  },
  full: {
    name: 'Full Moon',
    emoji: '🌕',
    tidalEffect: 'Spring Tide',
    description: 'Sun and Moon on opposite sides of Earth. Combined pull creates high high tides and low low tides.',
  },
  waningGibbous: {
    name: 'Waning Gibbous',
    emoji: '🌖',
    tidalEffect: 'Moderate',
    description: 'Moon moving toward third quarter. Tidal range decreasing.',
  },
  lastQuarter: {
    name: 'Last Quarter',
    emoji: '🌗',
    tidalEffect: 'Neap Tide',
    description: 'Moon at 90° to Sun. Minimal tidal range due to perpendicular gravitational forces.',
  },
  waningCrescent: {
    name: 'Waning Crescent',
    emoji: '🌘',
    tidalEffect: 'Moderate',
    description: 'Approaching new moon. Tidal range building toward spring tides.',
  },
};

function getPhaseName(phase: number): string {
  // Phase is 0-1, where 0 = new moon, 0.5 = full moon
  if (phase < 0.0625) return 'new';
  if (phase < 0.1875) return 'waxingCrescent';
  if (phase < 0.3125) return 'firstQuarter';
  if (phase < 0.4375) return 'waxingGibbous';
  if (phase < 0.5625) return 'full';
  if (phase < 0.6875) return 'waningGibbous';
  if (phase < 0.8125) return 'lastQuarter';
  if (phase < 0.9375) return 'waningCrescent';
  return 'new';
}

// Calculate illumination percentage from phase
function getIllumination(phase: number): number {
  // Illumination varies from 0% (new) to 100% (full) and back
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}

// Calculate days until next spring/neap tide
function getDaysUntilSpringNeap(phase: number): { spring: number; neap: number } {
  // Spring tides occur at new (0) and full (0.5)
  // Neap tides occur at quarters (0.25, 0.75)
  const lunarCycle = 29.53; // days

  // Distance to nearest spring tide (0 or 0.5)
  const distToNew = phase;
  const distToFull = Math.abs(phase - 0.5);
  const springDays = Math.min(distToNew, distToFull, 1 - distToNew) * lunarCycle;

  // Distance to nearest neap tide (0.25 or 0.75)
  const distToFirst = Math.abs(phase - 0.25);
  const distToLast = Math.abs(phase - 0.75);
  const neapDays = Math.min(distToFirst, distToLast) * lunarCycle;

  return { spring: Math.round(springDays * 10) / 10, neap: Math.round(neapDays * 10) / 10 };
}

export function LunarPhaseDisplay() {
  const epoch = useTimeStore((s) => s.epoch);

  const lunarData = useMemo(() => {
    const date = new Date(epoch);
    const phase = getLunarPhase(date);
    const phaseName = getPhaseName(phase);
    const info = PHASE_INFO[phaseName];
    const illumination = getIllumination(phase);
    const { spring, neap } = getDaysUntilSpringNeap(phase);

    return { phase, phaseName, info, illumination, spring, neap };
  }, [epoch]);

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-3 text-xs shadow-lg border border-slate-700 max-w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100">Lunar Phase</h3>
        <span className="text-slate-400">{lunarData.info?.name}</span>
      </div>

      {/* Moon visualization */}
      <div className="flex items-center gap-4 mb-4">
        {/* Large moon emoji */}
        <div className="text-5xl">{lunarData.info?.emoji}</div>

        {/* Phase details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              lunarData.info?.tidalEffect === 'Spring Tide'
                ? 'bg-blue-600 text-white'
                : lunarData.info?.tidalEffect === 'Neap Tide'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-600 text-slate-200'
            }`}>
              {lunarData.info?.tidalEffect}
            </span>
          </div>
          <div className="text-slate-300 text-sm mb-1">
            {lunarData.illumination}% illuminated
          </div>
          <div className="text-slate-500 text-[10px]">
            Cycle: {Math.round(lunarData.phase * 100)}%
          </div>
        </div>
      </div>

      {/* Lunar cycle bar */}
      <div className="mb-4">
        <div className="text-slate-400 text-[10px] mb-1">Lunar Cycle Position</div>
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
          {/* Phase markers */}
          <div className="absolute inset-0 flex justify-between px-1">
            <span className="text-[10px]" title="New Moon">🌑</span>
            <span className="text-[10px]" title="First Quarter">🌓</span>
            <span className="text-[10px]" title="Full Moon">🌕</span>
            <span className="text-[10px]" title="Last Quarter">🌗</span>
            <span className="text-[10px]" title="New Moon">🌑</span>
          </div>
          {/* Current position marker */}
          <div
            className="absolute top-0 w-1 h-full bg-blue-400 shadow-lg"
            style={{ left: `${lunarData.phase * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-slate-500 text-[10px] mt-1">
          <span>New</span>
          <span>1st Qtr</span>
          <span>Full</span>
          <span>3rd Qtr</span>
          <span>New</span>
        </div>
      </div>

      {/* Time to next events */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-blue-900/30 rounded p-2">
          <div className="text-blue-400 text-[10px] mb-0.5">Next Spring Tide</div>
          <div className="text-slate-200 font-medium">
            {lunarData.spring < 1 ? 'Today!' : `~${lunarData.spring} days`}
          </div>
          <div className="text-slate-500 text-[10px]">Maximum range</div>
        </div>
        <div className="bg-amber-900/30 rounded p-2">
          <div className="text-amber-400 text-[10px] mb-0.5">Next Neap Tide</div>
          <div className="text-slate-200 font-medium">
            {lunarData.neap < 1 ? 'Today!' : `~${lunarData.neap} days`}
          </div>
          <div className="text-slate-500 text-[10px]">Minimum range</div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-slate-800/50 rounded p-2 text-slate-400 text-[10px]">
        {lunarData.info?.description}
      </div>

      {/* Educational footer */}
      <div className="mt-3 pt-2 border-t border-slate-700 text-slate-500 text-[10px]">
        <p>
          <strong className="text-blue-400">Spring tides</strong> (~20% larger range) occur at new and full moons.{' '}
          <strong className="text-amber-400">Neap tides</strong> (~20% smaller range) occur at quarter moons.
          The Moon's gravitational influence is the primary driver of tides.
        </p>
      </div>
    </div>
  );
}
