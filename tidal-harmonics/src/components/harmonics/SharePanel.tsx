import { useState, useCallback, useRef, useEffect } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

/**
 * SharePanel
 *
 * Generates shareable URLs that encode the current view state,
 * including station selection, time, and enabled constituents.
 */
export function SharePanel({ onClose }: { onClose: () => void }) {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);
  const [copied, setCopied] = useState(false);
  const [includeTime, setIncludeTime] = useState(false);
  const [includeConstituents, setIncludeConstituents] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate shareable URL (using hash params for consistency with useUrlSync)
  const shareUrl = (() => {
    const params = new URLSearchParams();

    if (station) {
      params.set('station', station.id);
    }

    if (includeTime) {
      params.set('time', new Date(epoch).toISOString());
    }

    if (includeConstituents && visibleConstituents.length > 0) {
      params.set('constituents', visibleConstituents.join(','));
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const hashString = params.toString();
    return hashString ? `${baseUrl}#${hashString}` : baseUrl;
  })();

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [shareUrl]);

  // Handle Web Share API
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tide Predictions - ${station?.name || 'Tidal Harmonics'}`,
          text: `Check out the tide predictions for ${station?.name || 'this station'}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled:', err);
      }
    }
  }, [shareUrl, station]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-lg p-5 max-w-md w-full shadow-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <span>🔗</span>
            Share This View
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Share the current tide view with others. They'll see the same station
          and settings when they open the link.
        </p>

        {/* Options */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="rounded bg-slate-700 border-slate-600 text-cyan-500"
            />
            <span>Include station ({station?.name || 'None selected'})</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeConstituents}
              onChange={(e) => setIncludeConstituents(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600 text-cyan-500"
            />
            <span>Include visible constituents ({visibleConstituents.length} selected)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTime}
              onChange={(e) => setIncludeTime(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600 text-cyan-500"
            />
            <span>Include current time (link to specific moment)</span>
          </label>
        </div>

        {/* URL display */}
        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <label className="text-slate-500 text-xs block mb-1">Shareable Link</label>
          <input
            ref={inputRef}
            type="text"
            value={shareUrl}
            readOnly
            className="w-full bg-transparent text-white text-sm font-mono outline-none select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              Share...
            </button>
          )}
        </div>

        {/* QR hint */}
        <p className="text-slate-600 text-xs mt-3 text-center">
          Tip: On mobile, use "Share..." to quickly send via messaging apps
        </p>
      </div>
    </div>
  );
}
