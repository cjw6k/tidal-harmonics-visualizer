import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface PhotoTimingPlannerProps {
  onClose: () => void;
}

interface GoldenWindow {
  date: Date;
  type: 'sunrise' | 'sunset';
  goldenStart: Date;
  goldenEnd: Date;
  blueStart: Date;
  blueEnd: Date;
  tideAtGolden: number;
  tideState: 'rising' | 'falling' | 'low' | 'high';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
}

// Simple sunrise/sunset calculation
function getSunTimes(date: Date, latitude: number, longitude: number): { sunrise: Date; sunset: Date } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const latRad = latitude * Math.PI / 180;

  // Solar declination
  const declination = -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365) * Math.PI / 180;

  // Hour angle
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declination);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;

  // Solar noon (approximate)
  const solarNoon = 12 - longitude / 15; // Hours UTC

  const sunriseHour = solarNoon - hourAngle / 15;
  const sunsetHour = solarNoon + hourAngle / 15;

  const sunrise = new Date(date);
  sunrise.setUTCHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);

  const sunset = new Date(date);
  sunset.setUTCHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);

  return { sunrise, sunset };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function PhotoTimingPlanner({ onClose }: PhotoTimingPlannerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [daysAhead, setDaysAhead] = useState(14);
  const [preferLowTide, setPreferLowTide] = useState(true);
  const [showSunrise, setShowSunrise] = useState(true);
  const [showSunset, setShowSunset] = useState(true);

  const photoWindows = useMemo(() => {
    if (!selectedStation) return [];

    const latitude = selectedStation.lat ?? 51.5; // Default to London
    const longitude = selectedStation.lon ?? 0;

    const windows: GoldenWindow[] = [];
    const now = new Date();

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      date.setHours(0, 0, 0, 0);

      const { sunrise, sunset } = getSunTimes(date, latitude, longitude);

      // Golden hour is ~1 hour before sunset and after sunrise
      // Blue hour is ~30 min before sunrise and after sunset
      const events = [
        showSunrise ? {
          type: 'sunrise' as const,
          sun: sunrise,
          goldenStart: new Date(sunrise.getTime()),
          goldenEnd: new Date(sunrise.getTime() + 60 * 60000),
          blueStart: new Date(sunrise.getTime() - 30 * 60000),
          blueEnd: new Date(sunrise.getTime()),
        } : null,
        showSunset ? {
          type: 'sunset' as const,
          sun: sunset,
          goldenStart: new Date(sunset.getTime() - 60 * 60000),
          goldenEnd: new Date(sunset.getTime()),
          blueStart: new Date(sunset.getTime()),
          blueEnd: new Date(sunset.getTime() + 30 * 60000),
        } : null,
      ].filter(Boolean);

      for (const event of events) {
        if (!event) continue;

        // Get tide at golden hour midpoint
        const goldenMidpoint = new Date((event.goldenStart.getTime() + event.goldenEnd.getTime()) / 2);
        const tideAtGolden = predictTide(selectedStation, goldenMidpoint);

        // Calculate tide state
        const tideBefore = predictTide(selectedStation, new Date(goldenMidpoint.getTime() - 30 * 60000));
        const tideAfter = predictTide(selectedStation, new Date(goldenMidpoint.getTime() + 30 * 60000));
        const tideRate = tideAfter - tideBefore;

        let tideState: 'rising' | 'falling' | 'low' | 'high';
        if (Math.abs(tideRate) < 0.03) {
          tideState = tideRate >= 0 ? 'high' : 'low';
        } else {
          tideState = tideRate > 0 ? 'rising' : 'falling';
        }

        // Calculate photo quality score
        // For coastal photography, low tide often reveals more interesting features
        // But near slack water is also good for calm reflections
        let score = 50;

        if (preferLowTide) {
          // Prefer lower tides - more beach/rocks exposed
          const tideRange = 4; // Assume ~4m typical range
          const normalizedHeight = tideAtGolden / tideRange;
          score += (1 - normalizedHeight) * 30; // Lower tide = higher score

          // Bonus for slack water (calm conditions)
          if (tideState === 'low' || tideState === 'high') {
            score += 15;
          }
        } else {
          // Prefer high tide - dramatic waves/splashes
          const tideRange = 4;
          const normalizedHeight = tideAtGolden / tideRange;
          score += normalizedHeight * 30;
        }

        // Slight preference for sunset (warmer light)
        if (event.type === 'sunset') {
          score += 5;
        }

        let quality: 'excellent' | 'good' | 'fair' | 'poor';
        if (score >= 75) quality = 'excellent';
        else if (score >= 60) quality = 'good';
        else if (score >= 45) quality = 'fair';
        else quality = 'poor';

        windows.push({
          date,
          type: event.type,
          goldenStart: event.goldenStart,
          goldenEnd: event.goldenEnd,
          blueStart: event.blueStart,
          blueEnd: event.blueEnd,
          tideAtGolden,
          tideState,
          quality,
          score,
        });
      }
    }

    // Sort by score (best first)
    return windows.sort((a, b) => b.score - a.score);
  }, [selectedStation, daysAhead, preferLowTide, showSunrise, showSunset]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  const qualityColors = {
    excellent: 'text-green-400 bg-green-900/30',
    good: 'text-blue-400 bg-blue-900/30',
    fair: 'text-yellow-400 bg-yellow-900/30',
    poor: 'text-slate-400 bg-slate-700/30',
  };

  const tideStateIcons = {
    rising: '↗️',
    falling: '↘️',
    high: '🔝',
    low: '⬇️',
  };

  if (!selectedStation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to plan photo sessions</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-amber-400">📷 Photo Timing Planner</h3>
            <p className="text-slate-400 text-sm">{selectedStation.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Explanation */}
        <div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm text-slate-300">
          <p>
            Find optimal times when <strong>golden hour</strong> light coincides with
            favorable tide conditions for coastal photography.
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Days Ahead</label>
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              <option value={7}>1 Week</option>
              <option value={14}>2 Weeks</option>
              <option value={30}>1 Month</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Prefer</label>
            <select
              value={preferLowTide ? 'low' : 'high'}
              onChange={(e) => setPreferLowTide(e.target.value === 'low')}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            >
              <option value="low">Low Tide (rocks/pools)</option>
              <option value="high">High Tide (waves)</option>
            </select>
          </div>
        </div>

        {/* Toggle filters */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showSunrise}
              onChange={(e) => setShowSunrise(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600"
            />
            🌅 Sunrise
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showSunset}
              onChange={(e) => setShowSunset(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600"
            />
            🌇 Sunset
          </label>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {photoWindows.slice(0, 20).map((window, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 ${qualityColors[window.quality]}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium">
                    {window.type === 'sunrise' ? '🌅' : '🌇'} {formatDate(window.date)}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs uppercase ${
                    window.quality === 'excellent' ? 'bg-green-600' :
                    window.quality === 'good' ? 'bg-blue-600' :
                    window.quality === 'fair' ? 'bg-yellow-600' : 'bg-slate-600'
                  }`}>
                    {window.quality}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Score: {Math.round(window.score)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-slate-400">Golden Hour</div>
                  <div>{formatTime(window.goldenStart)} - {formatTime(window.goldenEnd)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Blue Hour</div>
                  <div>{formatTime(window.blueStart)} - {formatTime(window.blueEnd)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Tide Height</div>
                  <div>{formatHeight(window.tideAtGolden)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Tide State</div>
                  <div>
                    {tideStateIcons[window.tideState]}{' '}
                    {window.tideState.charAt(0).toUpperCase() + window.tideState.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Photography Tips */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">📸 Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Low tide reveals tide pools, textures, and rock formations</li>
            <li>• High tide creates dramatic wave action and reflections</li>
            <li>• Slack water (high/low) gives calmest conditions</li>
            <li>• Arrive 30 min early to scout compositions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
