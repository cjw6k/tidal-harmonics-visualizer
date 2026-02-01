import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTide, predictTideSeries, findExtremes } from '@/lib/harmonics';
import type { TideExtreme } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';
import { addHours, format } from 'date-fns';

interface Props {
  onClose: () => void;
}

const TWELFTHS: readonly [number, number, number, number, number, number] = [1, 2, 3, 3, 2, 1];
const HOUR_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

export function RuleOfTwelfths({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [showComparison, setShowComparison] = useState(false);

  const analysis = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);

    // Get extremes over a 24-hour window centered on now
    const start = addHours(now, -14);
    const end = addHours(now, 14);
    const series = predictTideSeries(station, start, end, 6);
    const extremes = findExtremes(series);

    if (extremes.length < 2) return null;

    // Find the previous and next extremes relative to now
    let prevExtreme: TideExtreme | null = null;
    let nextExtreme: TideExtreme | null = null;

    for (const extreme of extremes) {
      if (extreme.time.getTime() <= now.getTime()) {
        prevExtreme = extreme;
      } else if (!nextExtreme) {
        nextExtreme = extreme;
      }
    }

    if (!prevExtreme || !nextExtreme) return null;

    const currentHeight = predictTide(station, now);
    const range = Math.abs(nextExtreme.height - prevExtreme.height);
    const isRising = nextExtreme.height > prevExtreme.height;
    const cycleDuration = nextExtreme.time.getTime() - prevExtreme.time.getTime();
    const elapsed = now.getTime() - prevExtreme.time.getTime();
    const progress = elapsed / cycleDuration;

    // Calculate which hour we're in (0-5)
    const hourIndex = Math.min(5, Math.floor(progress * 6));

    // Calculate Rule of Twelfths predictions for each hour
    const hourlyPredictions = [];
    let cumulativeTwelfths = 0;

    for (let i = 0; i < 6; i++) {
      const hourEnd = new Date(prevExtreme.time.getTime() + (cycleDuration * (i + 1)) / 6);

      cumulativeTwelfths += TWELFTHS[i]!;
      const predictedChange = (cumulativeTwelfths / 12) * range;
      const predictedHeight = isRising
        ? prevExtreme.height + predictedChange
        : prevExtreme.height - predictedChange;

      // Calculate actual height at hour end
      const actualHeight = predictTide(station, hourEnd);

      hourlyPredictions.push({
        hourIndex: i,
        twelfths: TWELFTHS[i]!,
        cumulativeTwelfths,
        hourEnd,
        predictedHeight,
        actualHeight,
        change: (TWELFTHS[i]! / 12) * range,
      });
    }

    // Calculate what Rule of Twelfths predicts for current time
    const fractionInHour = (progress * 6) % 1;
    const completedTwelfths = TWELFTHS.slice(0, hourIndex).reduce((a, b) => a + b, 0);
    const partialTwelfths = completedTwelfths + (TWELFTHS[hourIndex]! * fractionInHour);
    const predictedCurrentHeight = isRising
      ? prevExtreme.height + (partialTwelfths / 12) * range
      : prevExtreme.height - (partialTwelfths / 12) * range;

    const predictionError = Math.abs(currentHeight - predictedCurrentHeight);

    return {
      prevExtreme,
      nextExtreme,
      currentHeight,
      predictedCurrentHeight,
      predictionError,
      range,
      isRising,
      progress,
      hourIndex,
      hourlyPredictions,
    };
  }, [station, epoch]);

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm');
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Rule of Twelfths</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Select a station to see the Rule of Twelfths</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Rule of Twelfths</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Unable to calculate tidal cycle</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">Rule of Twelfths</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Explanation */}
      <div className="bg-slate-800 rounded p-2 mb-3">
        <p className="text-slate-300 text-xs leading-relaxed">
          A traditional mariner's rule for estimating tide height.
          In 6 hours, the tide changes by <span className="text-cyan-400">1-2-3-3-2-1</span> twelfths of its range.
        </p>
      </div>

      {/* Current Cycle Status */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{analysis.isRising ? '▲ Rising' : '▼ Falling'}</span>
          <span>Hour {analysis.hourIndex + 1} of 6</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="flex gap-0.5 mb-2">
          {TWELFTHS.map((twelfth, i) => {
            const isComplete = i < analysis.hourIndex;
            const isCurrent = i === analysis.hourIndex;
            const widthPercent = (twelfth / 12) * 100;
            return (
              <div
                key={i}
                className={`h-6 rounded-sm flex items-center justify-center text-xs transition-colors ${
                  isComplete
                    ? 'bg-cyan-600 text-white'
                    : isCurrent
                    ? 'bg-cyan-500/50 text-cyan-200 ring-1 ring-cyan-400'
                    : 'bg-slate-700 text-slate-500'
                }`}
                style={{ width: `${widthPercent}%` }}
              >
                {twelfth}
              </div>
            );
          })}
        </div>

        {/* Times */}
        <div className="flex justify-between text-xs text-slate-500">
          <span>{analysis.prevExtreme.type === 'high' ? 'High' : 'Low'}: {formatTime(analysis.prevExtreme.time)}</span>
          <span>{analysis.nextExtreme.type === 'high' ? 'High' : 'Low'}: {formatTime(analysis.nextExtreme.time)}</span>
        </div>
      </div>

      {/* Current Predictions */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-500 text-xs mb-1">Rule Predicts</div>
          <div className="text-cyan-400 text-sm font-mono">{formatHeight(analysis.predictedCurrentHeight, unitSystem)}</div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-slate-500 text-xs mb-1">Actual Height</div>
          <div className="text-white text-sm font-mono">{formatHeight(analysis.currentHeight, unitSystem)}</div>
        </div>
      </div>

      {/* Accuracy */}
      <div className="bg-slate-800 rounded p-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs">Prediction Error</span>
          <span className={`text-sm font-mono ${
            analysis.predictionError < 0.1 ? 'text-green-400' :
            analysis.predictionError < 0.3 ? 'text-yellow-400' : 'text-orange-400'
          }`}>
            ±{formatHeight(analysis.predictionError, unitSystem)}
          </span>
        </div>
        <div className="text-slate-500 text-xs mt-1">
          {analysis.predictionError < 0.1
            ? 'Excellent - Rule works well here'
            : analysis.predictionError < 0.3
            ? 'Good approximation'
            : 'Less accurate - mixed tides or shallow water effects'}
        </div>
      </div>

      {/* Toggle for hourly breakdown */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        className="w-full text-xs text-slate-400 hover:text-white py-1 flex items-center justify-center gap-1"
      >
        {showComparison ? '▲ Hide' : '▼ Show'} Hourly Breakdown
      </button>

      {showComparison && (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <div className="text-xs text-slate-500 mb-2">Change per hour (predicted vs actual)</div>
          <div className="space-y-1">
            {analysis.hourlyPredictions.map((hour, i) => {
              const error = Math.abs(hour.predictedHeight - hour.actualHeight);
              const isCurrent = i === analysis.hourIndex;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs ${isCurrent ? 'bg-slate-800 -mx-1 px-1 py-0.5 rounded' : ''}`}
                >
                  <span className="text-slate-500 w-8">{HOUR_LABELS[i]}</span>
                  <span className="text-cyan-400 w-8">{hour.twelfths}/12</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-cyan-300 font-mono flex-1">{formatHeight(hour.predictedHeight, unitSystem)}</span>
                  <span className="text-slate-400">vs</span>
                  <span className="text-white font-mono flex-1">{formatHeight(hour.actualHeight, unitSystem)}</span>
                  <span className={`font-mono ${error < 0.1 ? 'text-green-400' : error < 0.2 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {error < 0.01 ? '✓' : `±${error.toFixed(2)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Educational Note */}
      <div className="mt-3 pt-2 border-t border-slate-800">
        <div className="text-slate-500 text-xs">
          <strong className="text-slate-400">Note:</strong> The Rule of Twelfths assumes a
          regular semidiurnal tide (~6h 12m per cycle). Accuracy varies with tidal type and
          local geography.
        </div>
      </div>
    </div>
  );
}
