import { useState } from 'react';

interface Step {
  title: string;
  description: string;
  visual: 'observations' | 'subtraction' | 'frequency' | 'fitting' | 'result';
}

const ANALYSIS_STEPS: Step[] = [
  {
    title: '1. Collect Observations',
    description: 'Water level measurements are recorded at regular intervals (typically every 6 minutes) for at least 19 years to capture the full 18.6-year nodal cycle. High-quality data requires precise pressure sensors or acoustic gauges with known vertical datums.',
    visual: 'observations',
  },
  {
    title: '2. Remove Mean Sea Level',
    description: 'The long-term mean water level is subtracted to center the data around zero. This removes non-tidal effects like sea level rise and seasonal heating expansion. The remaining signal contains the tidal oscillations we want to analyze.',
    visual: 'subtraction',
  },
  {
    title: '3. Identify Known Frequencies',
    description: 'Since tidal periods are determined by astronomical motions (Moon orbit, Earth rotation, etc.), we know exactly which frequencies to look for. The analysis searches for signals at these specific periods: M2 at 12.42 hours, S2 at 12.00 hours, K1 at 23.93 hours, and so on.',
    visual: 'frequency',
  },
  {
    title: '4. Least-Squares Fitting',
    description: 'For each constituent frequency, the analysis finds the best-fit amplitude and phase using least-squares regression. The model h(t) = A·cos(ωt - φ) is fit to the data at each tidal frequency ω. This extracts the local amplitude A and phase φ.',
    visual: 'fitting',
  },
  {
    title: '5. Quality Assessment',
    description: 'The extracted constituents are used to predict tides, which are compared against the original observations. Good harmonic constants typically achieve prediction errors under 10cm RMS. The final set of amplitudes and phases forms the station\'s harmonic constants.',
    visual: 'result',
  },
];

function VisualDemo({ type }: { type: Step['visual'] }) {
  return (
    <div className="h-32 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
      {type === 'observations' && (
        <svg viewBox="0 0 200 80" className="w-full h-full p-2">
          <path
            d="M0,40 Q10,20 20,35 T40,45 T60,30 T80,50 T100,35 T120,45 T140,30 T160,40 T180,35 T200,45"
            stroke="#60a5fa"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Data points */}
          {[10, 30, 50, 70, 90, 110, 130, 150, 170, 190].map((x, i) => (
            <circle key={i} cx={x} cy={35 + Math.sin(x / 20) * 10} r="2" fill="#f59e0b" />
          ))}
          <text x="100" y="75" textAnchor="middle" fill="#64748b" fontSize="8">Raw observations over time</text>
        </svg>
      )}
      {type === 'subtraction' && (
        <svg viewBox="0 0 200 80" className="w-full h-full p-2">
          {/* Mean line */}
          <line x1="0" y1="40" x2="200" y2="40" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
          {/* Centered wave */}
          <path
            d="M0,40 Q25,20 50,40 T100,40 T150,40 T200,40"
            stroke="#60a5fa"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M0,40 Q25,60 50,40 T100,40 T150,40 T200,40"
            stroke="#60a5fa"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
          <text x="100" y="75" textAnchor="middle" fill="#64748b" fontSize="8">Signal centered around mean</text>
        </svg>
      )}
      {type === 'frequency' && (
        <svg viewBox="0 0 200 80" className="w-full h-full p-2">
          {/* Frequency bars */}
          <rect x="20" y="20" width="12" height="45" fill="#10b981" opacity="0.8" />
          <rect x="45" y="30" width="12" height="35" fill="#10b981" opacity="0.8" />
          <rect x="70" y="40" width="12" height="25" fill="#10b981" opacity="0.8" />
          <rect x="95" y="45" width="12" height="20" fill="#10b981" opacity="0.8" />
          <rect x="120" y="50" width="12" height="15" fill="#10b981" opacity="0.8" />
          <rect x="145" y="55" width="12" height="10" fill="#10b981" opacity="0.8" />
          {/* Labels */}
          <text x="26" y="75" textAnchor="middle" fill="#64748b" fontSize="6">M2</text>
          <text x="51" y="75" textAnchor="middle" fill="#64748b" fontSize="6">S2</text>
          <text x="76" y="75" textAnchor="middle" fill="#64748b" fontSize="6">K1</text>
          <text x="101" y="75" textAnchor="middle" fill="#64748b" fontSize="6">O1</text>
          <text x="126" y="75" textAnchor="middle" fill="#64748b" fontSize="6">N2</text>
          <text x="151" y="75" textAnchor="middle" fill="#64748b" fontSize="6">...</text>
          <text x="100" y="12" textAnchor="middle" fill="#64748b" fontSize="8">Frequency spectrum</text>
        </svg>
      )}
      {type === 'fitting' && (
        <svg viewBox="0 0 200 80" className="w-full h-full p-2">
          {/* Noisy data */}
          <path
            d="M0,40 Q25,15 50,40 T100,42 T150,38 T200,41"
            stroke="#60a5fa"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          {/* Fitted sine */}
          <path
            d="M0,40 Q50,10 100,40 T200,40"
            stroke="#f59e0b"
            strokeWidth="2"
            fill="none"
          />
          <text x="30" y="18" fill="#f59e0b" fontSize="7">A·cos(ωt - φ)</text>
          <text x="100" y="75" textAnchor="middle" fill="#64748b" fontSize="8">Best-fit sinusoid</text>
        </svg>
      )}
      {type === 'result' && (
        <svg viewBox="0 0 200 80" className="w-full h-full p-2">
          {/* Prediction vs observation */}
          <path
            d="M0,40 Q25,20 50,35 T100,45 T150,30 T200,40"
            stroke="#60a5fa"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M0,40 Q25,22 50,37 T100,43 T150,32 T200,40"
            stroke="#10b981"
            strokeWidth="1.5"
            fill="none"
          />
          <text x="20" y="15" fill="#60a5fa" fontSize="7">Observed</text>
          <text x="70" y="15" fill="#10b981" fontSize="7">Predicted</text>
          <text x="100" y="75" textAnchor="middle" fill="#64748b" fontSize="8">Prediction matches observation</text>
        </svg>
      )}
    </div>
  );
}

