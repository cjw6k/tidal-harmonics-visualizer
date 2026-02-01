import { useMemo, useState } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { findExtremes, predictTideSeries } from '@/lib/harmonics';
import { addHours } from 'date-fns';
import { formatHeight } from '@/lib/units';

/**
 * IPCC Sea Level Rise Scenarios
 * Based on AR6 (2021) global mean sea level projections
 * Values in meters above 2020 baseline per year
 */
const SLR_SCENARIOS = {
  low: {
    name: 'Low (SSP1-2.6)',
    description: 'Strong emissions reductions',
    color: 'emerald',
    // Projected rise by decade (meters)
    projections: {
      2030: 0.06,
      2050: 0.15,
      2100: 0.38,
    },
  },
  medium: {
    name: 'Medium (SSP2-4.5)',
    description: 'Intermediate emissions pathway',
    color: 'amber',
    projections: {
      2030: 0.07,
      2050: 0.19,
      2100: 0.56,
    },
  },
  high: {
    name: 'High (SSP5-8.5)',
    description: 'High emissions scenario',
    color: 'rose',
    projections: {
      2030: 0.08,
      2050: 0.23,
      2100: 0.77,
    },
  },
  extreme: {
    name: 'Extreme (with ice sheet instability)',
    description: 'Includes low-confidence processes',
    color: 'purple',
    projections: {
      2030: 0.10,
      2050: 0.30,
      2100: 1.10,
    },
  },
} as const;

type ScenarioKey = keyof typeof SLR_SCENARIOS;
type ProjectionYear = 2030 | 2050 | 2100;

const PROJECTION_YEARS: ProjectionYear[] = [2030, 2050, 2100];

/**
 * SeaLevelRisePanel
 *
 * Educational visualization showing how sea level rise projections
 * would affect tide levels at the selected station.
 */
