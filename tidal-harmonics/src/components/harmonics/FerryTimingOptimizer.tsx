import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface FerryTimingOptimizerProps {
  onClose: () => void;
}

// Common ferry routes with approximate info
const FERRY_ROUTES = [
  {
    name: 'Dover - Calais',
    distance: 21, // nautical miles
    typicalTime: 90, // minutes
    currentEffect: 'significant',
    notes: 'Strong cross-currents near Dover',
  },
  {
    name: 'Portsmouth - Cherbourg',
    distance: 65,
    typicalTime: 180,
    currentEffect: 'moderate',
    notes: 'Some tidal gate timing needed',
  },
  {
    name: 'Fishguard - Rosslare',
    distance: 54,
    typicalTime: 210,
    currentEffect: 'moderate',
    notes: 'St. George\'s Channel currents',
  },
  {
    name: 'Seattle - Bainbridge',
    distance: 5,
    typicalTime: 35,
    currentEffect: 'low',
    notes: 'Puget Sound currents',
  },
  {
    name: 'Staten Island Ferry',
    distance: 5,
    typicalTime: 25,
    currentEffect: 'moderate',
    notes: 'Upper Bay tidal currents',
  },
  {
    name: 'Sydney - Manly',
    distance: 7,
    typicalTime: 30,
    currentEffect: 'low',
    notes: 'Harbour currents minimal',
  },
];

// Calculate optimal departure times
function calculateOptimalDepartures(
  startHour: number,
  endHour: number,
  _routeDistance: number,
  avgSpeed: number,
  tideEffect: 'low' | 'moderate' | 'significant'
): Array<{ hour: number; rating: 'excellent' | 'good' | 'fair' | 'poor'; speedAdjust: number }> {
  const results = [];

  // Simplified model based on typical tidal patterns
  for (let hour = startHour; hour <= endHour; hour++) {
    // Approximate tidal current effect
    // Peak currents typically 3 hours before/after high/low water
    const tidalPhase = ((hour + 3) % 6.2) / 6.2; // Rough approximation
    const currentStrength = Math.sin(tidalPhase * Math.PI * 2);

    let speedAdjust = 0;
    let rating: 'excellent' | 'good' | 'fair' | 'poor';

    switch (tideEffect) {
      case 'significant':
        speedAdjust = currentStrength * 3; // Up to 3 knot effect
        break;
      case 'moderate':
        speedAdjust = currentStrength * 1.5;
        break;
      case 'low':
        speedAdjust = currentStrength * 0.5;
        break;
    }

    // Rate the departure time
    const effectiveSpeed = avgSpeed + speedAdjust;
    const speedRatio = effectiveSpeed / avgSpeed;

    if (speedRatio >= 1.1) {
      rating = 'excellent';
    } else if (speedRatio >= 1.0) {
      rating = 'good';
    } else if (speedRatio >= 0.9) {
      rating = 'fair';
    } else {
      rating = 'poor';
    }

    results.push({ hour, rating, speedAdjust });
  }

  return results;
}

