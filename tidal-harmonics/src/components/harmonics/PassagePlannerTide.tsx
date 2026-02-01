import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface PassagePlannerTideProps {
  onClose: () => void;
}

interface PassageOption {
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // minutes
  tidalEffect: number; // net gain/loss in nm
  effectiveSpeed: number; // knots
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
}

export function PassagePlannerTide({ onClose }: PassagePlannerTideProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  // Passage parameters
  const [distance, setDistance] = useState(20); // nm
  const [boatSpeed, setBoatSpeed] = useState(6); // knots
  const [maxStreamRate, setMaxStreamRate] = useState(2); // knots
  const [passageDirection, setPassageDirection] = useState<'with-flood' | 'with-ebb'>('with-flood');

  // Calculate passage options for different departure times
  const passageOptions = useMemo(() => {
    if (!selectedStation) return [];

    const now = new Date();
    const end = addHours(now, 24);
    const series = predictTideSeries(selectedStation, now, end, 15);
    const extremes = findExtremes(series);

    const options: PassageOption[] = [];

    // Test departures every hour for the next 24 hours
    for (let h = 0; h < 24; h++) {
      const departureTime = addHours(now, h);
      departureTime.setMinutes(0, 0, 0);

      // Find relevant high water for stream timing
      const nearestHW = extremes.find((e) => e.type === 'high' && Math.abs(e.time.getTime() - departureTime.getTime()) < 7 * 3600 * 1000);

      if (!nearestHW) continue;

      // Calculate hours from HW at departure
      const hoursFromHW = (departureTime.getTime() - nearestHW.time.getTime()) / 3600000;

      // Estimate average stream during passage based on departure timing
      // Stream pattern: max flood at HW-3, slack at HW, max ebb at HW+3
      const estimatedPassageHours = distance / boatSpeed;
      let totalStreamEffect = 0;

      // Integrate stream effect over passage duration (simplified)
      for (let t = 0; t < estimatedPassageHours; t += 0.5) {
        const hourInCycle = hoursFromHW + t;
        // Sinusoidal stream model: positive = flood, negative = ebb
        const streamPhase = ((hourInCycle + 3) / 6) * Math.PI;
        const streamRate = maxStreamRate * Math.sin(streamPhase);

        // Apply stream effect based on passage direction
        const effectiveStream = passageDirection === 'with-flood' ? streamRate : -streamRate;
        totalStreamEffect += effectiveStream * 0.5; // 0.5 hour interval
      }

      // Calculate effective speed and duration
      const avgStreamBoost = totalStreamEffect / estimatedPassageHours;
      const effectiveSpeed = boatSpeed + avgStreamBoost;
      const actualDuration = (distance / effectiveSpeed) * 60; // minutes
      const arrivalTime = new Date(departureTime.getTime() + actualDuration * 60000);

      // Calculate time saved/lost compared to slack water passage
      const slackDuration = (distance / boatSpeed) * 60;
      const timeDiff = slackDuration - actualDuration;

      // Rate the passage
      let rating: PassageOption['rating'];
      let description: string;

      if (timeDiff > 15) {
        rating = 'excellent';
        description = `Save ${Math.round(timeDiff)} min with favorable current`;
      } else if (timeDiff > 5) {
        rating = 'good';
        description = `Save ${Math.round(timeDiff)} min, mostly favorable`;
      } else if (timeDiff > -5) {
        rating = 'fair';
        description = 'Mixed currents, near slack water';
      } else {
        rating = 'poor';
        description = `Lose ${Math.round(-timeDiff)} min against current`;
      }

      options.push({
        departureTime,
        arrivalTime,
        duration: Math.round(actualDuration),
        tidalEffect: totalStreamEffect,
        effectiveSpeed,
        rating,
        description,
      });
    }

    return options;
  }, [selectedStation, distance, boatSpeed, maxStreamRate, passageDirection]);

  // Find best option
  const bestOption = useMemo(() => {
    if (passageOptions.length === 0) return null;
    return passageOptions.reduce((best, opt) =>
      opt.duration < best.duration ? opt : best
    );
  }, [passageOptions]);

  // Find worst option for comparison
  const worstOption = useMemo(() => {
    if (passageOptions.length === 0) return null;
    return passageOptions.reduce((worst, opt) =>
      opt.duration > worst.duration ? opt : worst
    );
  }, [passageOptions]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getRatingColor = (rating: PassageOption['rating']) => {
    switch (rating) {
      case 'excellent': return 'text-green-400 bg-green-900/30';
      case 'good': return 'text-lime-400 bg-lime-900/30';
      case 'fair': return 'text-yellow-400 bg-yellow-900/30';
      case 'poor': return 'text-red-400 bg-red-900/30';
    }
  };

  if (!selectedStation) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🧭 Tide-Optimized Passage Planner
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Summary */}
          {bestOption && worstOption && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Potential Savings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-900/30 rounded p-3">
                  <div className="text-xs text-green-400 mb-1">Best Departure</div>
                  <div className="text-lg font-bold text-green-300">
                    {format(bestOption.departureTime, 'HH:mm')}
                  </div>
                  <div className="text-sm text-slate-300">
                    {formatDuration(bestOption.duration)}
                  </div>
                </div>
                <div className="bg-red-900/30 rounded p-3">
                  <div className="text-xs text-red-400 mb-1">Worst Departure</div>
                  <div className="text-lg font-bold text-red-300">
                    {format(worstOption.departureTime, 'HH:mm')}
                  </div>
                  <div className="text-sm text-slate-300">
                    {formatDuration(worstOption.duration)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-amber-400">
                Optimal timing saves up to {formatDuration(worstOption.duration - bestOption.duration)}
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Passage Parameters</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Distance (nautical miles)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{distance} nm</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Boat Speed (knots)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="0.5"
                  value={boatSpeed}
                  onChange={(e) => setBoatSpeed(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{boatSpeed.toFixed(1)} kts</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Max Tidal Stream Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={maxStreamRate}
                  onChange={(e) => setMaxStreamRate(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{maxStreamRate.toFixed(1)} kts</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Favorable Direction
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPassageDirection('with-flood')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    passageDirection === 'with-flood'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  With Flood (inland)
                </button>
                <button
                  onClick={() => setPassageDirection('with-ebb')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    passageDirection === 'with-ebb'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  With Ebb (seaward)
                </button>
              </div>
            </div>
          </div>

          {/* Passage base time */}
          <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Base passage time (slack water):</span>
              <span className="text-white">{formatDuration((distance / boatSpeed) * 60)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Station:</span>
              <span className="text-cyan-400">{selectedStation.name}</span>
            </div>
          </div>

          {/* Departure Options */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Departure Options (Next 24 Hours)
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passageOptions.map((option, idx) => {
                const isBest = option === bestOption;
                const isWorst = option === worstOption;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded ${getRatingColor(option.rating)} ${
                      isBest ? 'ring-2 ring-green-500' : isWorst ? 'ring-2 ring-red-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {isBest && <span className="text-xs bg-green-600 px-1 rounded">BEST</span>}
                        {isWorst && <span className="text-xs bg-red-600 px-1 rounded">AVOID</span>}
                        <span className="font-medium">
                          Depart: {format(option.departureTime, 'HH:mm')}
                        </span>
                      </div>
                      <span className="text-sm">
                        Arrive: {format(option.arrivalTime, 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>{formatDuration(option.duration)}</span>
                      <span>Eff. speed: {option.effectiveSpeed.toFixed(1)} kts</span>
                    </div>
                    <div className="text-xs mt-1 opacity-75">
                      {option.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• "With flood" = heading inland/upstream when tide is rising</p>
            <p>• "With ebb" = heading seaward/downstream when tide is falling</p>
            <p>• Best departures typically coincide with favorable current starting</p>
            <p>• Results are estimates; actual currents depend on local geography</p>
          </div>
        </div>
      </div>
    </div>
  );
}
