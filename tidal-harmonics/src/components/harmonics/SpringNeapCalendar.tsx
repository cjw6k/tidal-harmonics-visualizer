import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { getSpringNeapIndicator, getTidalRange } from '@/lib/harmonics';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';

interface DayData {
  date: Date;
  dayOfMonth: number;
  springNeapIndicator: number; // -1 to 1 (spring to neap)
  range: number;
  isToday: boolean;
  lunarPhase: 'new' | 'firstQuarter' | 'full' | 'lastQuarter' | null;
}

const LUNAR_PHASE_ICONS: Record<string, string> = {
  new: '🌑',
  firstQuarter: '🌓',
  full: '🌕',
  lastQuarter: '🌗',
};

/**
 * SpringNeapCalendar
 *
 * A monthly calendar showing when spring and neap tides occur.
 * Color-coded from red (spring) through yellow to blue (neap).
 * Helps users visualize the ~14-day spring-neap cycle.
 */
export function SpringNeapCalendar() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);

  const calendarData = useMemo(() => {
    const today = startOfDay(new Date(epoch));
    const days: DayData[] = [];

    // Generate 28 days starting from today
    for (let i = 0; i < 28; i++) {
      const date = addDays(today, i);
      const indicator = getSpringNeapIndicator(date);

      // Calculate tidal range for this day
      const range = station ? getTidalRange(station, date) : null;
      const tidalRange = range ? range.maxHeight - range.minHeight : 0;

      // Determine lunar phase (approximate)
      // New moon and full moon ≈ spring tides (indicator near 1)
      // Quarter moons ≈ neap tides (indicator near -1)
      let lunarPhase: DayData['lunarPhase'] = null;

      // Simple approximation: check if we're at a peak or trough
      if (i > 0 && i < 27) {
        const prevIndicator = getSpringNeapIndicator(addDays(today, i - 1));
        const nextIndicator = getSpringNeapIndicator(addDays(today, i + 1));

        if (indicator >= prevIndicator && indicator >= nextIndicator && indicator > 0.9) {
          // Peak spring tide - likely new or full moon
          const dayInCycle = Math.round((date.getTime() / 86400000) % 29.53);
          lunarPhase = dayInCycle < 15 ? 'new' : 'full';
        } else if (indicator <= prevIndicator && indicator <= nextIndicator && indicator < -0.9) {
          // Trough neap tide - likely quarter moon
          const dayInCycle = Math.round((date.getTime() / 86400000) % 29.53);
          lunarPhase = dayInCycle < 15 ? 'firstQuarter' : 'lastQuarter';
        }
      }

      days.push({
        date,
        dayOfMonth: date.getDate(),
        springNeapIndicator: indicator,
        range: tidalRange,
        isToday: isSameDay(date, today),
        lunarPhase,
      });
    }

    return days;
  }, [epoch, station]);

  const getColorForIndicator = (indicator: number): string => {
    // Spring (1) = red, Neap (-1) = blue, middle = yellow
    if (indicator > 0) {
      // Red to yellow
      const r = 255;
      const g = Math.round(200 * (1 - indicator));
      const b = Math.round(100 * (1 - indicator));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to blue
      const r = Math.round(200 * (1 + indicator));
      const g = Math.round(200 * (1 + indicator));
      const b = Math.round(100 + 155 * (-indicator));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view spring/neap calendar
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2">Spring-Neap Calendar</h3>

      <p className="text-slate-400 text-xs mb-3">
        28-day outlook: red = spring tides (larger), blue = neap tides (smaller)
      </p>

      {/* Calendar grid - 4 weeks x 7 days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] text-slate-500 py-1">
            {day}
          </div>
        ))}

        {/* Offset for first day of display */}
        {Array.from({ length: calendarData[0]?.date.getDay() ?? 0 }).map((_, i) => (
          <div key={`offset-${i}`} />
        ))}

        {/* Calendar days */}
        {calendarData.map((day, i) => (
          <div
            key={i}
            className={`relative p-1 rounded text-center transition-all ${
              day.isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''
            }`}
            style={{
              backgroundColor: getColorForIndicator(day.springNeapIndicator),
              opacity: 0.8 + (Math.abs(day.springNeapIndicator) * 0.2),
            }}
            title={`${format(day.date, 'MMM d')}: Range ${day.range.toFixed(2)}m`}
          >
            <div className="text-[10px] text-slate-900 font-medium">{day.dayOfMonth}</div>
            {day.lunarPhase && (
              <div className="text-[10px] absolute -top-1 -right-1">
                {LUNAR_PHASE_ICONS[day.lunarPhase]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(255, 100, 50)' }} />
          <span className="text-slate-400">Spring</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(200, 200, 100)' }} />
          <span className="text-slate-400">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(50, 50, 200)' }} />
          <span className="text-slate-400">Neap</span>
        </div>
      </div>

      {/* Upcoming notable tides */}
      <div className="mt-3 space-y-1">
        <h4 className="text-xs text-slate-500">Upcoming Events</h4>
        {calendarData
          .filter((d) => d.lunarPhase)
          .slice(0, 4)
          .map((day, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span>{day.lunarPhase ? LUNAR_PHASE_ICONS[day.lunarPhase] : ''}</span>
                <span className="text-white">{format(day.date, 'MMM d')}</span>
                <span className="text-slate-500">
                  {day.springNeapIndicator > 0 ? 'Spring tide' : 'Neap tide'}
                </span>
              </div>
              <span className="text-slate-400">{day.range.toFixed(2)}m range</span>
            </div>
          ))}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">The ~14-day cycle:</strong>
        <p className="mt-1">
          Spring tides occur at new and full moons when Sun and Moon align.
          Neap tides occur at quarter moons when they're at right angles.
          The cycle repeats every ~14.8 days (half a synodic month).
        </p>
      </div>
    </div>
  );
}
