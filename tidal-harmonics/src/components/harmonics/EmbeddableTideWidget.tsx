import { useState, useEffect, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide, predictTideSeries, findExtremes } from '@/lib/harmonics';

interface EmbeddableTideWidgetProps {
  onClose: () => void;
}

// Generate embed code
function generateEmbedCode(stationId: string, theme: string, size: string): string {
  const baseUrl = window.location.origin;
  return `<iframe
  src="${baseUrl}/embed?station=${stationId}&theme=${theme}&size=${size}"
  width="${size === 'compact' ? '200' : size === 'medium' ? '300' : '400'}"
  height="${size === 'compact' ? '100' : size === 'medium' ? '150' : '200'}"
  frameborder="0"
  style="border-radius: 8px; overflow: hidden;"
  title="Tide Widget"
></iframe>`;
}

export function EmbeddableTideWidget({ onClose }: EmbeddableTideWidgetProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');
  const [size, setSize] = useState<'compact' | 'medium' | 'large'>('medium');
  const [copied, setCopied] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  // Update live time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentData = useMemo(() => {
    if (!station) return null;

    const now = liveTime;
    const height = predictTide(station, now);

    // Get extremes for next 24 hours
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const series = predictTideSeries(station, now, endTime, 10);
    const extremes = findExtremes(series);

    const nextHigh = extremes.find(e => e.type === 'high');
    const nextLow = extremes.find(e => e.type === 'low');

    // Calculate trend (rising or falling)
    const futureTime = new Date(now.getTime() + 15 * 60 * 1000);
    const futureHeight = predictTide(station, futureTime);
    const trend = futureHeight > height ? 'rising' : 'falling';

    // Calculate rate (m/hour)
    const rate = (futureHeight - height) * 4; // 15 min * 4 = 1 hour

    return {
      height,
      trend,
      rate,
      nextHigh,
      nextLow
    };
  }, [station, liveTime]);

  const formatHeight = (h: number) => {
    if (unitSystem === 'metric') {
      return `${h.toFixed(2)}m`;
    }
    return `${(h * 3.281).toFixed(1)}ft`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeUntil = (date: Date) => {
    const diff = date.getTime() - liveTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes}m`;
  };

  const copyToClipboard = async () => {
    if (!station) return;
    const code = generateEmbedCode(station.id, theme, size);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!station) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-slate-400">No station selected</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Embeddable Tide Widget</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Live preview */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Live Preview</h3>
            <div className={`rounded-lg p-4 ${
              theme === 'dark' ? 'bg-slate-900' : theme === 'light' ? 'bg-white' : 'bg-slate-900'
            }`}>
              {/* Widget content */}
              <div className={`${
                size === 'compact' ? 'flex items-center gap-3' :
                size === 'medium' ? 'space-y-2' : 'space-y-3'
              }`}>
                {/* Station name */}
                <div className={size === 'compact' ? '' : 'mb-1'}>
                  <div className={`font-semibold ${
                    theme === 'light' ? 'text-slate-800' : 'text-white'
                  } ${size === 'compact' ? 'text-sm' : 'text-base'}`}>
                    {station.name}
                  </div>
                  {size !== 'compact' && (
                    <div className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {liveTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Current height and trend */}
                {currentData && (
                  <div className={size === 'compact' ? 'flex items-center gap-2' : 'flex items-center gap-4'}>
                    <div>
                      <span className={`font-bold ${
                        theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                      } ${size === 'large' ? 'text-3xl' : size === 'medium' ? 'text-2xl' : 'text-xl'}`}>
                        {formatHeight(currentData.height)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      currentData.trend === 'rising' ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      <span className={size === 'compact' ? 'text-lg' : 'text-2xl'}>
                        {currentData.trend === 'rising' ? '↑' : '↓'}
                      </span>
                      {size !== 'compact' && (
                        <span className="text-xs">
                          {Math.abs(currentData.rate).toFixed(2)} m/hr
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Next extremes */}
                {currentData && size !== 'compact' && (
                  <div className={`grid ${size === 'large' ? 'grid-cols-2 gap-3' : 'grid-cols-2 gap-2'} text-sm`}>
                    {currentData.nextHigh && (
                      <div className={`rounded p-2 ${
                        theme === 'light' ? 'bg-blue-50' : 'bg-blue-900/30'
                      }`}>
                        <div className={`text-xs ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                          High Tide
                        </div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                          {formatHeight(currentData.nextHigh.height)}
                        </div>
                        <div className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {formatTime(currentData.nextHigh.time)} ({formatTimeUntil(currentData.nextHigh.time)})
                        </div>
                      </div>
                    )}
                    {currentData.nextLow && (
                      <div className={`rounded p-2 ${
                        theme === 'light' ? 'bg-orange-50' : 'bg-orange-900/30'
                      }`}>
                        <div className={`text-xs ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`}>
                          Low Tide
                        </div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                          {formatHeight(currentData.nextLow.height)}
                        </div>
                        <div className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {formatTime(currentData.nextLow.time)} ({formatTimeUntil(currentData.nextLow.time)})
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customization options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Theme</label>
              <div className="flex gap-2">
                {(['dark', 'light', 'auto'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1 rounded text-sm capitalize ${
                      theme === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Size</label>
              <div className="flex gap-2">
                {(['compact', 'medium', 'large'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-3 py-1 rounded text-sm capitalize ${
                      size === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Embed code */}
          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-2">Embed Code</label>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{generateEmbedCode(station.id, theme, size)}</pre>
            </div>
            <button
              onClick={copyToClipboard}
              className={`mt-2 px-4 py-2 rounded text-sm transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          {/* Usage notes */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-sm">
            <h3 className="text-slate-400 font-semibold mb-2">Usage Notes</h3>
            <ul className="text-slate-500 space-y-1">
              <li>• Widget updates automatically every minute</li>
              <li>• Auto theme follows system dark/light mode preference</li>
              <li>• Works responsively on mobile devices</li>
              <li>• Embed on blogs, marina websites, or weather pages</li>
              <li>• No API key required - uses public NOAA harmonic constants</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
