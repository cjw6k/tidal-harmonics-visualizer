import { useMemo, useState } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTutorialStore } from '@/stores/tutorialStore';
import { predictTide, getTidalRange, findExtremes, predictTideSeries } from '@/lib/harmonics';
import { getTidalType, getTidalTypeLabel } from '@/data/stations';
import { TidalTypeExplainer } from './TidalTypeExplainer';
import { format, formatDistanceToNow } from 'date-fns';
import { formatHeight, getHeightUnit } from '@/lib/units';

/**
 * Tidal Statistics Panel
 *
 * Shows real-time statistics about the current tide prediction:
 * - Current height
 * - Today's range
 * - Next high/low tide
 * - Tidal type classification
 * - Dominant constituents
 */
export function TidalStatistics() {
  const tutorialActive = useTutorialStore((s) => s.isActive);
  // Conditionally subscribe to epoch only when tutorial is not active
  // to avoid expensive re-renders during tutorial playback
  const epoch = useTimeStore((s) => tutorialActive ? 0 : s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [showTypeExplainer, setShowTypeExplainer] = useState(false);
  const unit = getHeightUnit(unitSystem);

  // Compute stats (all hooks must be called before any return)
  const stats = useMemo(() => {
    if (!station || tutorialActive) return null;

    const now = new Date(epoch);
    const currentHeight = predictTide(station, now);
    const range = getTidalRange(station, now);

    // Find next extremes
    const futureStart = now;
    const futureEnd = new Date(now.getTime() + 26 * 3600000); // Next 26 hours
    const futureSeries = predictTideSeries(station, futureStart, futureEnd, 5);
    const futureExtremes = findExtremes(futureSeries);

    // Get dominant constituents (top 3 by amplitude)
    const sortedConstituents = [...station.constituents]
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 3);

    const tidalType = getTidalType(station);

    // Determine if tide is rising or falling
    const nearFuture = new Date(now.getTime() + 300000); // 5 min
    const futureHeight = predictTide(station, nearFuture);
    const isRising = futureHeight > currentHeight;

    return {
      currentHeight,
      range,
      isRising,
      nextExtremes: futureExtremes.slice(0, 2),
      dominantConstituents: sortedConstituents,
      tidalType,
      tidalTypeLabel: getTidalTypeLabel(tidalType),
    };
  }, [epoch, station, tutorialActive]);

  // During tutorial, hide this panel
  if (tutorialActive) {
    return null;
  }

  if (!station || !stats) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xs text-slate-400 mb-2">Current Conditions</h3>

      {/* Current height and trend */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-2xl font-bold text-white">
            {formatHeight(stats.currentHeight, unitSystem, { showUnit: false })}
          </span>
          <span className="text-slate-400 text-sm ml-1">{unit}</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
          stats.isRising ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          <span className="text-lg">{stats.isRising ? '↑' : '↓'}</span>
          <span className="text-xs">{stats.isRising ? 'Rising' : 'Falling'}</span>
        </div>
      </div>

      {/* Today's range */}
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-500">Today's Range:</span>
        <span className="text-white">
          {formatHeight(stats.range.minHeight, unitSystem)} to {formatHeight(stats.range.maxHeight, unitSystem)}
          <span className="text-slate-400 ml-1">
            ({formatHeight(stats.range.maxHeight - stats.range.minHeight, unitSystem)})
          </span>
        </span>
      </div>

      {/* Next high/low */}
      <div className="space-y-1 mb-3">
        {stats.nextExtremes.map((extreme, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className={extreme.type === 'high' ? 'text-blue-400' : 'text-cyan-400'}>
              {extreme.type === 'high' ? '▲ High' : '▼ Low'}:
            </span>
            <span className="text-white">
              {formatHeight(extreme.height, unitSystem)} at {format(extreme.time, 'HH:mm')}
              <span className="text-slate-500 ml-1">
                ({formatDistanceToNow(extreme.time, { addSuffix: true })})
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Tidal type */}
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-500">Type:</span>
        <button
          onClick={() => setShowTypeExplainer(true)}
          className={`px-1.5 py-0.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
            stats.tidalType === 'semidiurnal' ? 'bg-blue-500/20 text-blue-400' :
            stats.tidalType === 'mixed-semidiurnal' ? 'bg-cyan-500/20 text-cyan-400' :
            stats.tidalType === 'mixed-diurnal' ? 'bg-green-500/20 text-green-400' :
            'bg-amber-500/20 text-amber-400'
          }`}
          title="Click to learn about tidal types"
        >
          {stats.tidalType === 'semidiurnal' ? 'Semidiurnal' :
           stats.tidalType === 'mixed-semidiurnal' ? 'Mixed (Semi)' :
           stats.tidalType === 'mixed-diurnal' ? 'Mixed (Di)' : 'Diurnal'}
          <span className="ml-1 opacity-60">?</span>
        </button>
      </div>

      {/* Dominant constituents */}
      <div className="text-xs">
        <span className="text-slate-500">Dominant:</span>
        <div className="flex gap-1 mt-1">
          {stats.dominantConstituents.map((c) => (
            <span
              key={c.symbol}
              className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
              title={formatHeight(c.amplitude, unitSystem, { precision: 3 })}
            >
              {c.symbol}
            </span>
          ))}
        </div>
      </div>

      {/* Tidal Type Explainer Modal */}
      {showTypeExplainer && (
        <TidalTypeExplainer onClose={() => setShowTypeExplainer(false)} />
      )}
    </div>
  );
}
