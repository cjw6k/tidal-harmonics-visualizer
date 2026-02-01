import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours, addMinutes } from 'date-fns';

interface WaypointRoutePlannerProps {
  onClose: () => void;
}

interface Waypoint {
  id: string;
  name: string;
  distance: number; // nm from start (cumulative)
  tidalGate: boolean; // requires specific tidal timing
  gateType: 'slack-only' | 'flood-only' | 'ebb-only' | 'any';
  notes: string;
}

interface RouteLeg {
  from: Waypoint;
  to: Waypoint;
  distance: number;
  departureTime: Date;
  arrivalTime: Date;
  tidalCondition: string;
  waitTime: number; // minutes waiting for tidal gate
}

interface RouteOption {
  startTime: Date;
  legs: RouteLeg[];
  totalTime: number; // minutes including waits
  totalWaitTime: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}

const DEFAULT_WAYPOINTS: Waypoint[] = [
  { id: '1', name: 'Departure', distance: 0, tidalGate: false, gateType: 'any', notes: '' },
  { id: '2', name: 'Tidal Gate 1', distance: 8, tidalGate: true, gateType: 'slack-only', notes: 'Narrow passage' },
  { id: '3', name: 'Arrival', distance: 20, tidalGate: false, gateType: 'any', notes: '' },
];

