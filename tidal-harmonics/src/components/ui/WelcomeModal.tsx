import { useState, useEffect } from 'react';

const STORAGE_KEY = 'welcome-dismissed';

/**
 * Welcome Modal
 *
 * Shows on first visit to introduce key features.
 * Can be dismissed permanently with "Don't show again" checkbox.
 */
export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Welcome to Tidal Harmonics!</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Device notice */}
          <p className="text-slate-500 text-xs text-center">
            Best experienced on tablet, laptop, desktop, or TV. Not optimized for mobile phones.
          </p>

          {/* Feature callouts */}
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">Get started with these features:</p>

            {/* Tutorial callout */}
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-xl">📖</span>
              <div>
                <h3 className="text-white font-medium text-sm">Start Tutorial</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Learn how tides work with our interactive guide.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">Bottom-left corner</p>
              </div>
            </div>

            {/* About callout */}
            <div className="flex items-start gap-3 p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg">
              <span className="text-xl">ℹ️</span>
              <div>
                <h3 className="text-white font-medium text-sm">About</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Explore glossary, history, and keyboard shortcuts.
                </p>
                <p className="text-slate-500 text-xs mt-1 italic">Above the tutorial button</p>
              </div>
            </div>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500
                focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <span className="text-slate-400 text-sm">Don't show this again</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg
              hover:bg-blue-500 transition-colors font-medium"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
