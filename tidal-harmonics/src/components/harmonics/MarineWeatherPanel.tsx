import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface MarineWeatherPanelProps {
  onClose: () => void;
}

// Beaufort Scale definitions
const BEAUFORT_SCALE = [
  { force: 0, name: 'Calm', wind: '< 1', seaState: 'Like a mirror', waveHeight: 0 },
  { force: 1, name: 'Light Air', wind: '1-3', seaState: 'Ripples', waveHeight: 0.1 },
  { force: 2, name: 'Light Breeze', wind: '4-6', seaState: 'Small wavelets', waveHeight: 0.3 },
  { force: 3, name: 'Gentle Breeze', wind: '7-10', seaState: 'Large wavelets', waveHeight: 0.6 },
  { force: 4, name: 'Moderate Breeze', wind: '11-16', seaState: 'Small waves, whitecaps', waveHeight: 1.0 },
  { force: 5, name: 'Fresh Breeze', wind: '17-21', seaState: 'Moderate waves, spray', waveHeight: 2.0 },
  { force: 6, name: 'Strong Breeze', wind: '22-27', seaState: 'Large waves, foam', waveHeight: 3.0 },
  { force: 7, name: 'Near Gale', wind: '28-33', seaState: 'Sea heaps up, blown foam', waveHeight: 4.0 },
  { force: 8, name: 'Gale', wind: '34-40', seaState: 'Moderately high waves', waveHeight: 5.5 },
  { force: 9, name: 'Strong Gale', wind: '41-47', seaState: 'High waves, rolling', waveHeight: 7.0 },
  { force: 10, name: 'Storm', wind: '48-55', seaState: 'Very high waves, tumbling', waveHeight: 9.0 },
  { force: 11, name: 'Violent Storm', wind: '56-63', seaState: 'Exceptionally high waves', waveHeight: 11.5 },
  { force: 12, name: 'Hurricane', wind: '64+', seaState: 'Air filled with spray', waveHeight: 14.0 },
];

// Calculate barometric tide effect
function barometricEffect(pressureMb: number): number {
  // Standard pressure is 1013.25 mb
  // Rule: 1 mb = ~1 cm water level change (inverse relationship)
  const standardPressure = 1013.25;
  return (standardPressure - pressureMb) / 100; // in meters
}

// Calculate wind setup (simplified)
function windSetup(
  windSpeed: number,
  windDirection: number,
  coastDirection: number,
  fetchLength: number
): number {
  // Wind setup depends on:
  // - Wind speed squared
  // - Angle between wind and coast
  // - Fetch length
  const angleRad = ((windDirection - coastDirection) * Math.PI) / 180;
  const onshoreComponent = Math.cos(angleRad);

  if (onshoreComponent <= 0) return 0; // Offshore wind

  // Simplified formula
  const speedMs = windSpeed * 0.514444; // knots to m/s
  const setup = 0.00003 * speedMs * speedMs * fetchLength * onshoreComponent;
  return Math.min(setup, 2); // Cap at 2m for this simple model
}