export function WaypointRoutePlanner({ onClose }: WaypointRoutePlannerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  const [waypoints, setWaypoints] = useState<Waypoint[]>(DEFAULT_WAYPOINTS);
  const [boatSpeed, setBoatSpeed] = useState(6); // knots
  const [maxStreamRate, setMaxStreamRate] = useState(3); // knots at tidal gates

  // Calculate tidal windows for the next 24 hours
  const tidalWindows = useMemo(() => {
    if (!selectedStation) return { slackTimes: [], floodTimes: [], ebbTimes: [] };

    const now = new Date();
    const end = addHours(now, 36);
    const series = predictTideSeries(selectedStation, now, end, 10);
    const extremes = findExtremes(series);

    const slackTimes: Date[] = [];
    const floodTimes: { start: Date; end: Date }[] = [];
    const ebbTimes: { start: Date; end: Date }[] = [];

    extremes.forEach((extreme, i) => {
      // Slack water at each extreme
      slackTimes.push(extreme.time);

      // Flood: from low to high water
      // Ebb: from high to low water
      if (i < extremes.length - 1) {
        const next = extremes[i + 1];
        if (next) {
          if (extreme.type === 'low') {
            floodTimes.push({ start: extreme.time, end: next.time });
          } else {
            ebbTimes.push({ start: extreme.time, end: next.time });
          }
        }
      }
    });

    return { slackTimes, floodTimes, ebbTimes };
  }, [selectedStation]);

  // Generate route options for different start times
  const routeOptions = useMemo(() => {
    if (!selectedStation || waypoints.length < 2) return [];

    const now = new Date();
    const options: RouteOption[] = [];

    // Try starting at different times
    for (let h = 0; h < 24; h += 1) {
      const startTime = addHours(now, h);
      startTime.setMinutes(0, 0, 0);

      const legs: RouteLeg[] = [];
      let currentTime = startTime;
      let totalWaitTime = 0;
      let routeFeasible = true;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const from = waypoints[i]!;
        const to = waypoints[i + 1]!;
        const legDistance = to.distance - from.distance;

        // Calculate base travel time
        const travelMinutes = (legDistance / boatSpeed) * 60;

        // Check if destination has a tidal gate requirement
        let waitMinutes = 0;
        let tidalCondition = 'any';

        if (to.tidalGate) {
          const arrivalTime = addMinutes(currentTime, travelMinutes);

          if (to.gateType === 'slack-only') {
            // Find next slack water after arrival
            const nextSlack = tidalWindows.slackTimes.find((t) => t >= arrivalTime);
            if (nextSlack) {
              waitMinutes = Math.max(0, (nextSlack.getTime() - arrivalTime.getTime()) / 60000);
              // Allow 30-minute window around slack
              if (waitMinutes < 30) waitMinutes = 0;
              tidalCondition = 'slack water';
            } else {
              routeFeasible = false;
            }
          } else if (to.gateType === 'flood-only') {
            // Check if arriving during flood
            const inFlood = tidalWindows.floodTimes.some(
              (f) => arrivalTime >= f.start && arrivalTime <= f.end
            );
            if (!inFlood) {
              // Find next flood
              const nextFlood = tidalWindows.floodTimes.find((f) => f.start >= arrivalTime);
              if (nextFlood) {
                waitMinutes = Math.max(0, (nextFlood.start.getTime() - arrivalTime.getTime()) / 60000);
              } else {
                routeFeasible = false;
              }
            }
            tidalCondition = 'flood tide';
          } else if (to.gateType === 'ebb-only') {
            // Check if arriving during ebb
            const inEbb = tidalWindows.ebbTimes.some(
              (e) => arrivalTime >= e.start && arrivalTime <= e.end
            );
            if (!inEbb) {
              // Find next ebb
              const nextEbb = tidalWindows.ebbTimes.find((e) => e.start >= arrivalTime);
              if (nextEbb) {
                waitMinutes = Math.max(0, (nextEbb.start.getTime() - arrivalTime.getTime()) / 60000);
              } else {
                routeFeasible = false;
              }
            }
            tidalCondition = 'ebb tide';
          }
        }

        if (!routeFeasible) break;

        const departureTime = currentTime;
        const arrivalTime = addMinutes(currentTime, travelMinutes);
        const gatePassTime = addMinutes(arrivalTime, waitMinutes);

        legs.push({
          from,
          to,
          distance: legDistance,
          departureTime,
          arrivalTime,
          tidalCondition,
          waitTime: waitMinutes,
        });

        totalWaitTime += waitMinutes;
        currentTime = gatePassTime;
      }

      if (!routeFeasible) continue;

      const totalTime =
        legs.reduce((sum, leg) => sum + (leg.arrivalTime.getTime() - leg.departureTime.getTime()) / 60000, 0) +
        totalWaitTime;

      // Rate the route
      let rating: RouteOption['rating'];
      if (totalWaitTime === 0) rating = 'excellent';
      else if (totalWaitTime <= 60) rating = 'good';
      else if (totalWaitTime <= 180) rating = 'fair';
      else rating = 'poor';

      options.push({
        startTime,
        legs,
        totalTime,
        totalWaitTime,
        rating,
      });
    }

    // Sort by total time
    return options.sort((a, b) => a.totalTime - b.totalTime);
  }, [selectedStation, waypoints, boatSpeed, tidalWindows]);

  const addWaypoint = () => {
    const lastWaypoint = waypoints[waypoints.length - 1];
    if (!lastWaypoint) return;
    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      name: `Waypoint ${waypoints.length}`,
      distance: lastWaypoint.distance + 5,
      tidalGate: false,
      gateType: 'any',
      notes: '',
    };
    setWaypoints([...waypoints.slice(0, -1), newWaypoint, lastWaypoint]);
  };

  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)));
  };

  const removeWaypoint = (id: string) => {
    if (waypoints.length <= 2) return;
    setWaypoints(waypoints.filter((wp) => wp.id !== id));
  };

  const getRatingColor = (rating: RouteOption['rating']) => {
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">Waypoint Route Planner</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-medium text-emerald-400 mb-2">Tidal Gate Planning</p>
            <p>
              Plan routes through areas with tidal constraints. Mark waypoints as "tidal gates" that
              require specific conditions (slack water, flood, or ebb) to pass safely. The planner
              finds optimal departure times to minimize waiting at gates.
            </p>
          </div>

          {/* Parameters */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Vessel Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Boat Speed (kts)</label>
                <input
                  type="number"
                  value={boatSpeed}
                  onChange={(e) => setBoatSpeed(Number(e.target.value))}
                  min={1}
                  max={30}
                  step={0.5}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Stream at Gates (kts)</label>
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
          </div>

          {/* Waypoints */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-slate-300">Route Waypoints</h3>
              <button
                onClick={addWaypoint}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs text-white"
              >
                + Add Waypoint
              </button>
            </div>

            <div className="space-y-3">
              {waypoints.map((wp, i) => (
                <div key={wp.id} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
                  <div className="text-slate-500 text-sm font-mono w-6">{i + 1}.</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={wp.name}
                        onChange={(e) => updateWaypoint(wp.id, { name: e.target.value })}
                        className="flex-1 px-2 py-1 bg-slate-600 rounded text-white text-sm"
                        placeholder="Waypoint name"
                      />
                      <input
                        type="number"
                        value={wp.distance}
                        onChange={(e) => updateWaypoint(wp.id, { distance: Number(e.target.value) })}
                        className="w-20 px-2 py-1 bg-slate-600 rounded text-white text-sm text-right"
                        placeholder="nm"
                        min={0}
                      />
                      <span className="text-slate-400 text-sm py-1">nm</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={wp.tidalGate}
                          onChange={(e) => updateWaypoint(wp.id, { tidalGate: e.target.checked })}
                          className="rounded bg-slate-600 border-slate-500"
                        />
                        Tidal Gate
                      </label>

                      {wp.tidalGate && (
                        <select
                          value={wp.gateType}
                          onChange={(e) =>
                            updateWaypoint(wp.id, { gateType: e.target.value as Waypoint['gateType'] })
                          }
                          className="px-2 py-1 bg-slate-600 rounded text-white text-xs"
                        >
                          <option value="slack-only">Slack water only</option>
                          <option value="flood-only">Flood tide only</option>
                          <option value="ebb-only">Ebb tide only</option>
                          <option value="any">Any conditions</option>
                        </select>
                      )}

                      {i > 0 && i < waypoints.length - 1 && (
                        <button
                          onClick={() => removeWaypoint(wp.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Options */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              Best Departure Times (Next 24 Hours)
            </h3>

            {routeOptions.length === 0 ? (
              <div className="text-center text-slate-500 py-4">
                No feasible routes found. Check tidal gate requirements.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {routeOptions.slice(0, 12).map((option, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${i === 0 ? 'bg-emerald-900/30 ring-1 ring-emerald-500' : 'bg-slate-800'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getRatingColor(option.rating)}`} />
                        <span className="text-white font-medium">
                          Depart: {format(option.startTime, 'HH:mm')}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">Total: </span>
                        <span className="text-white">{formatDuration(option.totalTime)}</span>
                        {option.totalWaitTime > 0 && (
                          <span className="text-yellow-400 ml-2">
                            (wait: {formatDuration(option.totalWaitTime)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-5 space-y-1 text-xs">
                      {option.legs.map((leg, j) => (
                        <div key={j} className="flex items-center gap-2 text-slate-400">
                          <span>{format(leg.departureTime, 'HH:mm')}</span>
                          <span className="text-slate-600">→</span>
                          <span>{leg.from.name}</span>
                          <span className="text-slate-600">to</span>
                          <span>{leg.to.name}</span>
                          <span className="text-slate-500">({leg.distance.toFixed(1)} nm)</span>
                          {leg.to.tidalGate && (
                            <span className="text-cyan-400">
                              [{leg.tidalCondition}
                              {leg.waitTime > 0 && `, wait ${formatDuration(leg.waitTime)}`}]
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Tidal Gate Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Narrow passages often require slack water for safe transit</li>
              <li>Some channels can only be entered on the flood (against ebb current)</li>
              <li>Plan to arrive at gates with margin - conditions vary from predictions</li>
              <li>Consider fuel stops and crew rest when planning long routes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
