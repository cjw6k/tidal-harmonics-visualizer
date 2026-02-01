import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide, predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours, subHours } from 'date-fns';

interface TideHeightLookupProps {
  onClose: () => void;
}

export function TideHeightLookup({ onClose }: TideHeightLookupProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [queryTime, setQueryTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  // Calculate tide at query time
  const result = useMemo(() => {
    if (!selectedStation) return null;

    const time = new Date(queryTime);
    const height = predictTide(selectedStation, time);

    // Get surrounding context (±12 hours)
    const start = subHours(time, 12);
    const end = addHours(time, 12);
    const series = predictTideSeries(selectedStation, start, end, 10);

    // Find rate of change
    const before = predictTide(selectedStation, subHours(time, 0.5));
    const after = predictTide(selectedStation, addHours(time, 0.5));
    const ratePerHour = (after - before); // m/hr

    // Determine tide state
    let tideState: 'rising' | 'falling' | 'slack high' | 'slack low';
    if (Math.abs(ratePerHour) < 0.1) {
      tideState = ratePerHour >= 0 ? 'slack high' : 'slack low';
    } else {
      tideState = ratePerHour > 0 ? 'rising' : 'falling';
    }

    // Find nearby extremes
    const extremes = findExtremes(series);
    const previousExtreme = extremes.filter(e => e.time < time).pop();
    const nextExtreme = extremes.find(e => e.time > time);

    // Calculate percentage through current tidal phase
    let phaseProgress = 0;
    if (previousExtreme && nextExtreme) {
      const totalPhase = nextExtreme.time.getTime() - previousExtreme.time.getTime();
      const elapsed = time.getTime() - previousExtreme.time.getTime();
      phaseProgress = (elapsed / totalPhase) * 100;
    }

    // Find today's range
    const todayStart = new Date(time);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(time);
    todayEnd.setHours(23, 59, 59, 999);
    const todaySeries = predictTideSeries(selectedStation, todayStart, todayEnd, 10);
    const todayHeights = todaySeries.map(s => s.height);
    const todayMin = Math.min(...todayHeights);
    const todayMax = Math.max(...todayHeights);

    return {
      height,
      ratePerHour,
      tideState,
      previousExtreme,
      nextExtreme,
      phaseProgress,
      series,
      todayRange: { min: todayMin, max: todayMax },
    };
  }, [selectedStation, queryTime]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(2)} ft`;
    }
    return `${m.toFixed(3)} m`;
  };

  const formatRate = (mPerHr: number) => {
    if (unitSystem === 'imperial') {
      return `${(mPerHr * 3.28084).toFixed(2)} ft/hr`;
    }
    return `${mPerHr.toFixed(3)} m/hr`;
  };

  // Quick time buttons
  const setToNow = () => setQueryTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const addTime = (hours: number) => {
    const current = new Date(queryTime);
    setQueryTime(format(addHours(current, hours), "yyyy-MM-dd'T'HH:mm"));
  };

  const stationName = selectedStation?.name ?? 'Selected Station';
  const queryDate = new Date(queryTime);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Tide Height Lookup</h3>
            <p className="text-slate-400 text-sm">
              Get precise tide height at any time
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

        {/* Time Input */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <label className="text-xs text-slate-400">Query Time</label>
          <input
            type="datetime-local"
            value={queryTime}
            onChange={(e) => setQueryTime(e.target.value)}
            className="w-full bg-slate-700 rounded px-3 py-2 text-lg font-mono mb-2"
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={setToNow}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs"
            >
              Now
            </button>
            <button
              onClick={() => addTime(-6)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
            >
              -6h
            </button>
            <button
              onClick={() => addTime(-1)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
            >
              -1h
            </button>
            <button
              onClick={() => addTime(1)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
            >
              +1h
            </button>
            <button
              onClick={() => addTime(6)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
            >
              +6h
            </button>
            <button
              onClick={() => addTime(24)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
            >
              +24h
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <>
            {/* Main Height Display */}
            <div className="bg-slate-800 rounded-lg p-4 mb-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{stationName}</p>
              <p className="text-sm text-slate-400 mb-2">
                {format(queryDate, 'EEEE, MMMM d, yyyy')} at {format(queryDate, 'HH:mm')}
              </p>
              <p className="text-4xl font-mono font-bold text-cyan-400 mb-2">
                {formatHeight(result.height)}
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <span className={`${
                  result.tideState === 'rising' ? 'text-green-400' :
                  result.tideState === 'falling' ? 'text-orange-400' :
                  'text-slate-400'
                }`}>
                  {result.tideState === 'rising' ? '↗ Rising' :
                   result.tideState === 'falling' ? '↘ Falling' :
                   result.tideState === 'slack high' ? '⬆ Slack (High)' :
                   '⬇ Slack (Low)'}
                </span>
                <span className="text-slate-400">
                  {formatRate(result.ratePerHour)}
                </span>
              </div>
            </div>

            {/* Context Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {result.previousExtreme && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Previous</p>
                  <p className="text-lg font-mono text-slate-200">
                    {result.previousExtreme.type === 'high' ? '▲' : '▼'} {formatHeight(result.previousExtreme.height)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(result.previousExtreme.time, 'HH:mm')}
                  </p>
                </div>
              )}
              {result.nextExtreme && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Next</p>
                  <p className="text-lg font-mono text-slate-200">
                    {result.nextExtreme.type === 'high' ? '▲' : '▼'} {formatHeight(result.nextExtreme.height)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(result.nextExtreme.time, 'HH:mm')}
                  </p>
                </div>
              )}
            </div>

            {/* Phase Progress */}
            {result.previousExtreme && result.nextExtreme && (
              <div className="bg-slate-800 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>
                    {result.previousExtreme.type === 'high' ? 'High' : 'Low'} Water
                  </span>
                  <span>
                    {result.nextExtreme.type === 'high' ? 'High' : 'Low'} Water
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${result.phaseProgress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500 mt-1">
                  {result.phaseProgress.toFixed(0)}% through {result.tideState === 'rising' ? 'flood' : 'ebb'}
                </p>
              </div>
            )}

            {/* Mini tide curve */}
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-2">24-Hour Context (±12h)</p>
              <div className="h-16 relative">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {/* Tide curve */}
                  <path
                    d={`M 0 ${50 - result.series[0]!.height * 15} ` +
                      result.series.map((p, i) => {
                        const x = (i / (result.series.length - 1)) * 100;
                        const y = 50 - p.height * 15;
                        return `L ${x} ${Math.max(5, Math.min(95, y))}`;
                      }).join(' ')
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-cyan-400"
                  />
                  {/* Query time marker */}
                  <line x1="50" y1="0" x2="50" y2="100"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    className="text-white"
                  />
                  <circle
                    cx="50"
                    cy={50 - result.height * 15}
                    r="4"
                    className="fill-white"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>-12h</span>
                <span>Query</span>
                <span>+12h</span>
              </div>
            </div>

            {/* Today's Range */}
            <div className="mt-4 text-xs text-slate-500 text-center">
              Today's range: {formatHeight(result.todayRange.min)} to {formatHeight(result.todayRange.max)}
              ({formatHeight(result.todayRange.max - result.todayRange.min)} range)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