export function MarineWeatherPanel({ onClose }: MarineWeatherPanelProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Simulated weather inputs (in real app, these would come from weather API)
  const [pressure, setPressure] = useState(1013);
  const [windSpeed, setWindSpeed] = useState(15);
  const [windDirection, setWindDirection] = useState(225);
  const [coastDirection, setCoastDirection] = useState(180);
  const [fetchLength, setFetchLength] = useState(50);

  const beaufortForce = useMemo(() => {
    const idx = BEAUFORT_SCALE.findIndex((_, i) => {
      const nextEntry = BEAUFORT_SCALE[i + 1];
      if (!nextEntry) return true;
      const nextWindStr = nextEntry.wind.split('-')[0] ?? '999';
      const nextWind = parseInt(nextWindStr, 10);
      return windSpeed < nextWind;
    });
    return idx >= 0 ? idx : 0;
  }, [windSpeed]);

  const beaufortInfo = BEAUFORT_SCALE[beaufortForce]!;

  // Calculate combined effects
  const weatherEffects = useMemo(() => {
    if (!selectedStation) return null;

    const baroEffect = barometricEffect(pressure);
    const windEffect = windSetup(windSpeed, windDirection, coastDirection, fetchLength);
    const totalEffect = baroEffect + windEffect;

    const now = new Date();
    const astronomicalTide = predictTide(selectedStation, now);
    const adjustedTide = astronomicalTide + totalEffect;

    return {
      astronomicalTide,
      baroEffect,
      windEffect,
      totalEffect,
      adjustedTide,
    };
  }, [selectedStation, pressure, windSpeed, windDirection, coastDirection, fetchLength]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(2)} ft`;
  };

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-sky-400">Marine Weather Effects</h3>
            <p className="text-slate-400 text-sm">
              How weather modifies tide levels
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

        {/* Current Beaufort Conditions */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Sea State</h4>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${
              beaufortForce <= 3 ? 'text-green-400' :
              beaufortForce <= 5 ? 'text-yellow-400' :
              beaufortForce <= 7 ? 'text-orange-400' : 'text-red-400'
            }`}>
              F{beaufortForce}
            </div>
            <div>
              <p className="text-slate-200 font-medium">{beaufortInfo.name}</p>
              <p className="text-sm text-slate-400">{beaufortInfo.seaState}</p>
              <p className="text-xs text-slate-500">
                Wave height: ~{beaufortInfo.waveHeight}m
              </p>
            </div>
          </div>
        </div>

        {/* Weather Inputs */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Weather Conditions</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Barometric Pressure */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Pressure (mb)
              </label>
              <input
                type="range"
                min="960"
                max="1050"
                value={pressure}
                onChange={(e) => setPressure(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span className="text-orange-400">Low</span>
                <span className={`font-mono ${
                  pressure < 1000 ? 'text-orange-400' :
                  pressure > 1020 ? 'text-blue-400' : 'text-slate-200'
                }`}>
                  {pressure} mb
                </span>
                <span className="text-blue-400">High</span>
              </div>
            </div>

            {/* Wind Speed */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Wind Speed (kn)
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm font-mono text-slate-200">
                {windSpeed} kn
              </div>
            </div>

            {/* Wind Direction */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Wind From (°)
              </label>
              <input
                type="range"
                min="0"
                max="359"
                value={windDirection}
                onChange={(e) => setWindDirection(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm font-mono text-slate-200">
                {windDirection}° ({
                  windDirection < 22.5 ? 'N' :
                  windDirection < 67.5 ? 'NE' :
                  windDirection < 112.5 ? 'E' :
                  windDirection < 157.5 ? 'SE' :
                  windDirection < 202.5 ? 'S' :
                  windDirection < 247.5 ? 'SW' :
                  windDirection < 292.5 ? 'W' :
                  windDirection < 337.5 ? 'NW' : 'N'
                })
              </div>
            </div>

            {/* Coast Orientation */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Coast Faces (°)
              </label>
              <input
                type="range"
                min="0"
                max="359"
                value={coastDirection}
                onChange={(e) => setCoastDirection(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm font-mono text-slate-200">
                {coastDirection}°
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-slate-400 mb-1">
              Fetch Length (nm)
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={fetchLength}
              onChange={(e) => setFetchLength(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm font-mono text-slate-200">
              {fetchLength} nm
            </div>
          </div>
        </div>

        {/* Calculated Effects */}
        {weatherEffects && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Tide Adjustment - {stationName}
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                <span className="text-sm text-slate-300">Astronomical Tide</span>
                <span className="font-mono text-slate-200">
                  {formatHeight(weatherEffects.astronomicalTide)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-blue-900/30 rounded">
                <div>
                  <span className="text-sm text-blue-300">Barometric Effect</span>
                  <p className="text-xs text-slate-400">
                    {pressure < 1013 ? 'Low pressure raises water' : 'High pressure depresses water'}
                  </p>
                </div>
                <span className={`font-mono ${
                  weatherEffects.baroEffect >= 0 ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {weatherEffects.baroEffect >= 0 ? '+' : ''}
                  {formatHeight(weatherEffects.baroEffect)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-cyan-900/30 rounded">
                <div>
                  <span className="text-sm text-cyan-300">Wind Setup</span>
                  <p className="text-xs text-slate-400">
                    {weatherEffects.windEffect > 0.1 ? 'Onshore wind piling water' : 'Minimal wind effect'}
                  </p>
                </div>
                <span className={`font-mono ${
                  weatherEffects.windEffect >= 0.1 ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  +{formatHeight(weatherEffects.windEffect)}
                </span>
              </div>

              <div className="border-t border-slate-600 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">Adjusted Tide Level</span>
                <span className={`text-lg font-mono font-bold ${
                  weatherEffects.totalEffect > 0.3 ? 'text-orange-400' :
                  weatherEffects.totalEffect < -0.3 ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {formatHeight(weatherEffects.adjustedTide)}
                </span>
              </div>

              <div className="text-center text-xs text-slate-500">
                Total adjustment: {weatherEffects.totalEffect >= 0 ? '+' : ''}
                {formatHeight(weatherEffects.totalEffect)}
              </div>
            </div>
          </div>
        )}

        {/* Visual Wind Diagram */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Wind & Coast Diagram</h4>
          <div className="relative h-40 flex items-center justify-center">
            <svg viewBox="0 0 200 160" className="w-full h-full max-w-xs">
              {/* Compass rose */}
              <circle cx="100" cy="80" r="50" fill="none" stroke="currentColor"
                strokeWidth="1" className="text-slate-600" />
              <text x="100" y="22" textAnchor="middle" className="fill-slate-400 text-xs">N</text>
              <text x="160" y="83" textAnchor="middle" className="fill-slate-400 text-xs">E</text>
              <text x="100" y="142" textAnchor="middle" className="fill-slate-400 text-xs">S</text>
              <text x="40" y="83" textAnchor="middle" className="fill-slate-400 text-xs">W</text>

              {/* Coast line */}
              <line
                x1={100 + 60 * Math.cos((coastDirection - 90 + 90) * Math.PI / 180)}
                y1={80 + 60 * Math.sin((coastDirection - 90 + 90) * Math.PI / 180)}
                x2={100 + 60 * Math.cos((coastDirection - 90 - 90) * Math.PI / 180)}
                y2={80 + 60 * Math.sin((coastDirection - 90 - 90) * Math.PI / 180)}
                stroke="currentColor"
                strokeWidth="4"
                className="text-amber-600"
              />

              {/* Wind arrow */}
              <g transform={`translate(100, 80) rotate(${windDirection})`}>
                <line x1="0" y1="-45" x2="0" y2="0"
                  stroke="currentColor" strokeWidth="2" className="text-sky-400" />
                <polygon points="0,-45 -6,-35 6,-35" className="fill-sky-400" />
              </g>

              {/* Labels */}
              <text x="100" y="150" textAnchor="middle" className="fill-slate-500 text-[8px]">
                Amber = coast, Blue = wind direction
              </text>
            </svg>
          </div>
        </div>

        {/* Warnings */}
        {weatherEffects && weatherEffects.totalEffect > 0.5 && (
          <div className="bg-orange-900/30 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2 text-sm">
              <span>⚠️</span>
              <div className="text-orange-200">
                <p className="font-medium">Significant Weather Effect</p>
                <p className="text-xs mt-1 text-orange-100/80">
                  Water levels may be {formatHeight(weatherEffects.totalEffect)} higher than
                  predicted astronomical tide. Plan for reduced clearances.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Understanding Weather Effects</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">🔵</span>
              <div>
                <p className="text-slate-300 font-medium">Barometric Pressure</p>
                <p>
                  Low pressure allows water to rise (~1 cm per 1 mb below 1013).
                  A 980 mb storm can raise levels by 30+ cm.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-cyan-400">💨</span>
              <div>
                <p className="text-slate-300 font-medium">Wind Setup</p>
                <p>
                  Persistent onshore winds push water against the coast.
                  Effect increases with wind speed squared and fetch length.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-orange-400">🌊</span>
              <div>
                <p className="text-slate-300 font-medium">Storm Surge</p>
                <p>
                  The combination of low pressure and strong onshore winds
                  can raise water levels several meters during severe storms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
