import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface FuelConsumptionEstimatorProps {
  onClose: () => void;
}

interface FuelEstimate {
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // hours
  fuelUsed: number; // gallons/liters
  avgConsumptionRate: number; // per hour
  tidalEffect: 'favorable' | 'adverse' | 'mixed';
  savings: number; // fuel saved compared to worst case
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}

export function FuelConsumptionEstimator({ onClose }: FuelConsumptionEstimatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  // Vessel parameters
  const [distance, setDistance] = useState(30); // nm
  const [cruiseSpeed, setCruiseSpeed] = useState(7); // knots
  const [baseFuelRate, setBaseFuelRate] = useState(4); // gallons/hour at cruise speed
  const [maxStreamRate, setMaxStreamRate] = useState(2); // knots
  const [passageDirection, setPassageDirection] = useState<'with-flood' | 'with-ebb'>('with-flood');
  const [unit, setUnit] = useState<'gallons' | 'liters'>('gallons');

  // Calculate fuel estimates for different departure times
  const fuelEstimates = useMemo(() => {
    if (!selectedStation) return [];

    const now = new Date();
    const end = addHours(now, 24);
    const series = predictTideSeries(selectedStation, now, end, 15);
    const extremes = findExtremes(series);

    const estimates: FuelEstimate[] = [];

    // Test departures every hour for the next 24 hours
    for (let h = 0; h < 24; h++) {
      const departureTime = addHours(now, h);
      departureTime.setMinutes(0, 0, 0);

      // Find relevant high water for stream timing
      const nearestHW = extremes.find(
        (e) => e.type === 'high' && Math.abs(e.time.getTime() - departureTime.getTime()) < 7 * 3600 * 1000
      );

      if (!nearestHW) continue;

      const hoursFromHW = (departureTime.getTime() - nearestHW.time.getTime()) / 3600000;
      const estimatedPassageHours = distance / cruiseSpeed;

      let totalFuel = 0;
      let favorableTime = 0;
      let adverseTime = 0;

      // Calculate fuel consumption over passage, accounting for current
      // Key principle: fuel consumption varies with cube of speed through water
      // Going against current requires more power; with current requires less
      for (let t = 0; t < estimatedPassageHours; t += 0.25) {
        const hourInCycle = hoursFromHW + t;
        // Sinusoidal stream model
        const streamPhase = ((hourInCycle + 3) / 6) * Math.PI;
        const streamRate = maxStreamRate * Math.sin(streamPhase);

        // Apply stream based on passage direction
        const effectiveStream = passageDirection === 'with-flood' ? streamRate : -streamRate;

        // Speed over ground (SOG) vs speed through water (STW)
        // To maintain constant SOG, we need to adjust STW
        const speedThroughWater = cruiseSpeed - effectiveStream;

        // Fuel consumption scales approximately with cube of speed ratio
        // (simplified from propeller law)
        const speedRatio = speedThroughWater / cruiseSpeed;
        const fuelMultiplier = Math.max(0.5, Math.min(2.5, Math.pow(speedRatio, 2.5)));

        totalFuel += baseFuelRate * fuelMultiplier * 0.25; // 0.25 hour interval

        if (effectiveStream > 0.5) favorableTime += 0.25;
        else if (effectiveStream < -0.5) adverseTime += 0.25;
      }

      // Calculate actual duration accounting for current
      let actualDuration = 0;
      let distanceCovered = 0;
      for (let t = 0; distanceCovered < distance && t < estimatedPassageHours * 2; t += 0.25) {
        const hourInCycle = hoursFromHW + t;
        const streamPhase = ((hourInCycle + 3) / 6) * Math.PI;
        const streamRate = maxStreamRate * Math.sin(streamPhase);
        const effectiveStream = passageDirection === 'with-flood' ? streamRate : -streamRate;

        const speedOverGround = cruiseSpeed + effectiveStream;
        distanceCovered += Math.max(0.5, speedOverGround) * 0.25;
        actualDuration += 0.25;
      }

      const arrivalTime = new Date(departureTime.getTime() + actualDuration * 3600000);

      // Determine tidal effect
      let tidalEffect: FuelEstimate['tidalEffect'];
      if (favorableTime > adverseTime * 1.5) tidalEffect = 'favorable';
      else if (adverseTime > favorableTime * 1.5) tidalEffect = 'adverse';
      else tidalEffect = 'mixed';

      // Rate the estimate (lower fuel = better)
      // Will be normalized after all estimates are calculated
      estimates.push({
        departureTime,
        arrivalTime,
        duration: actualDuration,
        fuelUsed: totalFuel,
        avgConsumptionRate: totalFuel / actualDuration,
        tidalEffect,
        savings: 0, // Will be calculated
        rating: 'fair', // Will be calculated
      });
    }

    // Normalize ratings based on fuel consumption range
    if (estimates.length > 0) {
      const minFuel = Math.min(...estimates.map((e) => e.fuelUsed));
      const maxFuel = Math.max(...estimates.map((e) => e.fuelUsed));
      const range = maxFuel - minFuel;

      estimates.forEach((e) => {
        e.savings = maxFuel - e.fuelUsed;
        const percentile = range > 0 ? (maxFuel - e.fuelUsed) / range : 0.5;

        if (percentile >= 0.75) e.rating = 'excellent';
        else if (percentile >= 0.5) e.rating = 'good';
        else if (percentile >= 0.25) e.rating = 'fair';
        else e.rating = 'poor';
      });
    }

    return estimates;
  }, [selectedStation, distance, cruiseSpeed, baseFuelRate, maxStreamRate, passageDirection]);

  const bestEstimate = useMemo(
    () => (fuelEstimates.length > 0 ? fuelEstimates.reduce((a, b) => (a.fuelUsed < b.fuelUsed ? a : b)) : null),
    [fuelEstimates]
  );

  const worstEstimate = useMemo(
    () => (fuelEstimates.length > 0 ? fuelEstimates.reduce((a, b) => (a.fuelUsed > b.fuelUsed ? a : b)) : null),
    [fuelEstimates]
  );

  const unitMultiplier = unit === 'liters' ? 3.785 : 1;
  const unitLabel = unit === 'liters' ? 'L' : 'gal';

  const getRatingColor = (rating: FuelEstimate['rating']) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-600';
      case 'good':
        return 'bg-blue-600';
      case 'fair':
        return 'bg-yellow-600';
      case 'poor':
        return 'bg-red-600';
    }
  };

  const getTidalIcon = (effect: FuelEstimate['tidalEffect']) => {
    switch (effect) {
      case 'favorable':
        return '🌊✓';
      case 'adverse':
        return '🌊✗';
      case 'mixed':
        return '🌊~';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">Fuel Consumption Estimator</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-medium text-amber-400 mb-2">How Tides Affect Fuel Consumption</p>
            <p className="mb-2">
              Fuel consumption varies with speed through the water, not over ground. When fighting an adverse
              current, your engine works harder to maintain speed, burning significantly more fuel.
            </p>
            <p>
              This calculator estimates optimal departure times to minimize fuel usage by timing your passage
              with favorable tidal currents.
            </p>
          </div>

          {/* Vessel Parameters */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Vessel & Voyage Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Distance (nm)</label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cruise Speed (kts)</label>
                <input
                  type="number"
                  value={cruiseSpeed}
                  onChange={(e) => setCruiseSpeed(Number(e.target.value))}
                  min={1}
                  max={50}
                  step={0.5}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Base Fuel Rate ({unitLabel}/hr)
                </label>
                <input
                  type="number"
                  value={(baseFuelRate * unitMultiplier).toFixed(1)}
                  onChange={(e) => setBaseFuelRate(Number(e.target.value) / unitMultiplier)}
                  min={0.1}
                  max={100}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Stream Rate (kts)</label>
                <input
                  type="number"
                  value={maxStreamRate}
                  onChange={(e) => setMaxStreamRate(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Passage Direction</label>
                <select
                  value={passageDirection}
                  onChange={(e) => setPassageDirection(e.target.value as 'with-flood' | 'with-ebb')}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                >
                  <option value="with-flood">Best with Flood (going inland)</option>
                  <option value="with-ebb">Best with Ebb (going seaward)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Units</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'gallons' | 'liters')}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                >
                  <option value="gallons">Gallons</option>
                  <option value="liters">Liters</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          {bestEstimate && worstEstimate && (
            <div className="bg-gradient-to-r from-green-900/50 to-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-400 mb-2">Fuel Savings Opportunity</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Best departure:</p>
                  <p className="text-white font-medium">{format(bestEstimate.departureTime, 'HH:mm')}</p>
                  <p className="text-green-400">
                    {(bestEstimate.fuelUsed * unitMultiplier).toFixed(1)} {unitLabel}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Worst departure:</p>
                  <p className="text-white font-medium">{format(worstEstimate.departureTime, 'HH:mm')}</p>
                  <p className="text-red-400">
                    {(worstEstimate.fuelUsed * unitMultiplier).toFixed(1)} {unitLabel}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-slate-300">
                  Potential savings:{' '}
                  <span className="text-green-400 font-medium">
                    {((worstEstimate.fuelUsed - bestEstimate.fuelUsed) * unitMultiplier).toFixed(1)} {unitLabel}
                  </span>{' '}
                  <span className="text-slate-400">
                    ({(((worstEstimate.fuelUsed - bestEstimate.fuelUsed) / worstEstimate.fuelUsed) * 100).toFixed(0)}%)
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Departure Options */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Departure Options (Next 24 Hours)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fuelEstimates.map((estimate, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    estimate === bestEstimate ? 'bg-green-900/30 ring-1 ring-green-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${getRatingColor(estimate.rating)}`}
                    title={estimate.rating}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {format(estimate.departureTime, 'HH:mm')}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-400">{format(estimate.arrivalTime, 'HH:mm')}</span>
                      <span className="text-xs text-slate-500">
                        ({estimate.duration.toFixed(1)}h)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex gap-2">
                      <span>{getTidalIcon(estimate.tidalEffect)}</span>
                      <span>{estimate.tidalEffect} current</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {(estimate.fuelUsed * unitMultiplier).toFixed(1)} {unitLabel}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(estimate.avgConsumptionRate * unitMultiplier).toFixed(1)} {unitLabel}/hr
                    </p>
                  </div>
                  {estimate.savings > 0.1 && (
                    <div className="text-xs text-green-400">
                      -{(estimate.savings * unitMultiplier).toFixed(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Fuel Efficiency Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Time departure to have favorable current for longest portion of voyage</li>
              <li>Consider reducing speed when bucking current (saves more fuel than you lose in time)</li>
              <li>In strong adverse current, waiting for slack may use less total fuel</li>
              <li>Actual consumption varies with sea state, wind, and vessel loading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