export function HarmonicAnalysisExplainer({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Harmonic Analysis</h2>
              <p className="text-sm text-slate-400">
                How constituent data is extracted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Introduction */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-sm text-slate-300">
              <strong className="text-white">Harmonic analysis</strong> is the mathematical process that
              transforms raw water level observations into the amplitude and phase values for each tidal
              constituent. This is how we obtain the data that powers tide predictions.
            </p>
          </div>

          {/* Step navigation */}
          <div className="flex gap-1">
            {ANALYSIS_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Current step */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">
              {ANALYSIS_STEPS[currentStep]!.title}
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              {ANALYSIS_STEPS[currentStep]!.description}
            </p>
            <VisualDemo type={ANALYSIS_STEPS[currentStep]!.visual} />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-slate-400 self-center text-sm">
              {currentStep + 1} / {ANALYSIS_STEPS.length}
            </span>
            <button
              onClick={() => setCurrentStep(Math.min(ANALYSIS_STEPS.length - 1, currentStep + 1))}
              disabled={currentStep === ANALYSIS_STEPS.length - 1}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Historical context */}
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-400">📜</span>
              <div className="text-sm">
                <p className="text-amber-200 font-medium">Historical Note</p>
                <p className="text-slate-300 mt-1">
                  The method of harmonic analysis was developed by Lord Kelvin and Sir George Darwin
                  in the 1860s-1870s. Kelvin also invented mechanical tide prediction machines that
                  used gears and pulleys to sum the constituent waves—analog computers that
                  remained in use until the 1960s.
                </p>
              </div>
            </div>
          </div>

          {/* Key formula */}
          <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm text-center">
            <p className="text-slate-400 text-xs mb-2">The fundamental equation:</p>
            <p className="text-cyan-300">
              h(t) = Z₀ + Σ [fₙ·Aₙ·cos(ωₙt + Vₙ + uₙ - φₙ)]
            </p>
            <p className="text-slate-500 text-xs mt-2">
              where Z₀ is mean sea level, f is nodal factor, A is amplitude,
              ω is angular speed, V is astronomical argument, u is nodal angle, φ is phase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
