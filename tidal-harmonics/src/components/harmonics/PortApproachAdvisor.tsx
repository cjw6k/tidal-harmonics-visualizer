import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface PortApproachAdvisorProps {
  onClose: () => void;
}

interface ApproachWindow {
  start: Date;
  end: Date;
  duration: number; // minutes
  minDepth: number;
  maxDepth: number;
  tidalState: 'flood' | 'ebb' | 'slack-high' | 'slack-low';
  recommendation: 'optimal' | 'acceptable' | 'caution' | 'avoid';
  notes: string[];
}

export function PortApproachAdvisor({ onClose }: PortApproachAdvisorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  // Vessel and channel parameters
  const [vesselDraft, setVesselDraft] = useState(2.5); // meters
  const [channelDepth, setChannelDepth] = useState(4.0); // meters (chart datum)
  const [safetyMargin, setSafetyMargin] = useState(0.5); // meters
  const [approachDistance, setApproachDistance] = useState(3); // nm
  const [approachSpeed, setApproachSpeed] = useState(5); // knots
  const [preferSlack, setPreferSlack] = useState(true);
  const [avoidNight, setAvoidNight] = useState(false);

  // Calculate approach windows for the next 24 hours
  const approachWindows = useMemo(() => {
    if (!selectedStation) return [];

    const now = new Date();
    const end = addHours(now, 36);
    const series = predictTideSeries(selectedStation, now, end, 10);
    const extremes = findExtremes(series);

    const windows: ApproachWindow[] = [];
    const requiredDepth = vesselDraft + safetyMargin;
    const approachTime = (approachDistance / approachSpeed) * 60; // minutes

    // Analyze each hour-long window
    for (let h = 0; h < 24; h++) {
      const windowStart = addHours(now, h);
      windowStart.setMinutes(0, 0, 0);
      const windowEnd = addHours(windowStart, 1);

      // Find tide heights at start and end of window
      const startIndex = series.findIndex((p) => p.time >= windowStart);
      const endIndex = series.findIndex((p) => p.time >= windowEnd);

      if (startIndex === -1 || endIndex === -1) continue;

      const windowSeries = series.slice(startIndex, endIndex + 1);
      const heights = windowSeries.map((p) => p.height);
      const minHeight = Math.min(...heights);
      const maxHeight = Math.max(...heights);

      // Calculate actual water depth
      const minDepth = channelDepth + minHeight;
      const maxDepth = channelDepth + maxHeight;

      // Determine tidal state
      const nearestExtreme = extremes.reduce((nearest, e) => {
        const diff = Math.abs(e.time.getTime() - windowStart.getTime());
        const nearestDiff = Math.abs(nearest.time.getTime() - windowStart.getTime());
        return diff < nearestDiff ? e : nearest;
      }, extremes[0]!);

      const timeDiff = (windowStart.getTime() - nearestExtreme.time.getTime()) / 3600000; // hours

      let tidalState: ApproachWindow['tidalState'];
      if (Math.abs(timeDiff) < 1) {
        tidalState = nearestExtreme.type === 'high' ? 'slack-high' : 'slack-low';
      } else if (timeDiff > 0) {
        tidalState = nearestExtreme.type === 'high' ? 'ebb' : 'flood';
      } else {
        tidalState = nearestExtreme.type === 'high' ? 'flood' : 'ebb';
      }

      // Determine recommendation
      const notes: string[] = [];
      let recommendation: ApproachWindow['recommendation'];

      // Check if depth is sufficient
      if (minDepth < requiredDepth) {
        recommendation = 'avoid';
        notes.push(`Insufficient depth (${minDepth.toFixed(1)}m < ${requiredDepth.toFixed(1)}m required)`);
      } else if (minDepth < requiredDepth + 0.5) {
        recommendation = 'caution';
        notes.push('Marginal depth - proceed with extreme caution');
      } else if (tidalState === 'slack-high' || tidalState === 'slack-low') {
        recommendation = 'optimal';
        notes.push('Slack water - minimal current');
        if (tidalState === 'slack-high') {
          notes.push('Maximum depth available');
        }
      } else if (tidalState === 'flood') {
        recommendation = 'acceptable';
        notes.push('Flood tide - favorable for entering port');
        notes.push('Current may assist berthing');
      } else {
        recommendation = 'acceptable';
        notes.push('Ebb tide - consider current effects');
        if (preferSlack) {
          notes.push('Consider waiting for slack if possible');
        }
      }

      // Night check
      if (avoidNight) {
        const hour = windowStart.getHours();
        if (hour < 6 || hour > 20) {
          if (recommendation === 'optimal') recommendation = 'acceptable';
          else if (recommendation === 'acceptable') recommendation = 'caution';
          notes.push('Night approach - reduced visibility');
        }
      }

      // Add approach time consideration
      if (approachTime > 30 && tidalState !== 'slack-high' && tidalState !== 'slack-low') {
        notes.push(`Account for ${Math.round(approachTime)}min approach time`);
      }

      windows.push({
        start: windowStart,
        end: windowEnd,
        duration: 60,
        minDepth,
        maxDepth,
        tidalState,
        recommendation,
        notes,
      });
    }

    return windows;
  }, [
    selectedStation,
    vesselDraft,
    channelDepth,
    safetyMargin,
    approachDistance,
    approachSpeed,
    preferSlack,
    avoidNight,
  ]);

  // Find best windows
  const optimalWindows = approachWindows.filter((w) => w.recommendation === 'optimal');
  const nextOptimal = optimalWindows[0];

  const getRecommendationStyle = (rec: ApproachWindow['recommendation']) => {
    switch (rec) {
      case 'optimal':
        return 'bg-green-900/50 border-green-500';
      case 'acceptable':
        return 'bg-blue-900/50 border-blue-500';
      case 'caution':
        return 'bg-yellow-900/50 border-yellow-500';
      case 'avoid':
        return 'bg-red-900/50 border-red-500';
    }
  };

  const getRecommendationBadge = (rec: ApproachWindow['recommendation']) => {
    switch (rec) {
      case 'optimal':
        return 'bg-green-600 text-white';
      case 'acceptable':
        return 'bg-blue-600 text-white';
      case 'caution':
        return 'bg-yellow-600 text-black';
      case 'avoid':
        return 'bg-red-600 text-white';
    }
  };

  const getTidalStateLabel = (state: ApproachWindow['tidalState']) => {
    switch (state) {
      case 'slack-high':
        return 'Slack (HW)';
      case 'slack-low':
        return 'Slack (LW)';
      case 'flood':
        return 'Flooding';
      case 'ebb':
        return 'Ebbing';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900">
          <h2 className="text-lg font-semibold text-white">Port Approach Advisor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Explanation */}
          <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
            <p className="font-medium text-sky-400 mb-2">Safe Port Approach Planning</p>
            <p>
              Plan your port approach to ensure adequate depth, favorable currents, and safe conditions.
              This advisor considers your vessel's draft, channel depth, tidal state, and safety margins.
            </p>
          </div>

          {/* Parameters */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Vessel & Channel Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Vessel Draft (m)</label>
                <input
                  type="number"
                  value={vesselDraft}
                  onChange={(e) => setVesselDraft(Number(e.target.value))}
                  min={0.5}
                  max={20}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel Depth (m)</label>
                <input
                  type="number"
                  value={channelDepth}
                  onChange={(e) => setChannelDepth(Number(e.target.value))}
                  min={1}
                  max={50}
                  step={0.5}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Safety Margin (m)</label>
                <input
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(Number(e.target.value))}
                  min={0.2}
                  max={3}
                  step={0.1}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Approach Distance (nm)</label>
                <input
                  type="number"
                  value={approachDistance}
                  onChange={(e) => setApproachDistance(Number(e.target.value))}
                  min={0.5}
                  max={20}
                  step={0.5}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Approach Speed (kts)</label>
                <input
                  type="number"
                  value={approachSpeed}
                  onChange={(e) => setApproachSpeed(Number(e.target.value))}
                  min={1}
                  max={15}
                  step={0.5}
                  className="w-full px-3 py-2 bg-slate-700 rounded text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={preferSlack}
                    onChange={(e) => setPreferSlack(e.target.checked)}
                    className="rounded bg-slate-600"
                  />
                  Prefer slack
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={avoidNight}
                    onChange={(e) => setAvoidNight(e.target.checked)}
                    className="rounded bg-slate-600"
                  />
                  Avoid night
                </label>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
              Required clearance: {vesselDraft.toFixed(1)}m draft + {safetyMargin.toFixed(1)}m margin ={' '}
              <span className="text-white">{(vesselDraft + safetyMargin).toFixed(1)}m</span>
            </div>
          </div>

          {/* Next optimal window */}
          {nextOptimal && (
            <div className="bg-gradient-to-r from-green-900/40 to-slate-800 rounded-lg p-4 border border-green-600">
              <h3 className="text-sm font-medium text-green-400 mb-2">Next Optimal Window</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-lg font-medium">
                    {format(nextOptimal.start, 'HH:mm')} - {format(nextOptimal.end, 'HH:mm')}
                  </p>
                  <p className="text-slate-400 text-sm">{format(nextOptimal.start, 'EEE, MMM d')}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">{getTidalStateLabel(nextOptimal.tidalState)}</p>
                  <p className="text-slate-400 text-sm">
                    Depth: {nextOptimal.minDepth.toFixed(1)} - {nextOptimal.maxDepth.toFixed(1)}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Approach windows */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">24-Hour Approach Windows</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {approachWindows.map((window, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${getRecommendationStyle(window.recommendation)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-white font-medium">
                        {format(window.start, 'HH:mm')}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getRecommendationBadge(
                          window.recommendation
                        )}`}
                      >
                        {window.recommendation}
                      </span>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-slate-300">{getTidalStateLabel(window.tidalState)}</p>
                      <p className="text-slate-400 text-xs">
                        {window.minDepth.toFixed(1)} - {window.maxDepth.toFixed(1)}m
                      </p>
                    </div>
                  </div>
                  {window.notes.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      {window.notes.map((note, j) => (
                        <p key={j}>• {note}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Safety notes */}
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300 mb-1">Safety Considerations:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Always consult official charts and pilot books for accurate depths</li>
              <li>Weather conditions (swell, wind) can affect actual water depth</li>
              <li>Squat effect at speed reduces effective clearance</li>
              <li>Consider VHF communication with port control before approach</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
