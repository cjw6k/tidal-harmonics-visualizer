import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface StormSurgeEstimatorProps {
  onClose: () => void;
}

// Estimate surge based on wind speed and pressure drop
function estimateSurge(
  windSpeedKnots: number,
  pressureDropMb: number,
  windDirection: 'onshore' | 'offshore' | 'along',
  shelfType: 'shallow' | 'moderate' | 'steep'
): {
  surgeLow: number;
  surgeHigh: number;
  confidence: 'low' | 'medium' | 'high';
} {
  // Pressure effect: ~1cm per 1mb drop (inverted barometer effect)
  const pressureSurge = pressureDropMb * 0.01;

  // Wind setup varies greatly by geography
  // Shallow shelf amplifies surge significantly
  const shelfMultiplier = shelfType === 'shallow' ? 1.5 : shelfType === 'moderate' ? 1.0 : 0.5;

  // Wind direction matters
  const directionMultiplier = windDirection === 'onshore' ? 1.0 :
    windDirection === 'along' ? 0.3 : -0.2;

  // Wind setup: roughly proportional to wind speed squared
  // This is a simplified approximation - real surge depends on fetch, duration, bathymetry
  const windSetup = Math.pow(windSpeedKnots / 30, 2) * 0.5 * shelfMultiplier * directionMultiplier;

  const baseSurge = pressureSurge + windSetup;

  // Uncertainty range
  const uncertainty = Math.max(0.2, baseSurge * 0.3);

  return {
    surgeLow: Math.max(0, baseSurge - uncertainty),
    surgeHigh: baseSurge + uncertainty,
    confidence: windSpeedKnots > 50 ? 'low' : windSpeedKnots > 30 ? 'medium' : 'high',
  };
}

