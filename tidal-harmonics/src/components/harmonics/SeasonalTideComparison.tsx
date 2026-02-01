import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addDays, setMonth, setDate } from 'date-fns';

interface SeasonalTideComparisonProps {
  onClose: () => void;
}

interface SeasonalData {
  name: string;
  date: Date;
  color: string;
  meanRange: number;
  maxRange: number;
  minRange: number;
  meanHigh: number;
  meanLow: number;
  tidesPerDay: number;
}

// Key astronomical dates that affect tides
const SEASONS = [
  { name: 'Winter Solstice', month: 11, day: 21, color: '#60A5FA' }, // Blue
  { name: 'Spring Equinox', month: 2, day: 20, color: '#34D399' }, // Green
  { name: 'Summer Solstice', month: 5, day: 21, color: '#FBBF24' }, // Yellow
  { name: 'Fall Equinox', month: 8, day: 22, color: '#F97316' }, // Orange
];

export function SeasonalTideComparison({ onClose }: SeasonalTideComparisonProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Calculate tidal statistics for each season
  const seasonalData = useMemo(() => {
    if (!selectedStation) return [];

    const data: SeasonalData[] = [];

    SEASONS.forEach((season) => {
      // Get date for this season in the selected year
      let seasonDate = setMonth(new Date(year, 0, 1), season.month);
      seasonDate = setDate(seasonDate, season.day);

      // Analyze a 14-day period (full spring-neap cycle) around the seasonal date
      const start = addDays(seasonDate, -7);
      const end = addDays(seasonDate, 7);

      const series = predictTideSeries(selectedStation, start, end, 15);
      const extremes = findExtremes(series);

      // Calculate statistics
      const highs = extremes.filter((e) => e.type === 'high').map((e) => e.height);
      const lows = extremes.filter((e) => e.type === 'low').map((e) => e.height);

      const ranges: number[] = [];
      for (let i = 0; i < Math.min(highs.length, lows.length); i++) {
        ranges.push((highs[i] ?? 0) - (lows[i] ?? 0));
      }

      const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

      data.push({
        name: season.name,
        date: seasonDate,
        color: season.color,
        meanRange: avg(ranges),
        maxRange: Math.max(...ranges, 0),
        minRange: Math.min(...ranges, Infinity) === Infinity ? 0 : Math.min(...ranges),
        meanHigh: avg(highs),
        meanLow: avg(lows),
        tidesPerDay: extremes.length / 14, // Average tides per day over 14 days
      });
    });

    return data;
  }, [selectedStation, year]);

  // Find the season with largest/smallest ranges
  const maxRangeSeason = useMemo(() => {
    if (seasonalData.length === 0) return null;
    return seasonalData.reduce((max, s) => (s.maxRange > max.maxRange ? s : max), seasonalData[0]!);
  }, [seasonalData]);

  const minRangeSeason = useMemo(() => {
    if (seasonalData.length === 0) return null;
    return seasonalData.reduce((min, s) => (s.minRange < min.minRange ? s : min), seasonalData[0]!);
  }, [seasonalData]);

  const getBarWidth = (value: number, max: number) => `${Math.max(5, (value / max) * 100)}%`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">Seasonal Tide Comparison</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-medium text-purple-400 mb-2">How Seasons Affect Tides</p>
            <p className="mb-2">
              Tidal patterns vary throughout the year due to changes in the Sun's declination and
              Earth-Moon-Sun geometry. Equinoxes typically produce larger tidal ranges (equinoctial
              spring tides) because the Sun and Moon's gravitational pulls align more directly with
              Earth's equator.
            </p>
            <p className="text-slate-400 text-xs">
              Analysis shows 14-day periods around each seasonal date to capture full spring-neap cycles.
            </p>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Year:</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 bg-slate-700 rounded text-white text-sm"
            >
              {[...Array(10)].map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Seasonal comparison chart */}
          {seasonalData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Tidal Range by Season</h3>
              {seasonalData.map((season) => (
                <div
                  key={season.name}
                  className={`bg-slate-800 rounded-lg p-3 cursor-pointer transition-colors ${
                    showDetails === season.name ? 'ring-1 ring-white/30' : 'hover:bg-slate-750'
                  }`}
                  onClick={() => setShowDetails(showDetails === season.name ? null : season.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: season.color }} />
                      <span className="text-white font-medium">{season.name}</span>
                    </div>
                    <span className="text-sm text-slate-400">{format(season.date, 'MMM d, yyyy')}</span>
                  </div>

                  {/* Range bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16">Range</span>
                    <div className="flex-1 h-6 bg-slate-700 rounded overflow-hidden">
                      <div
                        className="h-full rounded flex items-center justify-end px-2"
                        style={{
                          width: getBarWidth(season.meanRange, (maxRangeSeason?.maxRange ?? 1) * 1.1),
                          backgroundColor: season.color,
                        }}
                      >
                        <span className="text-xs font-medium text-slate-900">
                          {season.meanRange.toFixed(2)}m
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {showDetails === season.name && (
                    <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Max Range:</p>
                        <p className="text-white font-medium">{season.maxRange.toFixed(2)} m</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Min Range:</p>
                        <p className="text-white font-medium">{season.minRange.toFixed(2)} m</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Mean High Water:</p>
                        <p className="text-white font-medium">{season.meanHigh.toFixed(2)} m</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Mean Low Water:</p>
                        <p className="text-white font-medium">{season.meanLow.toFixed(2)} m</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Tides per day:</p>
                        <p className="text-white font-medium">
                          ~{season.tidesPerDay.toFixed(1)} ({season.tidesPerDay > 1.8 ? 'Semidiurnal' : 'Mixed/Diurnal'})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary insights */}
          {maxRangeSeason && minRangeSeason && (
            <div className="bg-gradient-to-r from-purple-900/30 to-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-400 mb-3">Key Insights</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">
                  <span className="text-white font-medium">Largest tides:</span>{' '}
                  {maxRangeSeason.name} with max range of {maxRangeSeason.maxRange.toFixed(2)}m
                </p>
                <p className="text-slate-300">
                  <span className="text-white font-medium">Smallest tides:</span>{' '}
                  {minRangeSeason.name} with min range of {minRangeSeason.minRange.toFixed(2)}m
                </p>
                <p className="text-slate-300">
                  <span className="text-white font-medium">Seasonal variation:</span>{' '}
                  {((maxRangeSeason.maxRange - minRangeSeason.minRange) / minRangeSeason.minRange * 100).toFixed(0)}% difference between extreme ranges
                </p>
              </div>
            </div>
          )}

          {/* Educational notes */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Why Equinoxes Have Larger Tides:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sun crosses celestial equator, maximizing its tidal pull on equatorial bulge</li>
              <li>Solar and lunar tides combine more effectively at equator</li>
              <li>Effect most pronounced when spring tides coincide with equinox dates</li>
              <li>Weather patterns (storms, wind) can amplify or reduce actual tide heights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
