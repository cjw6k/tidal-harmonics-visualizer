import { useMemo, useState } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { findExtremes, predictTideSeries } from '@/lib/harmonics';
import { addHours } from 'date-fns';
import { formatHeight } from '@/lib/units';

/**
 * Water density in kg/m³
 */
const WATER_DENSITY = 1025; // seawater

/**
 * Gravitational acceleration in m/s²
 */
const GRAVITY = 9.81;

/**
 * Sample tidal barrage/plant specifications
 */
const SAMPLE_PLANTS = [
  {
    name: 'La Rance (France)',
    basinArea: 22, // km²
    capacity: 240, // MW
    annual: 540, // GWh/year
  },
  {
    name: 'Sihwa Lake (S. Korea)',
    basinArea: 30,
    capacity: 254,
    annual: 552,
  },
  {
    name: 'Annapolis Royal (Canada)',
    basinArea: 6,
    capacity: 20,
    annual: 50,
  },
];

/**
 * Calculate theoretical tidal energy
 * E = 0.5 * ρ * g * A * H²
 * where:
 *   ρ = water density (kg/m³)
 *   g = gravitational acceleration (m/s²)
 *   A = basin area (m²)
 *   H = tidal range (m)
 */
function calculateEnergy(basinAreaKm2: number, tidalRange: number): number {
  const areaM2 = basinAreaKm2 * 1_000_000;
  return 0.5 * WATER_DENSITY * GRAVITY * areaM2 * tidalRange * tidalRange;
}

/**
 * Convert joules to more readable units
 */
function formatEnergy(joules: number): string {
  if (joules >= 1e12) {
    return `${(joules / 1e12).toFixed(2)} TJ`;
  } else if (joules >= 1e9) {
    return `${(joules / 1e9).toFixed(2)} GJ`;
  } else if (joules >= 1e6) {
    return `${(joules / 1e6).toFixed(2)} MJ`;
  }
  return `${joules.toFixed(0)} J`;
}

/**
 * Convert to power (watts) assuming 2 tidal cycles per day
 */
function energyToPower(joules: number): number {
  // 2 cycles per day, ~6 hours per cycle active generation
  const secondsPerDay = 86400;
  const efficiency = 0.25; // Typical barrage efficiency
  return (joules * 2 * efficiency) / secondsPerDay;
}

function formatPower(watts: number): string {
  if (watts >= 1e9) {
    return `${(watts / 1e9).toFixed(2)} GW`;
  } else if (watts >= 1e6) {
    return `${(watts / 1e6).toFixed(2)} MW`;
  } else if (watts >= 1e3) {
    return `${(watts / 1e3).toFixed(2)} kW`;
  }
  return `${watts.toFixed(0)} W`;
}

/**
 * TidalEnergyCalculator
 *
 * Educational tool showing the potential energy available from
 * tidal ranges at the selected station.
 */
