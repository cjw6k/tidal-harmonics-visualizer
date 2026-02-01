import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { findNextMoonPhases, findNextLunarApsis } from '@/lib/ephemeris';
import { getTidalRange } from '@/lib/harmonics';
import { format, differenceInHours } from 'date-fns';

interface KingTideEvent {
  type: 'king_tide' | 'high_spring' | 'normal_spring';
  date: Date;
  phase: string;
  perigeeDate: Date | null;
  daysBetween: number;
  predictedRange: { min: number; max: number } | null;
  description: string;
}

/**
 * KingTidePredictor
 *
 * Identifies upcoming "King Tides" - unusually high tides that occur when:
 * 1. Moon is at new or full phase (spring tide)
 * 2. Moon is near perigee (closest approach)
 *
 * When these coincide within ~2 days, tidal range can be 20-30% higher than normal.
 * The term "king tide" is informal but commonly used in coastal communities.
 */
export function KingTidePredictor() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);

  const { events, nextKingTide } = useMemo(() => {
    const now = new Date(epoch);

    // Find upcoming spring tides (new and full moon)
    const phases = findNextMoonPhases(now, 8);
    const springPhases = phases.filter(
      (p) => p.type === 'new_moon' || p.type === 'full_moon'
    );

    // Find upcoming perigees
    const apses = findNextLunarApsis(now, 6);
    const perigees = apses.filter((a) => a.type === 'perigee');

    // Analyze each spring tide
    const kingTideEvents: KingTideEvent[] = [];

    for (const spring of springPhases.slice(0, 4)) {
      // Find nearest perigee
      let nearestPerigee: (typeof perigees)[0] | null = null;
      let minDays = Infinity;

      for (const perigee of perigees) {
        const days = Math.abs(differenceInHours(spring.date, perigee.date) / 24);
        if (days < minDays) {
          minDays = days;
          nearestPerigee = perigee;
        }
      }

      // Calculate predicted range if station selected
      let predictedRange: { min: number; max: number } | null = null;
      if (station) {
        const range = getTidalRange(station, spring.date);
        predictedRange = { min: range.minHeight, max: range.maxHeight };
      }

      // Classify the event
      let eventType: KingTideEvent['type'];
      let description: string;

      if (minDays <= 1.5) {
        eventType = 'king_tide';
        description = `Perigean spring tide - Moon at ${spring.label.toLowerCase()} and near closest approach. Expect exceptionally high tides.`;
      } else if (minDays <= 4) {
        eventType = 'high_spring';
        description = `Strong spring tide - ${spring.label.toLowerCase()} occurs ${Math.round(minDays)} days from perigee.`;
      } else {
        eventType = 'normal_spring';
        description = `Normal spring tide - ${spring.label.toLowerCase()}, perigee ${Math.round(minDays)} days away.`;
      }

      kingTideEvents.push({
        type: eventType,
        date: spring.date,
        phase: spring.label,
        perigeeDate: nearestPerigee?.date || null,
        daysBetween: minDays,
        predictedRange,
        description,
      });
    }

    const nextKing = kingTideEvents.find((e) => e.type === 'king_tide');

    return { events: kingTideEvents, nextKingTide: nextKing || null };
  }, [epoch, station]);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <h3 className="text-white font-medium text-sm mb-2">King Tide Predictor</h3>

      {/* Explanation */}
      <p className="text-slate-400 text-xs mb-3">
        King tides occur when spring tides (new/full Moon) coincide with lunar perigee
        (closest approach). Tidal range can increase 20-30%.
      </p>

      {/* Next King Tide Alert */}
      {nextKingTide && (
        <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👑</span>
            <span className="text-amber-400 font-medium text-sm">Next King Tide</span>
          </div>
          <div className="text-white text-sm">{format(nextKingTide.date, 'MMMM d, yyyy')}</div>
          <div className="text-slate-400 text-xs mt-1">
            {nextKingTide.phase} • Perigee within {nextKingTide.daysBetween.toFixed(1)} days
          </div>
          {nextKingTide.predictedRange && (
            <div className="text-xs text-slate-500 mt-1">
              Est. range: {nextKingTide.predictedRange.min.toFixed(2)}m to{' '}
              {nextKingTide.predictedRange.max.toFixed(2)}m
            </div>
          )}
        </div>
      )}

      {/* Upcoming Spring Tides */}
      <div className="space-y-2">
        <h4 className="text-xs text-slate-500">Upcoming Spring Tides</h4>
        {events.map((event, i) => (
          <div
            key={i}
            className={`p-2 rounded border ${
              event.type === 'king_tide'
                ? 'bg-amber-500/10 border-amber-500/30'
                : event.type === 'high_spring'
                ? 'bg-cyan-500/10 border-cyan-500/30'
                : 'bg-slate-700/30 border-slate-600/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>
                  {event.type === 'king_tide' ? '👑' : event.phase === 'Full Moon' ? '🌕' : '🌑'}
                </span>
                <div>
                  <div className="text-white text-sm">{event.phase}</div>
                  <div className="text-slate-500 text-xs">
                    {format(event.date, 'MMM d')} • Perigee: {event.daysBetween.toFixed(1)}d away
                  </div>
                </div>
              </div>
              <div
                className={`text-xs px-1.5 py-0.5 rounded ${
                  event.type === 'king_tide'
                    ? 'bg-amber-500/20 text-amber-400'
                    : event.type === 'high_spring'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-600/20 text-slate-400'
                }`}
              >
                {event.type === 'king_tide' ? 'King' : event.type === 'high_spring' ? 'High' : 'Normal'}
              </div>
            </div>
            {event.predictedRange && (
              <div className="mt-1 text-xs text-slate-500">
                Range: {(event.predictedRange.max - event.predictedRange.min).toFixed(2)}m
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-700/30 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Why "King Tide"?</strong>
        <p className="mt-1">
          This informal term gained popularity in coastal communities to describe the year's
          highest tides. Scientifically, they're "perigean spring tides." They're predictable
          but can cause unexpected flooding when combined with storm surge.
        </p>
      </div>
    </div>
  );
}
