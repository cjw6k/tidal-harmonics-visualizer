import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface DockingWindowCalculatorProps {
  onClose: () => void;
}

interface DockingWindow {
  time: Date;
  waterLevel: number;
  freeboardToQuay: number;
  condition: 'optimal' | 'acceptable' | 'difficult' | 'impossible';
  notes: string[];
  tideState: 'rising' | 'falling' | 'slack';
  rateOfChange: number; // meters per hour
}

export function DockingWindowCalculator({ onClose }: DockingWindowCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  // Dock and vessel parameters
  const [dockHeight, setDockHeight] = useState(2.0); // meters above chart datum
  const [vesselFreeboard, setVesselFreeboard] = useState(1.2); // meters (deck above waterline)
  const [minFreeboard, setMinFreeboard] = useState(0.3); // minimum freeboard difference for comfortable boarding
  const [maxFreeboard, setMaxFreeboard] = useState(1.5); // maximum step up/down for safe boarding
  const [fenderCompression, setFenderCompression] = useState(0.2); // allowance for fenders

  // Calculate docking conditions for the next 24 hours
  const dockingWindows = useMemo(() => {
    if (!selectedStation) return [];

    const now = new Date();
    const end = addHours(now, 24);
    const series = predictTideSeries(selectedStation, now, end, 10);

    const windows: DockingWindow[] = [];

    // Analyze each 30-minute window
    for (let i = 0; i < series.length - 1; i++) {
      const point = series[i]!;
      const nextPoint = series[i + 1];

      // Water level above chart datum
      const waterLevel = point.height;

      // Vessel deck height = water level + freeboard
      const vesselDeckHeight = waterLevel + vesselFreeboard;

      // Difference between quay and vessel deck (positive = step up to quay)
      const freeboardToQuay = dockHeight - vesselDeckHeight;

      // Rate of change
      const rateOfChange = nextPoint
        ? ((nextPoint.height - point.height) / ((nextPoint.time.getTime() - point.time.getTime()) / 3600000))
        : 0;

      // Determine tide state
      let tideState: DockingWindow['tideState'];
      if (Math.abs(rateOfChange) < 0.1) {
        tideState = 'slack';
      } else if (rateOfChange > 0) {
        tideState = 'rising';
      } else {
        tideState = 'falling';
      }

      // Determine condition
      const notes: string[] = [];
      let condition: DockingWindow['condition'];

      const effectiveFreeboard = Math.abs(freeboardToQuay) - fenderCompression;

      if (effectiveFreeboard < minFreeboard) {
        condition = 'optimal';
        notes.push('Minimal step - easy boarding');
        if (Math.abs(rateOfChange) < 0.2) {
          notes.push('Stable water level');
        }
      } else if (effectiveFreeboard <= maxFreeboard) {
        condition = 'acceptable';
        if (freeboardToQuay > 0) {
          notes.push(`Step up ${effectiveFreeboard.toFixed(2)}m to quay`);
        } else {
          notes.push(`Step down ${effectiveFreeboard.toFixed(2)}m to quay`);
        }
      } else if (effectiveFreeboard <= maxFreeboard * 1.5) {
        condition = 'difficult';
        notes.push('Large height difference - use gangway');
        if (freeboardToQuay > 0) {
          notes.push(`${effectiveFreeboard.toFixed(2)}m up to quay`);
        } else {
          notes.push(`${effectiveFreeboard.toFixed(2)}m down to quay`);
        }
      } else {
        condition = 'impossible';
        notes.push('Height difference too large');
        if (freeboardToQuay > 0) {
          notes.push(`${effectiveFreeboard.toFixed(2)}m up to quay - not safe`);
        } else {
          notes.push(`${effectiveFreeboard.toFixed(2)}m down to quay - not safe`);
        }
      }

      // Add rate of change warning
      if (Math.abs(rateOfChange) > 0.3) {
        notes.push(`Tide ${tideState === 'rising' ? 'rising' : 'falling'} ${Math.abs(rateOfChange).toFixed(2)}m/hr`);
        if (condition !== 'impossible') {
          notes.push('Monitor lines carefully');
        }
      }

      windows.push({
        time: point.time,
        waterLevel,
        freeboardToQuay,
        condition,
        notes,
        tideState,
        rateOfChange,
      });
    }

    return windows;
  }, [selectedStation, dockHeight, vesselFreeboard, minFreeboard, maxFreeboard, fenderCompression]);

  // Find optimal windows
  const optimalWindows = dockingWindows.filter((w) => w.condition === 'optimal');
  const nextOptimal = optimalWindows[0];

  // Summary statistics
  const summary = useMemo(() => {
    if (dockingWindows.length === 0) return null;

    const conditions = {
      optimal: dockingWindows.filter((w) => w.condition === 'optimal').length,
      acceptable: dockingWindows.filter((w) => w.condition === 'acceptable').length,
      difficult: dockingWindows.filter((w) => w.condition === 'difficult').length,
      impossible: dockingWindows.filter((w) => w.condition === 'impossible').length,
    };

    const percentage = (count: number) =>
      `${Math.round((count / dockingWindows.length) * 100)}%`;

    return { conditions, percentage };
  }, [dockingWindows]);

  const getConditionColor = (condition: DockingWindow['condition']) => {
    switch (condition) {
      case 'optimal':
        return 'bg-green-600';
      case 'acceptable':
        return 'bg-blue-600';
      case 'difficult':
        return 'bg-yellow-600';
      case 'impossible':
        return 'bg-red-600';
    }
  };

  const getConditionBg = (condition: DockingWindow['condition']) => {
    switch (condition) {
      case 'optimal':
        return 'bg-green-900/30 border-green-600';
      case 'acceptable':
        return 'bg-blue-900/30 border-blue-600';
      case 'difficult':
        return 'bg-yellow-900/30 border-yellow-600';
      case 'impossible':
        return 'bg-red-900/30 border-red-600';
    }
  };

  const getTideIcon = (state: DockingWindow['tideState']) => {
    switch (state) {
      case 'rising':
        return '↑';
      case 'falling':
        return '↓';
      case 'slack':
        return '−';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">Docking Window Calculator</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-medium text-orange-400 mb-2">Safe Boarding Conditions</p>
            <p>
              Calculate when water levels align with dock height for comfortable boarding. The optimal
              window occurs when the height difference between your deck and the quay is minimal, making
              it easy to step between vessel and dock.
            </p>
          </div>

          {/* Parameters */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Dock & Vessel Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Dock Height (m above CD)</label>
                <input
                  type="number"
                  value={dockHeight}
                  onChange={(e) => setDockHeight(Number(e.target.value))}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Vessel Freeboard (m)</label>
                <input
                  type="number"
                  value={vesselFreeboard}
                  onChange={(e) => setVesselFreeboard(Number(e.target.value))}
                  min={0.3}
                  max={5}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fender Allowance (m)</label>
                <input
                  type="number"
                  value={fenderCompression}
                  onChange={(e) => setFenderCompression(Number(e.target.value))}
                  min={0}
                  max={0.5}
                  step={0.05}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min Comfortable Step (m)</label>
                <input
                  type="number"
                  value={minFreeboard}
                  onChange={(e) => setMinFreeboard(Number(e.target.value))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Safe Step (m)</label>
                <input
                  type="number"
                  value={maxFreeboard}
                  onChange={(e) => setMaxFreeboard(Number(e.target.value))}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Next optimal window */}
          {nextOptimal && (
            <div className="bg-gradient-to-r from-orange-900/30 to-slate-800 rounded-lg p-4 border border-orange-500">
              <h3 className="text-sm font-medium text-orange-400 mb-2">Next Optimal Boarding Window</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-lg font-medium">
                    {format(nextOptimal.time, 'HH:mm')}
                  </p>
                  <p className="text-slate-400 text-sm">{format(nextOptimal.time, 'EEE, MMM d')}</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-medium">
                    {Math.abs(nextOptimal.freeboardToQuay).toFixed(2)}m {nextOptimal.freeboardToQuay > 0 ? 'up' : 'down'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    Water: {nextOptimal.waterLevel.toFixed(2)}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-green-900/30 rounded p-2 text-center">
                <p className="text-green-400 text-lg font-bold">{summary.percentage(summary.conditions.optimal)}</p>
                <p className="text-xs text-slate-400">Optimal</p>
              </div>
              <div className="bg-blue-900/30 rounded p-2 text-center">
                <p className="text-blue-400 text-lg font-bold">{summary.percentage(summary.conditions.acceptable)}</p>
                <p className="text-xs text-slate-400">Acceptable</p>
              </div>
              <div className="bg-yellow-900/30 rounded p-2 text-center">
                <p className="text-yellow-400 text-lg font-bold">{summary.percentage(summary.conditions.difficult)}</p>
                <p className="text-xs text-slate-400">Difficult</p>
              </div>
              <div className="bg-red-900/30 rounded p-2 text-center">
                <p className="text-red-400 text-lg font-bold">{summary.percentage(summary.conditions.impossible)}</p>
                <p className="text-xs text-slate-400">Impossible</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">24-Hour Timeline</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {dockingWindows.filter((_, i) => i % 3 === 0).map((window, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded border ${getConditionBg(window.condition)}`}
                >
                  <div className="w-16 text-white font-mono text-sm">
                    {format(window.time, 'HH:mm')}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getConditionColor(window.condition)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">
                        {window.freeboardToQuay > 0 ? '↑' : '↓'} {Math.abs(window.freeboardToQuay).toFixed(2)}m
                      </span>
                      <span className={`${window.rateOfChange > 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {getTideIcon(window.tideState)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {window.condition}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety notes */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Boarding Safety:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Always use proper handholds when stepping between vessel and dock</li>
              <li>Monitor tide rate - rapid changes require frequent line adjustments</li>
              <li>Use a gangway when height difference exceeds comfortable stepping</li>
              <li>Consider crew mobility when planning boarding windows</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
