import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTide, predictTideSeries } from '@/lib/harmonics';
import { formatHeight, toMeters } from '@/lib/units';
import { addHours, format } from 'date-fns';

interface Props {
  onClose: () => void;
}

export function DepthCorrectionTool({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const epoch = useTimeStore((s) => s.epoch);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [chartDepth, setChartDepth] = useState('3.0');
  const [vesselDraft, setVesselDraft] = useState('1.2');
  const [safetyMargin, setSafetyMargin] = useState('0.5');

  const calculation = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);
    const currentTide = predictTide(station, now);

    // Convert inputs from display units to meters
    const chartDepthM = toMeters(parseFloat(chartDepth) || 0, unitSystem);
    const vesselDraftM = toMeters(parseFloat(vesselDraft) || 0, unitSystem);
    const safetyMarginM = toMeters(parseFloat(safetyMargin) || 0, unitSystem);

    // Actual depth = Chart depth + Tide height (can be negative at low tide)
    const actualDepth = chartDepthM + currentTide;

    // Under-keel clearance = Actual depth - Vessel draft
    const underKeelClearance = actualDepth - vesselDraftM;

    // Safe clearance = UKC - Safety margin
    const safeClearance = underKeelClearance - safetyMarginM;

    // Find minimum depth in next 12 hours
    const next12h = addHours(now, 12);
    const series = predictTideSeries(station, now, next12h, 6);

    let minTide = currentTide;
    let minTideTime = now;
    let maxTide = currentTide;
    let maxTideTime = now;

    for (const point of series) {
      if (point.height < minTide) {
        minTide = point.height;
        minTideTime = point.time;
      }
      if (point.height > maxTide) {
        maxTide = point.height;
        maxTideTime = point.time;
      }
    }

    const minActualDepth = chartDepthM + minTide;
    const minUKC = minActualDepth - vesselDraftM;

    // Calculate minimum chart depth needed for safe passage
    const minChartDepthNeeded = vesselDraftM + safetyMarginM - minTide;

    return {
      currentTide,
      chartDepthM,
      vesselDraftM,
      safetyMarginM,
      actualDepth,
      underKeelClearance,
      safeClearance,
      minTide,
      minTideTime,
      maxTide,
      maxTideTime,
      minActualDepth,
      minUKC,
      minChartDepthNeeded,
      isSafe: safeClearance >= 0,
      isWarningSoon: minUKC - safetyMarginM < 0,
    };
  }, [station, epoch, chartDepth, vesselDraft, safetyMargin, unitSystem]);

  const unitLabel = unitSystem === 'imperial' ? 'ft' : 'm';

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Depth Correction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Select a station to calculate depths</p>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Depth Correction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Unable to calculate</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">Depth Correction</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Current Tide */}
      <div className="bg-slate-800 rounded p-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-xs">Current Tide Height</span>
          <span className={`text-sm font-mono ${calculation.currentTide >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
            {calculation.currentTide >= 0 ? '+' : ''}{formatHeight(calculation.currentTide, unitSystem)}
          </span>
        </div>
        <div className="text-slate-500 text-xs mt-1">
          Above chart datum (MLLW)
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-slate-400 text-xs block mb-1">
            Chart Depth ({unitLabel}):
          </label>
          <input
            type="number"
            value={chartDepth}
            onChange={(e) => setChartDepth(e.target.value)}
            step="0.1"
            min="0"
            className="w-full px-3 py-1.5 bg-slate-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Depth shown on chart"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1">
            Vessel Draft ({unitLabel}):
          </label>
          <input
            type="number"
            value={vesselDraft}
            onChange={(e) => setVesselDraft(e.target.value)}
            step="0.1"
            min="0"
            className="w-full px-3 py-1.5 bg-slate-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Your vessel's draft"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs block mb-1">
            Safety Margin ({unitLabel}):
          </label>
          <input
            type="number"
            value={safetyMargin}
            onChange={(e) => setSafetyMargin(e.target.value)}
            step="0.1"
            min="0"
            className="w-full px-3 py-1.5 bg-slate-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Minimum clearance wanted"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2 mb-3">
        {/* Actual Depth */}
        <div className="bg-slate-800 rounded p-2">
          <div className="flex justify-between">
            <span className="text-slate-400 text-xs">Actual Depth Now</span>
            <span className="text-white text-sm font-mono">
              {formatHeight(calculation.actualDepth, unitSystem)}
            </span>
          </div>
          <div className="text-slate-600 text-xs mt-1">
            = Chart ({formatHeight(calculation.chartDepthM, unitSystem, { showUnit: false })}) + Tide ({calculation.currentTide >= 0 ? '+' : ''}{formatHeight(calculation.currentTide, unitSystem, { showUnit: false })})
          </div>
        </div>

        {/* Under Keel Clearance */}
        <div className={`rounded p-2 ${
          calculation.isSafe ? 'bg-green-900/30' : 'bg-red-900/30'
        }`}>
          <div className="flex justify-between">
            <span className="text-slate-400 text-xs">Under-Keel Clearance</span>
            <span className={`text-sm font-mono font-bold ${
              calculation.underKeelClearance >= calculation.safetyMarginM
                ? 'text-green-400'
                : calculation.underKeelClearance >= 0
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {formatHeight(calculation.underKeelClearance, unitSystem)}
            </span>
          </div>
          <div className="text-slate-600 text-xs mt-1">
            = Actual ({formatHeight(calculation.actualDepth, unitSystem, { showUnit: false })}) - Draft ({formatHeight(calculation.vesselDraftM, unitSystem, { showUnit: false })})
          </div>
        </div>

        {/* Safety Status */}
        <div className={`rounded p-2 ${
          calculation.isSafe ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${calculation.isSafe ? 'text-green-400' : 'text-red-400'}`}>
              {calculation.isSafe ? '✓' : '⚠'}
            </span>
            <div>
              <div className={`text-sm font-medium ${calculation.isSafe ? 'text-green-400' : 'text-red-400'}`}>
                {calculation.isSafe ? 'Safe Clearance' : 'INSUFFICIENT CLEARANCE'}
              </div>
              <div className="text-slate-400 text-xs">
                {calculation.isSafe
                  ? `${formatHeight(calculation.safeClearance, unitSystem)} above safety margin`
                  : `Need ${formatHeight(Math.abs(calculation.safeClearance), unitSystem)} more depth`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next 12 Hours */}
      <div className="bg-slate-800 rounded p-3 mb-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Next 12 Hours</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-slate-500 text-xs">Minimum Tide</div>
            <div className="text-orange-400 text-sm font-mono">
              {calculation.minTide >= 0 ? '+' : ''}{formatHeight(calculation.minTide, unitSystem)}
            </div>
            <div className="text-slate-600 text-xs">{format(calculation.minTideTime, 'HH:mm')}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Min UKC at Low</div>
            <div className={`text-sm font-mono ${
              calculation.minUKC >= calculation.safetyMarginM ? 'text-green-400' :
              calculation.minUKC >= 0 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {formatHeight(calculation.minUKC, unitSystem)}
            </div>
          </div>
        </div>

        {calculation.isWarningSoon && (
          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded">
            <div className="text-yellow-400 text-xs font-medium">
              ⚠ Warning: Clearance will drop below safety margin at low tide
            </div>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="text-slate-500 text-xs border-t border-slate-800 pt-2">
        <div className="mb-1">
          <strong className="text-slate-400">Min chart depth needed:</strong>
          <span className="ml-1 text-white font-mono">
            {formatHeight(Math.max(0, calculation.minChartDepthNeeded), unitSystem)}
          </span>
        </div>
        <p className="text-slate-600">
          For safe passage at the next low tide with your draft and safety margin.
        </p>
      </div>
    </div>
  );
}
