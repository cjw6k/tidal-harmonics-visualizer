import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface DayInfo {
  date: Date;
  moonPhase: number; // 0-1 (0=new, 0.5=full)
  tideRange: number;
  isSpring: boolean;
  highTide: number;
  lowTide: number;
}

interface MoonPhaseCalendarProps {
  onClose: () => void;
}

// Get moon phase (simplified lunation calculation)
function getMoonPhase(date: Date): number {
  // Known new moon: Jan 6, 2000 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const lunarCycle = 29.53058867 * 24 * 60 * 60 * 1000; // ms

  const diff = date.getTime() - knownNewMoon;
  const phase = (diff % lunarCycle) / lunarCycle;
  return phase < 0 ? phase + 1 : phase;
}

// Get moon phase emoji
function getMoonEmoji(phase: number): string {
  if (phase < 0.0625) return '🌑'; // New
  if (phase < 0.1875) return '🌒'; // Waxing crescent
  if (phase < 0.3125) return '🌓'; // First quarter
  if (phase < 0.4375) return '🌔'; // Waxing gibbous
  if (phase < 0.5625) return '🌕'; // Full
  if (phase < 0.6875) return '🌖'; // Waning gibbous
  if (phase < 0.8125) return '🌗'; // Last quarter
  if (phase < 0.9375) return '🌘'; // Waning crescent
  return '🌑'; // New
}

// Get moon phase name
function getMoonPhaseName(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  return 'Waning Crescent';
}

export function MoonPhaseCalendar({ onClose }: MoonPhaseCalendarProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [monthOffset, setMonthOffset] = useState(0);

  const calendarData = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: DayInfo[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 12, 0, 0); // Noon local
      const moonPhase = getMoonPhase(date);

      // Calculate high and low tides for this day
      let maxTide = -Infinity;
      let minTide = Infinity;

      if (station) {
        for (let hour = 0; hour < 24; hour++) {
          const checkTime = new Date(year, month, day, hour, 0, 0);
          const height = predictTide(station, checkTime);
          maxTide = Math.max(maxTide, height);
          minTide = Math.min(minTide, height);
        }
      } else {
        maxTide = 0;
        minTide = 0;
      }

      const tideRange = maxTide - minTide;

      // Spring tides occur around new and full moons (within ~2 days)
      const isNearNewOrFull = moonPhase < 0.08 || moonPhase > 0.92 ||
                               (moonPhase > 0.42 && moonPhase < 0.58);

      days.push({
        date,
        moonPhase,
        tideRange,
        isSpring: isNearNewOrFull,
        highTide: maxTide,
        lowTide: minTide
      });
    }

    return {
      year,
      month,
      monthName: targetMonth.toLocaleString('default', { month: 'long' }),
      startDayOfWeek,
      days
    };
  }, [monthOffset, station]);

  const maxRange = Math.max(...calendarData.days.map(d => d.tideRange));
  const minRange = Math.min(...calendarData.days.map(d => d.tideRange));

  // Find special moon dates
  const specialDates = calendarData.days.filter(d => {
    const phase = d.moonPhase;
    return phase < 0.02 || phase > 0.98 || // New moon
           (phase > 0.48 && phase < 0.52) || // Full moon
           (phase > 0.23 && phase < 0.27) || // First quarter
           (phase > 0.73 && phase < 0.77);   // Last quarter
  });

  const formatHeight = (h: number) => {
    if (unitSystem === 'metric') {
      return `${h.toFixed(1)}m`;
    }
    return `${(h * 3.281).toFixed(1)}ft`;
  };

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Moon Phase & Tide Calendar</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Explanation */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Moon-Tide Connection</h3>
            <p className="text-slate-400 text-sm">
              <span className="text-amber-400 font-medium">Spring tides</span> (highest range) occur
              1-2 days after new and full moons when Sun and Moon align.{' '}
              <span className="text-cyan-400 font-medium">Neap tides</span> (lowest range) occur
              after quarter moons when Sun and Moon are at right angles.
            </p>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthOffset(monthOffset - 1)}
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 text-white"
            >
              ← Prev
            </button>
            <div className="text-center">
              <span className="text-xl font-bold text-white">
                {calendarData.monthName} {calendarData.year}
              </span>
              {monthOffset !== 0 && (
                <button
                  onClick={() => setMonthOffset(0)}
                  className="ml-2 text-xs text-slate-400 hover:text-white"
                >
                  (today)
                </button>
              )}
            </div>
            <button
              onClick={() => setMonthOffset(monthOffset + 1)}
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 text-white"
            >
              Next →
            </button>
          </div>

          {/* Calendar grid */}
          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-slate-500 font-medium py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for start of month */}
              {Array.from({ length: calendarData.startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Actual days */}
              {calendarData.days.map((day) => {
                const rangePercent = ((day.tideRange - minRange) / (maxRange - minRange)) * 100;
                const bgColor = day.isSpring
                  ? `rgba(245, 158, 11, ${0.1 + rangePercent / 200})` // Amber for spring
                  : `rgba(34, 211, 238, ${0.1 + (100 - rangePercent) / 200})`; // Cyan for neap

                return (
                  <div
                    key={day.date.getDate()}
                    className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center text-center relative transition-colors
                      ${isToday(day.date) ? 'ring-2 ring-blue-500' : ''}
                    `}
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="text-lg leading-none" title={getMoonPhaseName(day.moonPhase)}>
                      {getMoonEmoji(day.moonPhase)}
                    </span>
                    <span className={`text-sm font-medium ${isToday(day.date) ? 'text-blue-400' : 'text-white'}`}>
                      {day.date.getDate()}
                    </span>
                    <span className={`text-[10px] ${day.isSpring ? 'text-amber-300' : 'text-cyan-300'}`}>
                      {formatHeight(day.tideRange)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/30" />
              <span className="text-slate-300">Spring tides (higher range)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500/30" />
              <span className="text-slate-300">Neap tides (lower range)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-blue-500" />
              <span className="text-slate-300">Today</span>
            </div>
          </div>

          {/* Key moon phases this month */}
          {specialDates.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-400 mb-2">Key Moon Phases</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {specialDates.slice(0, 4).map((day) => (
                  <div key={day.date.getTime()} className="bg-slate-800 rounded p-2 text-center">
                    <span className="text-2xl">{getMoonEmoji(day.moonPhase)}</span>
                    <div className="text-xs text-slate-400">{getMoonPhaseName(day.moonPhase)}</div>
                    <div className="text-sm text-white font-medium">
                      {day.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={`text-xs ${day.isSpring ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {day.isSpring ? 'Spring tide' : 'Neap tide'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
