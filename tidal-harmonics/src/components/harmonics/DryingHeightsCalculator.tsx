import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface DryingHeightsCalculatorProps {
  onClose: () => void;
}

interface DryingWindow {
  start: Date;
  end: Date;
  duration: number; // hours
  lowestTide: number;
  maxExposure: number; // how much above water level the bottom is at lowest
}

export function DryingHeightsCalculator({ onClose }: DryingHeightsCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const epoch = useTimeStore((s) => s.epoch);
  const currentTime = useMemo(() => new Date(epoch), [epoch]);

  // Chart datum drying height (height above chart datum that dries)
  const [dryingHeight, setDryingHeight] = useState(1.5);

  // Calculate when the area is exposed
  const analysis = useMemo(() => {
    if (!selectedStation) return null;

    const end = addHours(currentTime, 72); // 3 days ahead
    const series = predictTideSeries(selectedStation, currentTime, end, 10);
    const extremes = findExtremes(series);

    // Find drying windows (when tide < drying height)
    const dryingWindows: DryingWindow[] = [];
    let windowStart: Date | null = null;
    let windowLowest = Infinity;

    for (const point of series) {
      const isExposed = point.height < dryingHeight;

      if (isExposed && !windowStart) {
        // Start of drying window
        windowStart = point.time;
        windowLowest = point.height;
      } else if (isExposed && windowStart) {
        // Continue window, track lowest
        if (point.height < windowLowest) {
          windowLowest = point.height;
        }
      } else if (!isExposed && windowStart) {
        // End of drying window
        dryingWindows.push({
          start: windowStart,
          end: point.time,
          duration: (point.time.getTime() - windowStart.getTime()) / (1000 * 60 * 60),
          lowestTide: windowLowest,
          maxExposure: dryingHeight - windowLowest,
        });
        windowStart = null;
        windowLowest = Infinity;
      }
    }

    // Calculate coverage statistics
    const currentTide = series[0]?.height ?? 0;
    const isCurrentlyExposed = currentTide < dryingHeight;
    const currentWaterDepth = isCurrentlyExposed ? 0 : currentTide - dryingHeight;
    const currentExposure = isCurrentlyExposed ? dryingHeight - currentTide : 0;

    // Find next state change
    let nextChange: { time: Date; type: 'covers' | 'exposes' } | null = null;
    for (let i = 1; i < series.length; i++) {
      const prevExposed = series[i - 1]!.height < dryingHeight;
      const currExposed = series[i]!.height < dryingHeight;
      if (prevExposed !== currExposed) {
        nextChange = {
          time: series[i]!.time,
          type: currExposed ? 'exposes' : 'covers',
        };
        break;
      }
    }

    // Calculate safe working time at lowest water
    const lowestTide = Math.min(...extremes.filter(e => e.type === 'low').map(e => e.height));
    const maxExposure = dryingHeight - lowestTide;

    return {
      currentTide,
      isCurrentlyExposed,
      currentWaterDepth,
      currentExposure,
      nextChange,
      dryingWindows,
      lowestTide,
      maxExposure,
      extremes,
    };
  }, [selectedStation, currentTime, dryingHeight]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(2)} m`;
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400">Drying Heights Calculator</h3>
            <p className="text-slate-400 text-sm">
              Calculate when intertidal areas expose and cover
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

        {/* Input */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <label className="block text-xs text-slate-400 mb-1">
            Charted Drying Height (above chart datum)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={dryingHeight}
              onChange={(e) => setDryingHeight(parseFloat(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              value={dryingHeight}
              onChange={(e) => setDryingHeight(parseFloat(e.target.value) || 0)}
              step="0.1"
              className="w-20 bg-slate-700 rounded px-2 py-1 text-right font-mono"
            />
            <span className="text-slate-400 text-sm">
              {unitSystem === 'imperial' ? 'ft' : 'm'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enter the drying height shown on your chart (underlined figures)
          </p>
        </div>

        {analysis && (
          <>
            {/* Current Status */}
            <div className={`rounded-lg p-4 mb-4 ${
              analysis.isCurrentlyExposed ? 'bg-yellow-900/30' : 'bg-blue-900/30'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">
                  {analysis.isCurrentlyExposed ? '🏖️' : '🌊'}
                </span>
                <div>
                  <p className={`text-lg font-medium ${
                    analysis.isCurrentlyExposed ? 'text-yellow-300' : 'text-blue-300'
                  }`}>
                    {analysis.isCurrentlyExposed ? 'Currently Exposed' : 'Currently Covered'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Tide: {formatHeight(analysis.currentTide)}
                  </p>
                </div>
              </div>

              {analysis.isCurrentlyExposed ? (
                <p className="text-sm text-slate-300">
                  Bottom is <span className="font-mono text-yellow-400">{formatHeight(analysis.currentExposure)}</span> above water level
                </p>
              ) : (
                <p className="text-sm text-slate-300">
                  Water depth over the area: <span className="font-mono text-blue-400">{formatHeight(analysis.currentWaterDepth)}</span>
                </p>
              )}

              {analysis.nextChange && (
                <p className="text-xs text-slate-400 mt-2">
                  {analysis.nextChange.type === 'exposes' ? 'Will expose' : 'Will cover'} at{' '}
                  {format(analysis.nextChange.time, 'HH:mm')}
                </p>
              )}
            </div>

            {/* Upcoming Drying Windows */}
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Exposure Windows (Next 72h)
              </h4>
              {analysis.dryingWindows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This area will not be exposed in the next 72 hours at current drying height setting.
                </p>
              ) : (
                <div className="space-y-2">
                  {analysis.dryingWindows.slice(0, 6).map((window, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-yellow-900/20 rounded"
                    >
                      <div>
                        <p className="text-sm text-slate-300">
                          {format(window.start, 'EEE HH:mm')} - {format(window.end, 'HH:mm')}
                        </p>
                        <p className="text-xs text-slate-500">
                          Max exposure: {formatHeight(window.maxExposure)} above water
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-yellow-400">
                          {formatDuration(window.duration)}
                        </p>
                        <p className="text-xs text-slate-500">
                          exposed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Lowest Upcoming Tide</p>
                <p className="text-lg font-mono text-cyan-400">
                  {formatHeight(analysis.lowestTide)}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Max Exposure Height</p>
                <p className="text-lg font-mono text-yellow-400">
                  {formatHeight(analysis.maxExposure > 0 ? analysis.maxExposure : 0)}
                </p>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Understanding Drying Heights</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  <strong className="text-slate-300">Drying heights</strong> on charts show areas
                  that uncover at low water. They're measured above chart datum (usually LAT - Lowest
                  Astronomical Tide).
                </p>
                <p>
                  An area with a drying height of {formatHeight(dryingHeight)} will be exposed whenever
                  the tide falls below {formatHeight(dryingHeight)}.
                </p>
                <div className="p-2 bg-amber-900/30 rounded text-xs text-amber-200">
                  <strong>Caution:</strong> Always add a safety margin. Atmospheric pressure and wind
                  can affect actual water levels. Never anchor in areas that may dry without being
                  prepared for grounding.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
