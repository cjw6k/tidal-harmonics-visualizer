import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

interface PressureData {
  pressure: number; // hPa
  label: string;
  description: string;
  color: string;
}

const PRESSURE_REFERENCES: PressureData[] = [
  { pressure: 870, label: 'Typhoon Tip (1979)', description: 'Strongest recorded tropical cyclone', color: '#dc2626' },
  { pressure: 920, label: 'Category 5 Hurricane', description: 'Extreme storm surge risk', color: '#ef4444' },
  { pressure: 960, label: 'Category 2 Hurricane', description: 'Significant storm surge', color: '#f97316' },
  { pressure: 990, label: 'Low Pressure', description: 'Typical storm system', color: '#fbbf24' },
  { pressure: 1013.25, label: 'Standard Atmosphere', description: 'Mean sea level pressure', color: '#22c55e' },
  { pressure: 1030, label: 'High Pressure', description: 'Fair weather', color: '#3b82f6' },
  { pressure: 1084, label: 'Siberian High (1968)', description: 'Highest recorded pressure', color: '#8b5cf6' },
];

// The inverse barometer effect: ~1 cm sea level change per 1 hPa pressure change
const CM_PER_HPA = 1.0;
const STANDARD_PRESSURE = 1013.25;

export function BarometricPressure() {
  const [pressure, setPressure] = useState(1013.25);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const seaLevelChange = useMemo(() => {
    // Low pressure = higher water, High pressure = lower water
    const changeCm = (STANDARD_PRESSURE - pressure) * CM_PER_HPA;
    return unitSystem === 'metric' ? changeCm : changeCm / 2.54; // convert to inches
  }, [pressure, unitSystem]);

  const unitLabel = unitSystem === 'metric' ? 'cm' : 'in';

  // Find closest reference pressure for context
  const closestRef = useMemo(() => {
    return PRESSURE_REFERENCES.reduce((closest, ref) =>
      Math.abs(ref.pressure - pressure) < Math.abs(closest.pressure - pressure) ? ref : closest
    );
  }, [pressure]);

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-3 text-xs shadow-lg border border-slate-700 max-w-[340px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-100">Barometric Effect</h3>
        <span className="text-slate-400">Inverse Barometer</span>
      </div>

      {/* Pressure slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400">Atmospheric Pressure</span>
          <span className="font-mono text-blue-400">{pressure.toFixed(1)} hPa</span>
        </div>
        <input
          type="range"
          min="870"
          max="1084"
          step="0.5"
          value={pressure}
          onChange={(e) => setPressure(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #dc2626 0%,
              #f97316 30%,
              #22c55e 50%,
              #3b82f6 70%,
              #8b5cf6 100%)`
          }}
        />
        <div className="flex justify-between text-slate-500 text-[10px] mt-1">
          <span>870 (Record Low)</span>
          <span>1013 (Normal)</span>
          <span>1084 (Record High)</span>
        </div>
      </div>

      {/* Sea level effect display */}
      <div className="bg-slate-800 rounded-lg p-3 mb-3">
        <div className="text-center">
          <div className="text-slate-400 mb-1">Sea Level Effect</div>
          <div className={`text-2xl font-bold ${seaLevelChange > 0 ? 'text-red-400' : seaLevelChange < 0 ? 'text-blue-400' : 'text-green-400'}`}>
            {seaLevelChange > 0 ? '+' : ''}{seaLevelChange.toFixed(1)} {unitLabel}
          </div>
          <div className="text-slate-500 mt-1">
            {seaLevelChange > 0 ? '↑ Higher than predicted' : seaLevelChange < 0 ? '↓ Lower than predicted' : 'At predicted level'}
          </div>
        </div>
      </div>

      {/* Context reference */}
      <div className="bg-slate-800/50 rounded p-2 mb-3 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: closestRef.color }}
        />
        <div>
          <div className="text-slate-200 font-medium">{closestRef.label}</div>
          <div className="text-slate-500">{closestRef.description}</div>
        </div>
      </div>

      {/* Visual representation */}
      <div className="mb-3">
        <div className="text-slate-400 mb-2">Pressure vs Sea Level</div>
        <div className="relative h-20 bg-gradient-to-b from-sky-900 to-blue-950 rounded overflow-hidden">
          {/* Water level animation */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400/80 transition-all duration-300"
            style={{ height: `${Math.max(10, Math.min(90, 50 + seaLevelChange * 2))}%` }}
          >
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
          </div>

          {/* Reference line */}
          <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-green-400/50" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-green-400 text-[10px]">Normal</div>

          {/* Label */}
          <div className="absolute bottom-1 left-1 text-white/80 text-[10px]">
            Water Level
          </div>
        </div>
      </div>

      {/* Quick presets */}
      <div className="mb-3">
        <div className="text-slate-400 mb-2">Presets</div>
        <div className="flex flex-wrap gap-1">
          {[
            { p: 920, label: 'Hurricane', color: 'bg-red-600' },
            { p: 980, label: 'Storm', color: 'bg-orange-600' },
            { p: 1013.25, label: 'Normal', color: 'bg-green-600' },
            { p: 1030, label: 'High', color: 'bg-blue-600' },
          ].map(preset => (
            <button
              key={preset.p}
              onClick={() => setPressure(preset.p)}
              className={`px-2 py-1 rounded text-[10px] ${preset.color} hover:opacity-80 transition-opacity`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Educational content */}
      <div className="text-slate-400 space-y-2 border-t border-slate-700 pt-3">
        <p>
          <strong className="text-slate-300">The Inverse Barometer Effect:</strong>{' '}
          Sea level rises ~1 cm for every 1 hPa drop in atmospheric pressure.
          This is because lower air pressure exerts less force on the water surface.
        </p>
        <p>
          During major hurricanes, central pressure can drop 100+ hPa below normal,
          contributing 1+ meter to storm surge on top of wind-driven surge and tides.
        </p>
        <p className="text-amber-400/80">
          ⚠️ This effect is in addition to astronomical tide predictions.
          Actual water levels during storms combine tides + surge + wind setup.
        </p>
      </div>
    </div>
  );
}
