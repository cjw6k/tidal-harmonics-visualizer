import { useState, useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { TidalGlossary } from './TidalGlossary';
import { HistoricalFacts } from './HistoricalFacts';

export function BottomLeftButtons() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Keyboard shortcut to toggle shortcuts help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' && e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Side-by-side buttons at bottom-left */}
      <div className="fixed bottom-4 left-4 z-40 flex gap-2">
        <button
          onClick={() => setShowShortcuts(true)}
          className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm
            text-slate-400 text-[11px] rounded hover:bg-slate-700 transition-colors"
          title="Keyboard shortcuts (Ctrl+H)"
        >
          ⌨️ Shortcuts
        </button>
        <button
          onClick={() => setShowAbout(true)}
          className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm
            text-slate-400 text-[11px] rounded hover:bg-slate-700 transition-colors"
          title="About this project"
        >
          ℹ️ About
        </button>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {KEYBOARD_SHORTCUTS.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">{category.category}</h3>
                  <div className="space-y-1">
                    {category.shortcuts.map((shortcut) => (
                      <div key={shortcut.key} className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">{shortcut.action}</span>
                        <kbd className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-700 text-center text-xs text-slate-500">
              Press <kbd className="px-1 bg-slate-800 rounded">Ctrl+H</kbd> to toggle this help
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">About Tidal Harmonics</h2>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Overview */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">What is This?</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Tidal Harmonics is an interactive educational visualization of how ocean tides work.
                  It demonstrates the harmonic analysis method used by NOAA and other oceanographic
                  agencies to predict tides anywhere in the world.
                </p>
              </section>

              {/* The Science */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">The Science</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                  Tides are caused by the gravitational pull of the Moon and Sun on Earth's oceans.
                  Because the Moon and Sun move in complex patterns (elliptical orbits, changing
                  declinations, 18.6-year nodal cycle), real tides are surprisingly complex.
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Harmonic analysis decomposes this complexity into simple sine waves, each
                  corresponding to a specific astronomical cycle. By measuring the amplitude and
                  phase of each "constituent" at a location, we can predict tides indefinitely
                  into the future.
                </p>
              </section>

              {/* Educational Notes */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">Educational Notes</h3>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-slate-300">
                  <p className="mb-2">
                    <strong className="text-amber-400">Visual Exaggeration:</strong> The tidal bulge
                    shown in the 3D view is exaggerated by 10,000× to 100,000×. Real tidal bulges
                    are only about 0.5 meters high in deep ocean!
                  </p>
                  <p>
                    <strong className="text-amber-400">Prediction Accuracy:</strong> This simulation
                    uses simplified nodal corrections. Official NOAA predictions use more precise
                    formulas and many more constituents for critical applications.
                  </p>
                </div>
              </section>

              {/* Technology */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">Built With</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Three.js', 'React Three Fiber', 'Zustand', 'Recharts', 'TypeScript', 'Vite', 'Tailwind CSS'].map(tech => (
                    <span key={tech} className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowGlossary(true)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  Glossary
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-purple-400 hover:text-purple-300 text-xs"
                >
                  History & Facts
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  Version:{' '}
                  <a
                    href={`https://github.com/cjw6k/tidal-harmonics-visualizer/commit/${__GIT_SHA__}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {__GIT_SHA__}
                  </a>
                </span>
                <span>
                  Made by{' '}
                  <a
                    href="https://github.com/cjw6k"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    cjw6k
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Glossary Modal */}
          {showGlossary && (
            <TidalGlossary onClose={() => setShowGlossary(false)} />
          )}

          {/* Historical Facts Modal */}
          {showHistory && (
            <HistoricalFacts onClose={() => setShowHistory(false)} />
          )}
        </div>
      )}
    </>
  );
}
