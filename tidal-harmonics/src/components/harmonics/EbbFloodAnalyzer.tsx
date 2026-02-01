import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import type { TideExtreme } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';
import { addDays, differenceInMinutes, format } from 'date-fns';

interface Props {
  onClose: () => void;
}

interface TidalCycle {
  start: TideExtreme;
  end: TideExtreme;
  duration: number; // minutes
  type: 'flood' | 'ebb';
  range: number; // meters
  rate: number; // m/hour
}

export function EbbFloodAnalyzer({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const analysis = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);
    const start = addDays(now, -1);
    const end = addDays(now, 2);

    const series = predictTideSeries(station, start, end, 6);
    const extremes = findExtremes(series);

    if (extremes.length < 3) return null;

    // Build cycles from consecutive extremes
    const cycles: TidalCycle[] = [];

    for (let i = 0; i < extremes.length - 1; i++) {
      const startExtreme = extremes[i]!;
      const endExtreme = extremes[i + 1]!;

      const duration = differenceInMinutes(endExtreme.time, startExtreme.time);
      const isFlood = endExtreme.type === 'high';
      const range = Math.abs(endExtreme.height - startExtreme.height);
      const rate = range / (duration / 60);

      cycles.push({
        start: startExtreme,
        end: endExtreme,
        duration,
        type: isFlood ? 'flood' : 'ebb',
        range,
        rate,
      });
    }

    // Separate into flood and ebb
    const floods = cycles.filter(c => c.type === 'flood');
    const ebbs = cycles.filter(c => c.type === 'ebb');

    if (floods.length === 0 || ebbs.length === 0) return null;

    // Calculate averages
    const avgFloodDuration = floods.reduce((s, c) => s + c.duration, 0) / floods.length;
    const avgEbbDuration = ebbs.reduce((s, c) => s + c.duration, 0) / ebbs.length;
    const avgFloodRange = floods.reduce((s, c) => s + c.range, 0) / floods.length;
    const avgEbbRange = ebbs.reduce((s, c) => s + c.range, 0) / ebbs.length;
    const avgFloodRate = floods.reduce((s, c) => s + c.rate, 0) / floods.length;
    const avgEbbRate = ebbs.reduce((s, c) => s + c.rate, 0) / ebbs.length;

    // Calculate asymmetry
    const durationDiff = avgFloodDuration - avgEbbDuration;
    const durationRatio = avgFloodDuration / avgEbbDuration;
    const asymmetryPercent = ((durationRatio - 1) * 100);

    // Determine which is dominant
    const floodDominant = avgFloodDuration > avgEbbDuration;

    // Find current cycle
    let currentCycle: TidalCycle | null = null;
    let nextCycle: TidalCycle | null = null;

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i]!;
      if (cycle.start.time <= now && cycle.end.time > now) {
        currentCycle = cycle;
        nextCycle = cycles[i + 1] || null;
        break;
      }
    }

    // Time remaining in current cycle
    const timeRemaining = currentCycle
      ? differenceInMinutes(currentCycle.end.time, now)
      : null;

    return {
      cycles,
      floods,
      ebbs,
      avgFloodDuration,
      avgEbbDuration,
      avgFloodRange,
      avgEbbRange,
      avgFloodRate,
      avgEbbRate,
      durationDiff: Math.abs(durationDiff),
      durationRatio,
      asymmetryPercent: Math.abs(asymmetryPercent),
      floodDominant,
      currentCycle,
      nextCycle,
      timeRemaining,
    };
  }, [station, epoch]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatRate = (metersPerHour: number) => {
    if (unitSystem === 'imperial') {
      const feetPerHour = metersPerHour * 3.28084;
      return `${feetPerHour.toFixed(2)} ft/h`;
    }
    return `${(metersPerHour * 100).toFixed(1)} cm/h`;
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Ebb/Flood Analysis</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Select a station to analyze</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Ebb/Flood Analysis</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Unable to analyze tidal asymmetry</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">Ebb/Flood Analysis</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Current Status */}
      {analysis.currentCycle && (
        <div className={`rounded p-3 mb-3 border ${
          analysis.currentCycle.type === 'flood'
            ? 'bg-cyan-900/30 border-cyan-700'
            : 'bg-orange-900/30 border-orange-700'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <div className={`text-sm font-bold ${
                analysis.currentCycle.type === 'flood' ? 'text-cyan-400' : 'text-orange-400'
              }`}>
                {analysis.currentCycle.type === 'flood' ? '▲ Flooding' : '▼ Ebbing'}
              </div>
              <div className="text-slate-400 text-xs">
                {analysis.timeRemaining !== null && `${formatDuration(analysis.timeRemaining)} remaining`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-mono">
                {formatRate(analysis.currentCycle.rate)}
              </div>
              <div className="text-slate-500 text-xs">current rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Asymmetry Summary */}
      <div className="bg-slate-800 rounded p-3 mb-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Tidal Asymmetry</div>

        {/* Visual bar showing ratio */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-cyan-400 text-xs w-10">Flood</span>
          <div className="flex-1 h-4 flex rounded overflow-hidden">
            <div
              className="bg-cyan-600 h-full"
              style={{
                width: `${(analysis.avgFloodDuration / (analysis.avgFloodDuration + analysis.avgEbbDuration)) * 100}%`
              }}
            />
            <div className="bg-orange-600 h-full flex-1" />
          </div>
          <span className="text-orange-400 text-xs w-10 text-right">Ebb</span>
        </div>

        <div className="text-center">
          <span className={`text-sm font-medium ${
            analysis.floodDominant ? 'text-cyan-400' : 'text-orange-400'
          }`}>
            {analysis.floodDominant ? 'Flood-dominant' : 'Ebb-dominant'}
          </span>
          <span className="text-slate-500 text-xs ml-2">
            ({analysis.asymmetryPercent.toFixed(1)}% longer)
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-slate-500">Metric</div>
        </div>
        <div className="bg-cyan-900/30 rounded p-2 text-center">
          <div className="text-cyan-400 font-medium">Flood ▲</div>
        </div>
        <div className="bg-orange-900/30 rounded p-2 text-center">
          <div className="text-orange-400 font-medium">Ebb ▼</div>
        </div>

        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Duration</div>
        </div>
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-white font-mono">{formatDuration(analysis.avgFloodDuration)}</div>
        </div>
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-white font-mono">{formatDuration(analysis.avgEbbDuration)}</div>
        </div>

        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Range</div>
        </div>
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-white font-mono">{formatHeight(analysis.avgFloodRange, unitSystem)}</div>
        </div>
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-white font-mono">{formatHeight(analysis.avgEbbRange, unitSystem)}</div>
        </div>

        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-400">Rate</div>
        </div>
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-white font-mono">{formatRate(analysis.avgFloodRate)}</div>
        </div>
        <div className="bg-slate-800 rounded p-2 text-center">
          <div className="text-white font-mono">{formatRate(analysis.avgEbbRate)}</div>
        </div>
      </div>

      {/* Recent Cycles */}
      <div className="bg-slate-800 rounded p-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Recent Cycles</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {analysis.cycles.slice(-6).map((cycle, i) => {
            const now = new Date(epoch);
            const isCurrent = cycle.start.time <= now && cycle.end.time > now;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs py-1 ${
                  isCurrent ? 'bg-slate-700/50 -mx-1 px-1 rounded' : ''
                }`}
              >
                <span className={`w-6 ${
                  cycle.type === 'flood' ? 'text-cyan-400' : 'text-orange-400'
                }`}>
                  {cycle.type === 'flood' ? '▲' : '▼'}
                </span>
                <span className="text-slate-500 flex-1">
                  {format(cycle.start.time, 'HH:mm')} → {format(cycle.end.time, 'HH:mm')}
                </span>
                <span className="text-white font-mono w-12 text-right">
                  {formatDuration(cycle.duration)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational note */}
      <div className="mt-3 pt-2 border-t border-slate-800">
        <div className="text-slate-500 text-xs">
          <strong className="text-slate-400">Why it matters:</strong> Asymmetry affects sediment
          transport, navigation timing, and current strength. Flood-dominant areas import sediment;
          ebb-dominant areas export it.
        </div>
      </div>
    </div>
  );
}
