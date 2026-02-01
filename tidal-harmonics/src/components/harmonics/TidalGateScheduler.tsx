import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { useTimeStore } from '@/stores/timeStore';
import { predictTideSeries } from '@/lib/harmonics';
import { format, addDays } from 'date-fns';

interface TidalGateSchedulerProps {
  onClose: () => void;
}

interface PassageWindow {
  start: Date;
  end: Date;
  duration: number; // hours
  minDepth: number;
  maxDepth: number;
  tideState: 'flood' | 'ebb' | 'slack';
  quality: 'optimal' | 'good' | 'marginal';
}

export function TidalGateScheduler({ onClose }: TidalGateSchedulerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const epoch = useTimeStore((s) => s.epoch);
  const currentTime = useMemo(() => new Date(epoch), [epoch]);

  // Gate parameters
  const [gateThreshold, setGateThreshold] = useState(2.0); // minimum tide height
  const [vesselDraft, setVesselDraft] = useState(1.5); // vessel draft
  const [safetyMargin, setSafetyMargin] = useState(0.5); // under-keel clearance
  const [preferSlack, setPreferSlack] = useState(true); // prefer slack water

  const requiredDepth = vesselDraft + safetyMargin;

  const analysis = useMemo(() => {
    if (!selectedStation) return null;

    const end = addDays(currentTime, 3); // 3 days ahead
    const series = predictTideSeries(selectedStation, currentTime, end, 5);

    // Find passage windows where tide >= gate threshold AND depth >= required
    const windows: PassageWindow[] = [];
    let windowStart: Date | null = null;
    let windowMinDepth = Infinity;
    let windowMaxDepth = -Infinity;

    for (let i = 0; i < series.length; i++) {
      const point = series[i]!;
      const currentHeight = point.height;
      const depthOverThreshold = currentHeight - gateThreshold;
      const canPass = depthOverThreshold >= requiredDepth;

      if (canPass && !windowStart) {
        // Start of window
        windowStart = point.time;
        windowMinDepth = depthOverThreshold;
        windowMaxDepth = depthOverThreshold;
      } else if (canPass && windowStart) {
        // Continue window
        windowMinDepth = Math.min(windowMinDepth, depthOverThreshold);
        windowMaxDepth = Math.max(windowMaxDepth, depthOverThreshold);
      } else if (!canPass && windowStart) {
        // End of window
        const duration = (point.time.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

        // Determine tide state during window (simplified)
        const midIndex = Math.floor((i + series.indexOf(series.find(s => s.time >= windowStart!)!)) / 2);
        const beforeMid = series[Math.max(0, midIndex - 3)]?.height ?? currentHeight;
        const afterMid = series[Math.min(series.length - 1, midIndex + 3)]?.height ?? currentHeight;

        let tideState: 'flood' | 'ebb' | 'slack';
        const rateOfChange = afterMid - beforeMid;
        if (Math.abs(rateOfChange) < 0.1) {
          tideState = 'slack';
        } else {
          tideState = rateOfChange > 0 ? 'flood' : 'ebb';
        }

        // Quality assessment
        let quality: 'optimal' | 'good' | 'marginal';
        if (duration >= 2 && windowMinDepth >= requiredDepth + 0.5 && (!preferSlack || tideState === 'slack')) {
          quality = 'optimal';
        } else if (duration >= 1 && windowMinDepth >= requiredDepth + 0.2) {
          quality = 'good';
        } else {
          quality = 'marginal';
        }

        windows.push({
          start: windowStart,
          end: point.time,
          duration,
          minDepth: windowMinDepth,
          maxDepth: windowMaxDepth,
          tideState,
          quality,
        });

        windowStart = null;
        windowMinDepth = Infinity;
        windowMaxDepth = -Infinity;
      }
    }

    // Current status
    const currentHeight = series[0]?.height ?? 0;
    const currentDepth = currentHeight - gateThreshold;
    const canPassNow = currentDepth >= requiredDepth;

    // Next window if can't pass now
    const nextWindow = canPassNow ? null : windows[0];

    // Time until can pass
    let timeUntilPassage: number | null = null;
    if (!canPassNow && nextWindow) {
      timeUntilPassage = (nextWindow.start.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    }

    return {
      windows,
      currentHeight,
      currentDepth,
      canPassNow,
      nextWindow,
      timeUntilPassage,
    };
  }, [selectedStation, currentTime, gateThreshold, requiredDepth, preferSlack]);

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

  const getQualityColor = (quality: PassageWindow['quality']) => {
    switch (quality) {
      case 'optimal': return 'bg-green-900/50 text-green-400';
      case 'good': return 'bg-blue-900/50 text-blue-400';
      case 'marginal': return 'bg-yellow-900/50 text-yellow-400';
    }
  };

  const getTideStateIcon = (state: PassageWindow['tideState']) => {
    switch (state) {
      case 'flood': return '↗️';
      case 'ebb': return '↘️';
      case 'slack': return '⏸️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-teal-400">Tidal Gate Scheduler</h3>
            <p className="text-slate-400 text-sm">
              Find safe passage windows through tidal gates
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

        {/* Gate Parameters */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Gate Sill Depth (chart datum): {formatHeight(gateThreshold)}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={gateThreshold}
              onChange={(e) => setGateThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Vessel Draft
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={vesselDraft}
                  onChange={(e) => setVesselDraft(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 bg-slate-700 rounded px-2 py-1 text-sm font-mono"
                />
                <span className="text-xs text-slate-400">{unitSystem === 'imperial' ? 'ft' : 'm'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Safety Margin (UKC)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 bg-slate-700 rounded px-2 py-1 text-sm font-mono"
                />
                <span className="text-xs text-slate-400">{unitSystem === 'imperial' ? 'ft' : 'm'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="preferSlack"
              checked={preferSlack}
              onChange={(e) => setPreferSlack(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="preferSlack" className="text-sm text-slate-400">
              Prefer slack water (less current)
            </label>
          </div>

          <p className="text-xs text-slate-500">
            Required depth over sill: {formatHeight(requiredDepth)}
          </p>
        </div>

        {analysis && (
          <>
            {/* Current Status */}
            <div className={`rounded-lg p-4 mb-4 ${
              analysis.canPassNow ? 'bg-green-900/30' : 'bg-red-900/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {analysis.canPassNow ? '✅' : '🚫'}
                </span>
                <div>
                  <p className={`text-lg font-medium ${
                    analysis.canPassNow ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {analysis.canPassNow ? 'Safe to Pass Now' : 'Cannot Pass Now'}
                  </p>
                  <p className="text-sm text-slate-400">
                    Current depth over sill: {formatHeight(Math.max(0, analysis.currentDepth))}
                  </p>
                </div>
              </div>

              {!analysis.canPassNow && analysis.timeUntilPassage !== null && (
                <p className="text-sm text-slate-300 mt-2">
                  Next window opens in: <span className="font-mono text-cyan-400">
                    {formatDuration(analysis.timeUntilPassage)}
                  </span>
                </p>
              )}
            </div>

            {/* Passage Windows */}
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Passage Windows (Next 3 Days)
              </h4>
              {analysis.windows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No safe passage windows found with current settings.
                  Try reducing draft or safety margin.
                </p>
              ) : (
                <div className="space-y-2">
                  {analysis.windows.slice(0, 8).map((window, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-2 rounded ${
                        window.quality === 'optimal' ? 'bg-green-900/20' :
                        window.quality === 'good' ? 'bg-blue-900/20' : 'bg-yellow-900/20'
                      }`}
                    >
                      <div>
                        <p className="text-sm text-slate-300">
                          {format(window.start, 'EEE MMM d')}{' '}
                          <span className="font-mono">
                            {format(window.start, 'HH:mm')} - {format(window.end, 'HH:mm')}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {getTideStateIcon(window.tideState)} {window.tideState} •{' '}
                          Depth: {formatHeight(window.minDepth)} - {formatHeight(window.maxDepth)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded ${getQualityColor(window.quality)}`}>
                          {window.quality}
                        </span>
                        <p className="text-sm font-mono text-slate-400 mt-1">
                          {formatDuration(window.duration)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Window Quality</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500/50"></span>
                  <span className="text-slate-400">Optimal: Long window, good depth</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-500/50"></span>
                  <span className="text-slate-400">Good: Adequate time and depth</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-500/50"></span>
                  <span className="text-slate-400">Marginal: Limited margin</span>
                </div>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">About Tidal Gates</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  <strong className="text-slate-300">Tidal gates</strong> are locations where water
                  depth is restricted by a sill, bar, or barrier that limits passage to certain
                  tide states.
                </p>
                <p>
                  Common examples include marina entrances, river bars, lock entrances, and
                  natural channels between islands.
                </p>
                <div className="p-2 bg-amber-900/30 rounded text-xs text-amber-200">
                  <strong>Always verify:</strong> Local knowledge, current conditions, and official
                  tide tables before attempting passage through tidal gates. This tool provides
                  estimates only.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