export function TidalEnergyCalculator() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [basinArea, setBasinArea] = useState<number>(10); // km²

  // Calculate tidal range
  const tidalData = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);
    const start = now;
    const end = addHours(now, 48);

    const series = predictTideSeries(station, start, end, 6);
    const extremes = findExtremes(series);

    const highs = extremes.filter((e) => e.type === 'high').map((e) => e.height);
    const lows = extremes.filter((e) => e.type === 'low').map((e) => e.height);

    const maxHigh = highs.length > 0 ? Math.max(...highs) : 0;
    const minLow = lows.length > 0 ? Math.min(...lows) : 0;
    const range = maxHigh - minLow;

    // Calculate mean range from first 4 extremes
    let meanRange = range;
    if (extremes.length >= 4) {
      const ranges: number[] = [];
      for (let i = 0; i < extremes.length - 1; i++) {
        if (extremes[i] !== undefined && extremes[i + 1] !== undefined &&
            extremes[i]!.type !== extremes[i + 1]!.type) {
          ranges.push(Math.abs(extremes[i]!.height - extremes[i + 1]!.height));
        }
      }
      if (ranges.length > 0) {
        meanRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
      }
    }

    return {
      maxRange: range,
      meanRange,
      maxHigh,
      minLow,
    };
  }, [epoch, station]);

  if (!station || !tidalData) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to calculate tidal energy potential
      </div>
    );
  }

  const energy = calculateEnergy(basinArea, tidalData.meanRange);
  const power = energyToPower(energy);

  // Annual energy (assuming 705 tidal cycles per year)
  const annualEnergy = energy * 705 * 0.25; // with efficiency
  const annualGWh = annualEnergy / 3.6e12; // Convert J to GWh

  // Homes powered (assuming 10,000 kWh/year per home)
  const homesPowered = Math.round(annualGWh * 1000 / 10);

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>⚡</span>
        Tidal Energy Calculator
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        Theoretical energy potential at {station.name}
      </p>

      {/* Basin area input */}
      <div className="mb-4">
        <label className="text-slate-400 text-xs block mb-1">
          Hypothetical Basin Area (km²)
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={basinArea}
          onChange={(e) => setBasinArea(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1 km²</span>
          <span className="text-cyan-400 font-mono">{basinArea} km²</span>
          <span>100 km²</span>
        </div>
      </div>

      {/* Tidal range display */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-slate-500 text-xs mb-1">Mean Range</div>
          <div className="text-white text-lg font-mono">
            {formatHeight(tidalData.meanRange, unitSystem)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-slate-500 text-xs mb-1">Max Range</div>
          <div className="text-white text-lg font-mono">
            {formatHeight(tidalData.maxRange, unitSystem)}
          </div>
        </div>
      </div>

      {/* Energy output */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-slate-400 text-xs mb-1">Energy per Cycle</div>
            <div className="text-cyan-400 text-lg font-mono">{formatEnergy(energy)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Average Power</div>
            <div className="text-cyan-400 text-lg font-mono">{formatPower(power)}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-cyan-500/20">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Annual Generation</span>
            <span className="text-white font-mono">{annualGWh.toFixed(1)} GWh/year</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-slate-400 text-xs">Homes Powered</span>
            <span className="text-green-400 font-mono">~{homesPowered.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Comparison with real plants */}
      <div className="mb-3">
        <h4 className="text-slate-300 text-xs font-medium mb-2">Real Tidal Plants</h4>
        <div className="space-y-1">
          {SAMPLE_PLANTS.map((plant) => (
            <div key={plant.name} className="flex items-center justify-between text-xs bg-slate-800/30 rounded px-2 py-1">
              <span className="text-slate-400">{plant.name}</span>
              <span className="text-slate-500">{plant.basinArea} km²</span>
              <span className="text-amber-400">{plant.capacity} MW</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-3">
        <h4 className="text-slate-300 text-xs font-medium mb-2">Site Rating</h4>
        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 bottom-0 rounded-full transition-all ${
              tidalData.meanRange >= 5 ? 'bg-green-500' :
              tidalData.meanRange >= 3 ? 'bg-yellow-500' :
              tidalData.meanRange >= 1.5 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, (tidalData.meanRange / 8) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-red-400">Poor (&lt;1.5m)</span>
          <span className="text-yellow-400">Moderate</span>
          <span className="text-green-400">Excellent (&gt;5m)</span>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {tidalData.meanRange >= 5 ? (
            <>This location has <span className="text-green-400">excellent</span> tidal energy potential, comparable to the best sites worldwide.</>
          ) : tidalData.meanRange >= 3 ? (
            <>This location has <span className="text-yellow-400">good</span> tidal energy potential, suitable for commercial development.</>
          ) : tidalData.meanRange >= 1.5 ? (
            <>This location has <span className="text-orange-400">moderate</span> tidal energy potential. May be viable with advanced technology.</>
          ) : (
            <>This location has <span className="text-red-400">limited</span> tidal energy potential due to small tidal range.</>
          )}
        </p>
      </div>

      {/* Educational note */}
      <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">About this calculation:</strong>
        <p className="mt-1">
          Theoretical energy uses E = ½ρgAH² formula. Real-world efficiency is ~25%
          due to turbine losses and partial basin filling. Sites need &gt;5m range
          and suitable geography for commercial viability.
        </p>
      </div>
    </div>
  );
}