export function StormSurgeEstimator({ onClose }: StormSurgeEstimatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const epoch = useTimeStore((s) => s.epoch);
  const currentTime = useMemo(() => new Date(epoch), [epoch]);

  // Storm parameters
  const [windSpeed, setWindSpeed] = useState(35); // knots
  const [pressureDrop, setPressureDrop] = useState(20); // mb below 1013
  const [windDirection, setWindDirection] = useState<'onshore' | 'offshore' | 'along'>('onshore');
  const [shelfType, setShelfType] = useState<'shallow' | 'moderate' | 'steep'>('moderate');

  const analysis = useMemo(() => {
    if (!selectedStation) return null;

    const surge = estimateSurge(windSpeed, pressureDrop, windDirection, shelfType);
    const avgSurge = (surge.surgeLow + surge.surgeHigh) / 2;

    // Get tide predictions for next 24 hours
    const end = addHours(currentTime, 24);
    const series = predictTideSeries(selectedStation, currentTime, end, 10);
    const extremes = findExtremes(series);

    // Calculate combined water levels
    const combinedSeries = series.map(p => ({
      ...p,
      combined: p.height + avgSurge,
      combinedLow: p.height + surge.surgeLow,
      combinedHigh: p.height + surge.surgeHigh,
    }));

    // Find highest combined level
    const maxCombined = Math.max(...combinedSeries.map(p => p.combinedHigh));
    const maxTide = Math.max(...series.map(p => p.height));

    // Find high tides with surge
    const highTidesWithSurge = extremes
      .filter(e => e.type === 'high')
      .map(e => ({
        ...e,
        withSurge: e.height + avgSurge,
        withSurgeHigh: e.height + surge.surgeHigh,
      }));

    return {
      surge,
      avgSurge,
      combinedSeries,
      maxCombined,
      maxTide,
      highTidesWithSurge,
      currentTide: series[0]?.height ?? 0,
      currentCombined: (series[0]?.height ?? 0) + avgSurge,
    };
  }, [selectedStation, currentTime, windSpeed, pressureDrop, windDirection, shelfType]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(2)} m`;
  };

  const formatWind = (knots: number) => {
    if (unitSystem === 'imperial') {
      return `${knots} kts`;
    }
    return `${Math.round(knots * 1.852)} km/h`;
  };

  // Beaufort scale description
  const getWindDescription = (knots: number): string => {
    if (knots < 17) return 'Moderate breeze';
    if (knots < 28) return 'Strong breeze';
    if (knots < 34) return 'Near gale';
    if (knots < 41) return 'Gale';
    if (knots < 48) return 'Strong gale';
    if (knots < 56) return 'Storm';
    if (knots < 64) return 'Violent storm';
    return 'Hurricane force';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-red-400">Storm Surge Estimator</h3>
            <p className="text-slate-400 text-sm">
              Estimate combined tide and storm surge levels
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Storm Inputs */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Wind Speed: {formatWind(windSpeed)} ({getWindDescription(windSpeed)})
            </label>
            <input
              type="range"
              min="10"
              max="80"
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>10 kts</span>
              <span>Storm</span>
              <span>80 kts</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Pressure Drop: {pressureDrop} mb below normal (1013 mb)
            </label>
            <input
              type="range"
              min="0"
              max="60"
              value={pressureDrop}
              onChange={(e) => setPressureDrop(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Normal</span>
              <span>Deep low</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Wind Direction</label>
              <select
                value={windDirection}
                onChange={(e) => setWindDirection(e.target.value as typeof windDirection)}
                className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="onshore">Onshore (worst)</option>
                <option value="along">Alongshore</option>
                <option value="offshore">Offshore</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Continental Shelf</label>
              <select
                value={shelfType}
                onChange={(e) => setShelfType(e.target.value as typeof shelfType)}
                className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="shallow">Shallow (amplifies)</option>
                <option value="moderate">Moderate</option>
                <option value="steep">Steep (reduces)</option>
              </select>
            </div>
          </div>
        </div>

        {analysis && (
          <>
            {/* Surge Estimate */}
            <div className="bg-red-900/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌊</span>
                  <span className="text-sm text-slate-400">Estimated Surge</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  analysis.surge.confidence === 'high' ? 'bg-green-900/50 text-green-400' :
                  analysis.surge.confidence === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  {analysis.surge.confidence} confidence
                </span>
              </div>
              <p className="text-3xl font-mono font-bold text-red-400">
                +{formatHeight(analysis.avgSurge)}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Range: {formatHeight(analysis.surge.surgeLow)} to {formatHeight(analysis.surge.surgeHigh)}
              </p>
            </div>

            {/* Combined Levels */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Current Tide</p>
                <p className="text-lg font-mono text-cyan-400">
                  {formatHeight(analysis.currentTide)}
                </p>
              </div>
              <div className="bg-red-900/30 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">With Surge</p>
                <p className="text-lg font-mono text-red-400">
                  {formatHeight(analysis.currentCombined)}
                </p>
              </div>
            </div>

            {/* High Tides with Surge */}
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Upcoming High Tides + Surge
              </h4>
              <div className="space-y-2">
                {analysis.highTidesWithSurge.map((ht, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                    <div>
                      <p className="text-sm text-slate-300">
                        {format(ht.time, 'EEE HH:mm')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tide: {formatHeight(ht.height)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono text-red-400">
                        {formatHeight(ht.withSurgeHigh)}
                      </p>
                      <p className="text-xs text-slate-500">worst case</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-900/30 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="text-sm text-amber-200">
                  <p className="font-medium">Important Limitations</p>
                  <ul className="text-xs mt-1 space-y-1 text-amber-100/80">
                    <li>• This is a simplified estimate for educational purposes</li>
                    <li>• Real surge depends on storm track, fetch, duration, and local geography</li>
                    <li>• Always use official forecasts from meteorological agencies</li>
                    <li>• Surge can vary significantly along a coastline</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Understanding Storm Surge</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  <strong className="text-slate-300">Storm surge</strong> is the abnormal rise in water
                  caused by storm conditions, separate from astronomical tides.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-300 font-medium">Pressure Effect</p>
                    <p>~1cm rise per 1mb pressure drop (inverted barometer)</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-300 font-medium">Wind Setup</p>
                    <p>Onshore winds pile water against the coast</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-300 font-medium">Shallow Shelf</p>
                    <p>Amplifies surge significantly more than steep coasts</p>
                  </div>
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-300 font-medium">Timing</p>
                    <p>Surge + spring high tide = worst flooding risk</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
