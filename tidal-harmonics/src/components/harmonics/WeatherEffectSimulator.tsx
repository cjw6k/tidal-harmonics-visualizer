import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface Props {
  onClose?: () => void;
}

interface WeatherConditions {
  windSpeed: number; // knots
  windDirection: 'onshore' | 'offshore' | 'alongshore';
  pressure: number; // millibars (hPa)
  stormSurge: boolean;
}

// Calculate weather-induced sea level change
function calculateWeatherEffect(conditions: WeatherConditions): number {
  let effect = 0;

  // Inverse barometer effect: ~1 cm per 1 mbar difference from 1013.25 mbar
  const pressureDiff = 1013.25 - conditions.pressure;
  effect += pressureDiff * 0.01; // meters

  // Wind setup effect (simplified)
  // Onshore winds push water toward coast, offshore pulls away
  const windFactor = Math.pow(conditions.windSpeed / 20, 2) * 0.1; // Quadratic with wind speed
  if (conditions.windDirection === 'onshore') {
    effect += windFactor;
  } else if (conditions.windDirection === 'offshore') {
    effect -= windFactor;
  }
  // Alongshore winds have minimal direct effect

  // Storm surge (if enabled, adds significant effect)
  if (conditions.stormSurge) {
    effect += 0.5 + (conditions.windSpeed / 40); // Base surge + wind component
  }

  return effect;
}

