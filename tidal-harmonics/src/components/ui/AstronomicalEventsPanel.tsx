import { useMemo, useState } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { getUpcomingTidalEvents } from '@/lib/ephemeris';
import type { AstronomicalEvent } from '@/lib/ephemeris';
import { format, formatDistanceToNow } from 'date-fns';

const EVENT_ICONS: Record<AstronomicalEvent['type'], string> = {
  new_moon: '🌑',
  full_moon: '🌕',
  first_quarter: '🌓',
  third_quarter: '🌗',
  perigee: '🔵',
  apogee: '⚪',
  equinox: '🌍',
  solstice: '☀️',
};

const EVENT_COLORS: Record<AstronomicalEvent['type'], string> = {
  new_moon: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  full_moon: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  first_quarter: 'bg-slate-600/20 text-slate-400 border-slate-500/30',
  third_quarter: 'bg-slate-600/20 text-slate-400 border-slate-500/30',
  perigee: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  apogee: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  equinox: 'bg-green-500/20 text-green-400 border-green-500/30',
  solstice: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

/**
 * AstronomicalEventsPanel
 *
 * Shows upcoming astronomical events relevant to tidal prediction:
 * - Moon phases (spring/neap cycle)
 * - Lunar perigee/apogee (distance effects)
 * - Equinoxes/solstices (declination effects)
 */
export function AstronomicalEventsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const epoch = useTimeStore((s) => s.epoch);

  const events = useMemo(() => {
    const date = new Date(epoch);
    return getUpcomingTidalEvents(date);
  }, [epoch]);

  // Group into categories for display
  const phases = events.filter(e => ['new_moon', 'full_moon', 'first_quarter', 'third_quarter'].includes(e.type));
  const apsis = events.filter(e => ['perigee', 'apogee'].includes(e.type));
  const seasons = events.filter(e => ['equinox', 'solstice'].includes(e.type));

  if (!isExpanded) {
    // Compact view - show next 2 events
    const next2 = events.slice(0, 2);
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-left w-full hover:bg-slate-700/80 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Upcoming Events</span>
          <span className="text-xs text-slate-500">tap to expand</span>
        </div>
        <div className="flex gap-3">
          {next2.map((event, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-lg">{EVENT_ICONS[event.type]}</span>
              <div>
                <div className="text-white text-sm">{event.label}</div>
                <div className="text-slate-500 text-xs">
                  {formatDistanceToNow(event.date, { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">Astronomical Events Calendar</span>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-slate-500 hover:text-slate-300 px-2"
        >
          collapse
        </button>
      </div>

      {/* Moon Phases */}
      <div className="mb-3">
        <h4 className="text-xs text-cyan-400 mb-1 font-medium">Moon Phases (Spring/Neap)</h4>
        <div className="space-y-1">
          {phases.slice(0, 4).map((event, i) => (
            <EventRow key={i} event={event} />
          ))}
        </div>
      </div>

      {/* Lunar Distance */}
      <div className="mb-3">
        <h4 className="text-xs text-blue-400 mb-1 font-medium">Lunar Distance</h4>
        <div className="space-y-1">
          {apsis.slice(0, 2).map((event, i) => (
            <EventRow key={i} event={event} />
          ))}
        </div>
      </div>

      {/* Seasons */}
      {seasons.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs text-green-400 mb-1 font-medium">Seasonal</h4>
          <div className="space-y-1">
            {seasons.slice(0, 1).map((event, i) => (
              <EventRow key={i} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="pt-2 border-t border-slate-700 text-xs text-slate-500">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>🌑🌕 Spring tide</span>
          <span>🌓🌗 Neap tide</span>
          <span>🔵 Stronger tides</span>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: AstronomicalEvent }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`w-full flex items-center gap-2 p-1.5 rounded border ${EVENT_COLORS[event.type]} hover:opacity-90 transition-opacity`}
      >
        <span className="text-base">{EVENT_ICONS[event.type]}</span>
        <div className="flex-1 text-left">
          <span className="text-sm text-white">{event.label}</span>
        </div>
        <div className="text-right">
          <div className="text-xs">{format(event.date, 'MMM d')}</div>
          <div className="text-xs opacity-60">{format(event.date, 'HH:mm')}</div>
        </div>
      </button>

      {showDetails && (
        <div className="mt-1 ml-7 p-2 bg-slate-700/50 rounded text-xs">
          <p className="text-slate-300 mb-1">{event.description}</p>
          <p className="text-slate-400">
            <strong>Tidal effect:</strong> {event.tidalSignificance}
          </p>
          <p className="text-slate-500 mt-1">
            {formatDistanceToNow(event.date, { addSuffix: true })}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline version for the control panel
 */
export function AstronomicalEventsCompact() {
  const epoch = useTimeStore((s) => s.epoch);

  const nextEvent = useMemo(() => {
    const date = new Date(epoch);
    const events = getUpcomingTidalEvents(date);
    return events[0] || null;
  }, [epoch]);

  if (!nextEvent) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span>{EVENT_ICONS[nextEvent.type]}</span>
      <span className="text-slate-400">{nextEvent.label}</span>
      <span className="text-slate-500">
        {formatDistanceToNow(nextEvent.date, { addSuffix: true })}
      </span>
    </div>
  );
}
