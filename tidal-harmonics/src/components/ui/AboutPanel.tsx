import { useState } from 'react';
import { TidalGlossary } from './TidalGlossary';
import { HistoricalFacts } from './HistoricalFacts';

/**
 * About Panel
 *
 * Explains the project, data sources, and methodology.
 */
export function AboutPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-24 z-40 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm
          text-slate-400 text-xs rounded-lg hover:bg-slate-700 transition-colors"
        title="About this project"
      >
        ℹ️ About
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">About Tidal Harmonics</h2>
          <button
            onClick={() => setIsOpen(false)}
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

          {/* Methodology */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Methodology</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <strong className="text-white">Astronomical Calculations:</strong> Based on
                Schureman (1958) and NOAA methodology for computing equilibrium arguments and
                nodal corrections.
              </p>
              <p>
                <strong className="text-white">Harmonic Constants:</strong> Station data from
                NOAA CO-OPS (Center for Operational Oceanographic Products and Services).
              </p>
              <p>
                <strong className="text-white">Doodson Numbers:</strong> Each constituent is
                identified by six integers encoding its relationship to astronomical cycles,
                developed by Arthur Doodson (1890-1968).
              </p>
              <p>
                <strong className="text-white">37 Constituents:</strong> This simulation models
                the 37 major tidal constituents used by NOAA for official predictions.
              </p>
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Data Sources</h3>
            <ul className="space-y-1 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  <strong>NOAA CO-OPS:</strong> Harmonic constants for US tide stations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  <strong>astronomy-engine:</strong> Celestial body positions (Moon, Sun)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>
                  <strong>NASA:</strong> Planetary and satellite texture maps
                </span>
              </li>
            </ul>
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

          {/* References */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">References</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              <li>• Schureman, P. (1958). Manual of Harmonic Analysis and Prediction of Tides</li>
              <li>• Doodson, A.T. (1921). The Harmonic Development of the Tide-Generating Potential</li>
              <li>• Cartwright, D.E. (1999). Tides: A Scientific History</li>
              <li>• Parker, B.B. (2007). Tidal Analysis and Prediction</li>
            </ul>
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
          <span className="text-xs text-slate-500">
            Educational use only
          </span>
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
  );
}