export function FerryTimingOptimizer({ onClose }: FerryTimingOptimizerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [vesselSpeed, setVesselSpeed] = useState(15);
  const [departureWindow, setDepartureWindow] = useState<[number, number]>([6, 22]);

  // Route is always defined because FERRY_ROUTES is a non-empty const array
  const route = FERRY_ROUTES[selectedRoute] ?? FERRY_ROUTES[0]!;

  // Calculate tide-based timing suggestions
  const timingAnalysis = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const results: Array<{
      time: Date;
      tideHeight: number;
      tideRate: number;
      recommendation: string;
      score: number;
    }> = [];

    // Analyze next 24 hours in 1-hour increments
    for (let h = 0; h < 24; h++) {
      const time = new Date(now.getTime() + h * 3600000);
      const hour = time.getHours();

      // Skip hours outside departure window
      if (hour < departureWindow[0] || hour > departureWindow[1]) continue;

      const height = predictTide(selectedStation, time);
      const heightBefore = predictTide(
        selectedStation,
        new Date(time.getTime() - 1800000)
      );
      const heightAfter = predictTide(
        selectedStation,
        new Date(time.getTime() + 1800000)
      );

      const tideRate = (heightAfter - heightBefore) * 2; // rate per hour

      // Calculate score based on:
      // 1. Favorable tidal current (rate near zero = slack = good for cross-channel)
      // 2. Tide height (higher = more clearance)
      let score = 100;

      // For cross-channel, slack water is often best
      const rateImpact = Math.abs(tideRate) * 10;
      score -= rateImpact;

      // Height bonus (small)
      score += height * 2;

      let recommendation: string;
      if (Math.abs(tideRate) < 0.3) {
        recommendation = 'Near slack water - minimal drift';
      } else if (tideRate > 0) {
        recommendation = 'Flood tide - current setting';
      } else {
        recommendation = 'Ebb tide - current easing';
      }

      results.push({
        time,
        tideHeight: height,
        tideRate,
        recommendation,
        score: Math.max(0, Math.min(100, score)),
      });
    }

    // Sort by score
    return results.sort((a, b) => b.score - a.score);
  }, [selectedStation, departureWindow]);

  // Simplified optimal times based on route
  const optimalTimes = useMemo(() => {
    return calculateOptimalDepartures(
      departureWindow[0],
      departureWindow[1],
      route.distance,
      vesselSpeed,
      route.currentEffect as 'low' | 'moderate' | 'significant'
    );
  }, [route, vesselSpeed, departureWindow]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Ferry Timing Optimizer</h3>
            <p className="text-slate-400 text-sm">
              Optimize crossing times with tidal currents
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

        {/* Route Selection */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Select Route</h4>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(Number(e.target.value))}
            className="w-full bg-slate-700 text-slate-200 rounded px-3 py-2 text-sm"
          >
            {FERRY_ROUTES.map((r, i) => (
              <option key={r.name} value={i}>
                {r.name} ({r.distance} nm)
              </option>
            ))}
          </select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400">Distance</p>
              <p className="text-lg font-mono text-cyan-400">{route.distance} nm</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Typical Time</p>
              <p className="text-lg font-mono text-slate-200">{route.typicalTime} min</p>
            </div>
          </div>
          <div className="mt-2 p-2 bg-slate-700/50 rounded">
            <p className="text-xs text-slate-400">Tidal effect: <span className={`font-medium ${
              route.currentEffect === 'significant' ? 'text-orange-400' :
              route.currentEffect === 'moderate' ? 'text-yellow-400' : 'text-green-400'
            }`}>{route.currentEffect}</span></p>
            <p className="text-xs text-slate-400 mt-1">{route.notes}</p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vessel Speed (kn)</label>
              <input
                type="number"
                min="5"
                max="40"
                value={vesselSpeed}
                onChange={(e) => setVesselSpeed(Number(e.target.value))}
                className="w-full bg-slate-700 text-slate-200 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Departure Window</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={departureWindow[0]}
                  onChange={(e) => setDepartureWindow([Number(e.target.value), departureWindow[1]])}
                  className="w-12 bg-slate-700 text-slate-200 rounded px-1 py-1 text-sm text-center"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={departureWindow[1]}
                  onChange={(e) => setDepartureWindow([departureWindow[0], Number(e.target.value)])}
                  className="w-12 bg-slate-700 text-slate-200 rounded px-1 py-1 text-sm text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Analysis */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Departure Time Analysis</h4>
          <div className="grid grid-cols-4 gap-1">
            {optimalTimes.map((t) => (
              <div
                key={t.hour}
                className={`p-2 rounded text-center ${
                  t.rating === 'excellent' ? 'bg-green-900/50 border border-green-600' :
                  t.rating === 'good' ? 'bg-blue-900/50 border border-blue-600' :
                  t.rating === 'fair' ? 'bg-yellow-900/50 border border-yellow-600' :
                  'bg-red-900/50 border border-red-600'
                }`}
              >
                <p className="text-lg font-mono text-slate-200">
                  {t.hour.toString().padStart(2, '0')}:00
                </p>
                <p className={`text-xs ${
                  t.rating === 'excellent' ? 'text-green-400' :
                  t.rating === 'good' ? 'text-blue-400' :
                  t.rating === 'fair' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {t.rating}
                </p>
                <p className="text-xs text-slate-500">
                  {t.speedAdjust >= 0 ? '+' : ''}{t.speedAdjust.toFixed(1)} kn
                </p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-600 rounded" /> Excellent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-600 rounded" /> Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-600 rounded" /> Fair
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-600 rounded" /> Poor
            </span>
          </div>
        </div>

        {/* Tide-Based Recommendations */}
        {timingAnalysis && timingAnalysis.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Best Times (Next 24 Hours)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timingAnalysis.slice(0, 6).map((t, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded ${
                    i === 0 ? 'bg-green-900/30 border border-green-600' : 'bg-slate-700/50'
                  }`}
                >
                  <div>
                    <p className="text-sm text-slate-200">
                      {t.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {i === 0 && <span className="ml-2 text-xs text-green-400">RECOMMENDED</span>}
                    </p>
                    <p className="text-xs text-slate-400">{t.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-slate-300">
                      Score: {t.score.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Tide: {t.tideHeight.toFixed(1)}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Timing Tips</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">🌊</span>
              <span>
                <strong className="text-slate-300">Cross-channel:</strong> Aim for slack water
                to minimize lateral drift from tidal streams.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">🚀</span>
              <span>
                <strong className="text-slate-300">With current:</strong> Plan departures to
                catch favorable tidal streams for faster passages.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">⚠️</span>
              <span>
                <strong className="text-slate-300">Spring tides:</strong> Current effects are
                amplified - timing becomes more critical.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">🔄</span>
              <span>
                <strong className="text-slate-300">Tidal gates:</strong> Some harbors have limited
                access windows - verify arrival timing too.
              </span>
            </li>
          </ul>
        </div>

        {/* Formula */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Time Savings Calculator</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">With favorable current</p>
              <p className="text-lg text-green-400">
                {Math.round(route.distance / (vesselSpeed + 2) * 60)} min
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Against current</p>
              <p className="text-lg text-red-400">
                {Math.round(route.distance / (vesselSpeed - 2) * 60)} min
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Assuming ±2 knot current effect (varies by route and conditions)
          </p>
        </div>
      </div>
    </div>
  );
}
