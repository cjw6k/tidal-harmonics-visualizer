import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { findExtremes, predictTideSeries } from '@/lib/harmonics';

interface CoefficientLevel {
  min: number;
  max: number;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const COEFFICIENT_LEVELS: CoefficientLevel[] = [
  { min: 20, max: 44, label: 'Very Weak', description: 'Minimal tidal range, calm conditions', color: 'text-green-400', bgColor: 'bg-green-900/30' },
  { min: 45, max: 69, label: 'Weak', description: 'Below average tidal range', color: 'text-lime-400', bgColor: 'bg-lime-900/30' },
  { min: 70, max: 94, label: 'Average', description: 'Typical tidal conditions', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
  { min: 95, max: 109, label: 'Strong', description: 'Above average tidal range', color: 'text-orange-400', bgColor: 'bg-orange-900/30' },
  { min: 110, max: 120, label: 'Very Strong', description: 'Exceptional tides, caution advised', color: 'text-red-400', bgColor: 'bg-red-900/30' },
];

const DEFAULT_LEVEL: CoefficientLevel = COEFFICIENT_LEVELS[2]!;

function getLevel(coefficient: number): CoefficientLevel {
  const level = COEFFICIENT_LEVELS.find(l => coefficient >= l.min && coefficient <= l.max);
  return level ?? DEFAULT_LEVEL;
}

// Reference values for coefficient calculation (Brest, France standard)
const MEAN_RANGE = 3.2; // meters (average tidal range at reference)

export function TidalCoefficients() {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);

  const coefficientData = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date(epoch);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Get tide series for today
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const series = predictTideSeries(selectedStation, startOfDay, endOfDay, 10);
    const extremes = findExtremes(series);

    // Calculate today's tidal range
    if (extremes.length < 2) return null;

    const highs = extremes.filter(e => e.type === 'high').map(e => e.height);
    const lows = extremes.filter(e => e.type === 'low').map(e => e.height);

    if (highs.length === 0 || lows.length === 0) return null;

    const maxHigh = Math.max(...highs);
    const minLow = Math.min(...lows);
    const range = maxHigh - minLow;

    // Calculate coefficient (French system: 20-120 scale)
    // Coefficient = (range / mean_range) * 70 (where 70 is the mean coefficient)
    // Normalized to 20-120 scale
    const rawCoefficient = (range / MEAN_RANGE) * 70;
    const coefficient = Math.min(120, Math.max(20, Math.round(rawCoefficient)));

    // Calculate coefficients for next 7 days
    const forecast: { date: Date; coefficient: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dayStart = new Date(startOfDay);
      dayStart.setDate(dayStart.getDate() + d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySeries = predictTideSeries(selectedStation, dayStart, dayEnd, 30);
      const dayExtremes = findExtremes(daySeries);

      const dayHighs = dayExtremes.filter(e => e.type === 'high').map(e => e.height);
      const dayLows = dayExtremes.filter(e => e.type === 'low').map(e => e.height);

      if (dayHighs.length > 0 && dayLows.length > 0) {
        const dayRange = Math.max(...dayHighs) - Math.min(...dayLows);
        const dayCoeff = Math.min(120, Math.max(20, Math.round((dayRange / MEAN_RANGE) * 70)));
        forecast.push({ date: dayStart, coefficient: dayCoeff });
      }
    }

    return {
      coefficient,
      range,
      maxHigh,
      minLow,
      level: getLevel(coefficient),
      forecast,
    };
  }, [selectedStation, epoch]);

  if (!coefficientData) {
    return (
      <div className="bg-slate-900/95 backdrop-blur rounded-lg p-3 text-xs shadow-lg border border-slate-700 max-w-[320px]">
        <div className="text-slate-400 text-center py-4">
          Select a station to view tidal coefficients
        </div>
      </div>
    );
  }

  const { coefficient, range, level, forecast } = coefficientData;

  // Format day name
  const formatDay = (date: Date) => {
    const today = new Date(epoch);
    today.setHours(0, 0, 0, 0);
    const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-3 text-xs shadow-lg border border-slate-700 max-w-[340px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100">Tidal Coefficient</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${level.bgColor} ${level.color}`}>
          {level.label}
        </span>
      </div>

      {/* Main coefficient display */}
      <div className={`${level.bgColor} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${level.color}`}>{coefficient}</div>
            <div className="text-slate-400 text-[10px] mt-1">French Scale (20-120)</div>
          </div>
          <div className="text-right">
            <div className="text-slate-300 text-sm">Range: {range.toFixed(2)}m</div>
            <div className="text-slate-500 text-[10px]">{level.description}</div>
          </div>
        </div>
      </div>

      {/* Coefficient scale */}
      <div className="mb-4">
        <div className="text-slate-400 mb-2">Coefficient Scale</div>
        <div className="relative h-6 rounded-full overflow-hidden bg-gradient-to-r from-green-600 via-yellow-500 via-orange-500 to-red-600">
          {/* Current position marker */}
          <div
            className="absolute top-0 w-1 h-full bg-white shadow-lg"
            style={{ left: `${((coefficient - 20) / 100) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-slate-500 text-[10px] mt-1">
          <span>20 (Weak)</span>
          <span>70 (Mean)</span>
          <span>120 (Strong)</span>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="mb-3">
        <div className="text-slate-400 mb-2">7-Day Forecast</div>
        <div className="flex gap-1">
          {forecast.map((day, i) => {
            const dayLevel = getLevel(day.coefficient);
            return (
              <div
                key={i}
                className={`flex-1 p-1.5 rounded ${dayLevel.bgColor}`}
                title={`${formatDay(day.date)}: ${day.coefficient}`}
              >
                <div className="text-[10px] text-slate-400 text-center mb-0.5">
                  {formatDay(day.date).slice(0, 3)}
                </div>
                <div className={`text-center font-bold ${dayLevel.color}`}>
                  {day.coefficient}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-1 mb-3">
        {COEFFICIENT_LEVELS.map(level => (
          <div key={level.label} className="text-center">
            <div className={`w-full h-2 rounded ${level.bgColor} border ${level.color.replace('text-', 'border-')}`} />
            <div className="text-[8px] text-slate-500 mt-0.5">{level.min}-{level.max}</div>
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="border-t border-slate-700 pt-2 text-slate-500 text-[10px]">
        <p>
          <strong className="text-slate-300">Tidal coefficient</strong> measures tide strength on a 20-120 scale,
          used extensively in France. 70 is average; 100+ indicates exceptional tides.
          High coefficients correlate with spring tides at new and full moons.
        </p>
      </div>
    </div>
  );
}