export function SeaLevelRisePanel() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [selectedYear, setSelectedYear] = useState<ProjectionYear>(2050);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('medium');

  // Calculate current high/low tides
  const tideExtremes = useMemo(() => {
    if (!station) return { high: 0, low: 0, mean: 0 };

    const now = new Date(epoch);
    const start = now;
    const end = addHours(now, 48);

    const series = predictTideSeries(station, start, end, 6);
    const extremes = findExtremes(series);

    const highs = extremes.filter((e) => e.type === 'high').map((e) => e.height);
    const lows = extremes.filter((e) => e.type === 'low').map((e) => e.height);

    const high = highs.length > 0 ? Math.max(...highs) : 0;
    const low = lows.length > 0 ? Math.min(...lows) : 0;

    return {
      high,
      low,
      mean: (high + low) / 2,
    };
  }, [epoch, station]);

  const scenario = SLR_SCENARIOS[selectedScenario];
  const slrAmount = scenario.projections[selectedYear];

  // Future tide levels with SLR
  const futureTides = useMemo(() => ({
    high: tideExtremes.high + slrAmount,
    low: tideExtremes.low + slrAmount,
    mean: tideExtremes.mean + slrAmount,
  }), [tideExtremes, slrAmount]);

  // Calculate flooding impact
  const currentHighAboveMean = tideExtremes.high - tideExtremes.mean;
  const futureFloodingIncrease = ((futureTides.high - tideExtremes.high) / currentHighAboveMean) * 100;

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view sea level rise projections
      </div>
    );
  }

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      button: 'bg-emerald-600',
    },
    amber: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      button: 'bg-amber-600',
    },
    rose: {
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      button: 'bg-rose-600',
    },
    purple: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      button: 'bg-purple-600',
    },
  };

  const colors = colorClasses[scenario.color];

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>🌊</span>
        Sea Level Rise Projections
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        How rising seas will affect tides at {station.name}
      </p>

      {/* Year selector */}
      <div className="mb-3">
        <label className="text-slate-500 text-xs block mb-1">Projection Year</label>
        <div className="flex gap-1">
          {PROJECTION_YEARS.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`flex-1 px-3 py-1.5 rounded text-xs transition-colors ${
                selectedYear === year
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="mb-4">
        <label className="text-slate-500 text-xs block mb-1">Emissions Scenario</label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.entries(SLR_SCENARIOS) as [ScenarioKey, typeof SLR_SCENARIOS[ScenarioKey]][]).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setSelectedScenario(key)}
              className={`px-2 py-1.5 rounded text-xs transition-colors ${
                selectedScenario === key
                  ? `${colorClasses[s.color].button} text-white`
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title={s.description}
            >
              {s.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Projection highlight */}
      <div className={`mb-3 p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Projected Rise by {selectedYear}</span>
          <span className={`text-xl font-bold ${colors.text}`}>
            +{formatHeight(slrAmount, unitSystem)}
          </span>
        </div>
        <p className="text-slate-500 text-xs">{scenario.description}</p>
      </div>

      {/* Comparison table */}
      <div className="bg-slate-800/50 rounded-lg overflow-hidden mb-3">
        <div className="grid grid-cols-3 gap-px bg-slate-700">
          <div className="bg-slate-800 p-2 text-xs text-slate-500 text-center">Tide Level</div>
          <div className="bg-slate-800 p-2 text-xs text-slate-500 text-center">Today</div>
          <div className="bg-slate-800 p-2 text-xs text-slate-500 text-center">{selectedYear}</div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-slate-700">
          <div className="bg-slate-800 p-2 text-xs text-blue-400">High Tide</div>
          <div className="bg-slate-800 p-2 text-xs text-white text-center font-mono">
            {formatHeight(tideExtremes.high, unitSystem)}
          </div>
          <div className={`bg-slate-800 p-2 text-xs text-center font-mono ${colors.text}`}>
            {formatHeight(futureTides.high, unitSystem)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-slate-700">
          <div className="bg-slate-800 p-2 text-xs text-amber-400">Low Tide</div>
          <div className="bg-slate-800 p-2 text-xs text-white text-center font-mono">
            {formatHeight(tideExtremes.low, unitSystem)}
          </div>
          <div className={`bg-slate-800 p-2 text-xs text-center font-mono ${colors.text}`}>
            {formatHeight(futureTides.low, unitSystem)}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-slate-700">
          <div className="bg-slate-800 p-2 text-xs text-slate-400">Mean Sea Level</div>
          <div className="bg-slate-800 p-2 text-xs text-white text-center font-mono">
            {formatHeight(tideExtremes.mean, unitSystem)}
          </div>
          <div className={`bg-slate-800 p-2 text-xs text-center font-mono ${colors.text}`}>
            {formatHeight(futureTides.mean, unitSystem)}
          </div>
        </div>
      </div>

      {/* Visual bar representation */}
      <div className="mb-3">
        <label className="text-slate-500 text-xs block mb-2">Visual Comparison</label>
        <div className="relative h-24 bg-slate-800 rounded-lg overflow-hidden">
          {/* Current water level representation */}
          <div
            className="absolute bottom-0 left-0 w-1/2 bg-blue-500/30 border-t-2 border-blue-400 transition-all"
            style={{ height: `${Math.min(80, (tideExtremes.high / 3) * 100)}%` }}
          >
            <span className="absolute top-1 left-2 text-xs text-blue-300">Now</span>
          </div>
          {/* Future water level */}
          <div
            className={`absolute bottom-0 right-0 w-1/2 ${colors.bg} border-t-2 ${colors.border.replace('border-', 'border-').replace('/30', '')} transition-all`}
            style={{ height: `${Math.min(80, (futureTides.high / 3) * 100)}%` }}
          >
            <span className={`absolute top-1 right-2 text-xs ${colors.text}`}>{selectedYear}</span>
          </div>
          {/* Reference line for current high */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-slate-500"
            style={{ bottom: `${Math.min(80, (tideExtremes.high / 3) * 100)}%` }}
          />
        </div>
      </div>

      {/* Impact summary */}
      {isFinite(futureFloodingIncrease) && futureFloodingIncrease > 0 && (
        <div className={`p-2 rounded ${colors.bg} border ${colors.border} mb-3`}>
          <p className={`text-xs ${colors.text}`}>
            <strong>Impact:</strong> By {selectedYear}, what is now an average high tide will be
            {' '}{formatHeight(slrAmount, unitSystem)} higher. Current "extreme" high tides will
            become more frequent.
          </p>
        </div>
      )}

      {/* Educational note */}
      <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">About these projections:</strong>
        <p className="mt-1">
          Sea level rise projections are from IPCC AR6 (2021). Local rates may vary due to
          land subsidence, ocean currents, and gravitational effects from ice sheet loss.
          These are global mean estimates.
        </p>
      </div>
    </div>
  );
}