export function WeatherEffectSimulator({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [conditions, setConditions] = useState<WeatherConditions>({
    windSpeed: 10,
    windDirection: 'onshore',
    pressure: 1013,
    stormSurge: false,
  });

  // Calculate current predicted tide and weather effect
  const tideInfo = useMemo(() => {
    if (!station) return null;

    const now = new Date();
    const predictedHeight = predictTide(station, now);
    const weatherEffect = calculateWeatherEffect(conditions);
    const actualHeight = predictedHeight + weatherEffect;

    return {
      predicted: predictedHeight,
      weatherEffect,
      actual: actualHeight,
    };
  }, [station, conditions]);

  const formatHeight = (meters: number) => {
    if (unitSystem === 'imperial') {
      return `${(meters * 3.28084).toFixed(2)} ft`;
    }
    return `${meters.toFixed(2)} m`;
  };

  const formatEffect = (meters: number) => {
    const sign = meters >= 0 ? '+' : '';
    if (unitSystem === 'imperial') {
      return `${sign}${(meters * 3.28084).toFixed(2)} ft`;
    }
    return `${sign}${meters.toFixed(2)} m`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 border border-slate-700 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Weather Effects Simulator</h3>
          <p className="text-slate-400 text-xs mt-1">
            See how wind and pressure affect sea level
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4">
        <p className="text-slate-300 text-xs leading-relaxed">
          Actual sea level differs from astronomical tide predictions due to weather effects.
          <span className="text-amber-400"> Wind</span> pushes water onshore or offshore, while
          <span className="text-cyan-400"> low pressure</span> allows the sea surface to rise.
          During storms, these effects combine to create <span className="text-red-400">storm surge</span>.
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4 mb-4">
        {/* Wind Speed */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 text-sm font-medium">Wind Speed</label>
            <span className="text-amber-400 font-mono text-sm">{conditions.windSpeed} knots</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            value={conditions.windSpeed}
            onChange={(e) => setConditions({ ...conditions, windSpeed: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Calm</span>
            <span>Gale</span>
            <span>Hurricane</span>
          </div>
        </div>

        {/* Wind Direction */}
        <div className="bg-slate-800 rounded-lg p-3">
          <label className="text-slate-300 text-sm font-medium block mb-2">Wind Direction</label>
          <div className="flex gap-2">
            {(['onshore', 'alongshore', 'offshore'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setConditions({ ...conditions, windDirection: dir })}
                className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
                  conditions.windDirection === dir
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {dir === 'onshore' && '→🏖️ Onshore'}
                {dir === 'offshore' && '🏖️→ Offshore'}
                {dir === 'alongshore' && '↔️ Alongshore'}
              </button>
            ))}
          </div>
        </div>

        {/* Barometric Pressure */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 text-sm font-medium">Barometric Pressure</label>
            <span className="text-cyan-400 font-mono text-sm">{conditions.pressure} mb</span>
          </div>
          <input
            type="range"
            min="940"
            max="1040"
            value={conditions.pressure}
            onChange={(e) => setConditions({ ...conditions, pressure: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Very Low (storm)</span>
            <span>Normal (1013)</span>
            <span>High</span>
          </div>
        </div>

        {/* Storm Surge Toggle */}
        <div className="bg-slate-800 rounded-lg p-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-slate-300 text-sm font-medium">Storm Surge Conditions</span>
              <p className="text-slate-500 text-xs mt-1">
                Adds extreme effects from sustained storm winds
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={conditions.stormSurge}
                onChange={(e) => setConditions({ ...conditions, stormSurge: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${
                conditions.stormSurge ? 'bg-red-500' : 'bg-slate-600'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform mt-1 ${
                  conditions.stormSurge ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Results */}
      {tideInfo && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-white font-medium text-sm mb-3">Sea Level at {station?.name || 'Station'}</h4>

          {/* Visual comparison */}
          <div className="relative h-32 bg-slate-900 rounded-lg mb-3 overflow-hidden">
            {/* Water level visualization */}
            <div className="absolute inset-0 flex items-end">
              {/* Predicted level */}
              <div
                className="w-1/2 bg-blue-500/30 border-t-2 border-blue-500 transition-all duration-300"
                style={{ height: `${Math.max(10, Math.min(90, 50 + tideInfo.predicted * 20))}%` }}
              >
                <div className="text-center pt-1">
                  <span className="text-blue-400 text-xs">Predicted</span>
                  <p className="text-white text-sm font-mono">{formatHeight(tideInfo.predicted)}</p>
                </div>
              </div>
              {/* Actual level */}
              <div
                className={`w-1/2 transition-all duration-300 ${
                  tideInfo.weatherEffect > 0
                    ? 'bg-red-500/30 border-t-2 border-red-500'
                    : 'bg-green-500/30 border-t-2 border-green-500'
                }`}
                style={{ height: `${Math.max(10, Math.min(90, 50 + tideInfo.actual * 20))}%` }}
              >
                <div className="text-center pt-1">
                  <span className={`text-xs ${tideInfo.weatherEffect > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    Actual
                  </span>
                  <p className="text-white text-sm font-mono">{formatHeight(tideInfo.actual)}</p>
                </div>
              </div>
            </div>

            {/* Reference line */}
            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-600" />
          </div>

          {/* Effect breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Astronomical tide:</span>
              <span className="text-blue-400 font-mono">{formatHeight(tideInfo.predicted)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weather effect:</span>
              <span className={`font-mono ${tideInfo.weatherEffect > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {formatEffect(tideInfo.weatherEffect)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-white font-medium">Estimated actual level:</span>
              <span className="text-white font-mono">{formatHeight(tideInfo.actual)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Effect explanations */}
      <div className="mt-4 space-y-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <h4 className="text-cyan-400 font-medium text-sm mb-2">📊 Inverse Barometer Effect</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            Low pressure allows the sea surface to rise: roughly <span className="text-cyan-300">1 cm per 1 millibar</span> below normal (1013.25 mb). A deep low-pressure system at 960 mb can raise sea level by over 50 cm.
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <h4 className="text-amber-400 font-medium text-sm mb-2">💨 Wind Setup</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            Strong onshore winds push water toward the coast, raising sea level. The effect scales with the <span className="text-amber-300">square of wind speed</span>—doubling wind speed quadruples the effect. Offshore winds have the opposite effect.
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <h4 className="text-red-400 font-medium text-sm mb-2">🌀 Storm Surge</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            During hurricanes and severe storms, sustained winds over shallow coastal waters can create surges of <span className="text-red-300">2-6+ meters</span>. The shape of the coastline, seabed slope, and storm track all affect surge magnitude.
          </p>
        </div>
      </div>

      {/* Warning note */}
      <div className="mt-4 bg-gradient-to-r from-amber-900/30 to-red-900/30 rounded-lg p-3 border border-amber-800/30">
        <p className="text-amber-200 text-xs leading-relaxed">
          <span className="font-semibold">⚠️ Note:</span> This is a simplified educational model.
          Real storm surge forecasting requires detailed atmospheric and ocean models.
          Always follow official warnings from meteorological services during severe weather.
        </p>
      </div>
    </div>
  );
}
