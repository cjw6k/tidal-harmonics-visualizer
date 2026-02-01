import { useState } from 'react';

interface Props {
  onClose?: () => void;
}

export function TidalLoadingExplainer({ onClose }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<string>('overview');

  const topics = [
    { id: 'overview', label: 'Overview', icon: '🌍' },
    { id: 'mechanism', label: 'How It Works', icon: '⚙️' },
    { id: 'magnitude', label: 'How Much?', icon: '📏' },
    { id: 'effects', label: 'Real Effects', icon: '🎯' },
    { id: 'measurement', label: 'Measuring', icon: '📡' },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 border border-slate-700 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Ocean Tidal Loading</h3>
          <p className="text-slate-400 text-xs mt-1">
            How tides make the land rise and fall
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Topic navigation */}
      <div className="flex flex-wrap gap-1 mb-4">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedTopic(topic.id)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              selectedTopic === topic.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {topic.icon} {topic.label}
          </button>
        ))}
      </div>

      {/* Topic content */}
      <div className="space-y-4">
        {selectedTopic === 'overview' && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                <span className="text-emerald-400 font-semibold">Ocean tidal loading</span> is the
                deformation of the Earth's crust caused by the weight of tidal water. As tides rise
                and fall, billions of tons of water shift across the ocean surface, pushing down on
                the seafloor and nearby coastlines.
              </p>
            </div>

            {/* Visual representation */}
            <div className="bg-slate-800 rounded-lg p-4">
              <svg viewBox="0 0 300 120" className="w-full">
                {/* Earth crust baseline */}
                <path
                  d="M0 80 Q75 75 150 80 Q225 85 300 80"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {/* Deformed crust */}
                <path
                  d="M0 80 Q75 78 150 82 Q225 86 300 81"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />

                {/* Water mass */}
                <ellipse cx="200" cy="55" rx="50" ry="20" fill="#3b82f6" opacity="0.3" />
                <ellipse cx="200" cy="55" rx="50" ry="20" fill="none" stroke="#3b82f6" strokeWidth="1" />

                {/* Load arrows */}
                <path d="M180 70 L180 78" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <path d="M200 70 L200 80" stroke="#f59e0b" strokeWidth="2" />
                <path d="M220 70 L220 78" stroke="#f59e0b" strokeWidth="2" />

                {/* Labels */}
                <text x="200" y="50" fill="#93c5fd" fontSize="10" textAnchor="middle">Tidal water mass</text>
                <text x="50" y="75" fill="#9ca3af" fontSize="8" textAnchor="middle">Undeformed crust</text>
                <text x="250" y="98" fill="#10b981" fontSize="8" textAnchor="middle">Depressed crust</text>

                {/* Uplift on sides */}
                <path d="M80 78 L80 73" stroke="#22c55e" strokeWidth="1.5" />
                <text x="80" y="68" fill="#22c55e" fontSize="7" textAnchor="middle">↑ uplift</text>
              </svg>
              <p className="text-slate-400 text-xs text-center mt-2">
                High tide water mass pushes down on crust, causing slight depression
              </p>
            </div>
          </div>
        )}

        {selectedTopic === 'mechanism' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-cyan-400 font-medium text-sm mb-2">The Physics</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                The Earth isn't perfectly rigid—it behaves elastically under load. When tidal water
                piles up in one area, the added weight (up to <span className="text-cyan-300">10+ meters</span> of
                water in some bays) pushes down on the ocean floor. This creates a "dimple" in the
                Earth's surface that propagates inland.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-amber-400 font-medium text-sm mb-2">Three Components</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-amber-400 shrink-0">1.</span>
                  <div>
                    <span className="text-white">Direct Loading:</span>
                    <span className="text-slate-400"> The immediate depression under the water mass</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 shrink-0">2.</span>
                  <div>
                    <span className="text-white">Peripheral Bulge:</span>
                    <span className="text-slate-400"> Slight uplift in areas surrounding the load</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 shrink-0">3.</span>
                  <div>
                    <span className="text-white">Gravitational Effect:</span>
                    <span className="text-slate-400"> The water mass also attracts nearby land gravitationally</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-rose-400 font-medium text-sm mb-2">Propagation</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                The deformation spreads inland at roughly 3 km/s (the speed of seismic surface waves).
                Coastal areas feel the strongest effects, but the signal can be detected hundreds of
                kilometers inland, decaying roughly exponentially with distance from the coast.
              </p>
            </div>
          </div>
        )}

        {selectedTopic === 'magnitude' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-emerald-400 font-medium text-sm mb-2">Typical Magnitudes</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-700">
                  <span className="text-slate-300 text-xs">Coastal vertical motion</span>
                  <span className="text-emerald-400 text-sm font-mono">1-5 cm</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-700">
                  <span className="text-slate-300 text-xs">100 km inland</span>
                  <span className="text-emerald-400 text-sm font-mono">0.5-2 cm</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-700">
                  <span className="text-slate-300 text-xs">Horizontal displacement</span>
                  <span className="text-emerald-400 text-sm font-mono">0.5-3 cm</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-300 text-xs">Gravity variation</span>
                  <span className="text-emerald-400 text-sm font-mono">~10 μGal</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-purple-400 font-medium text-sm mb-2">Extreme Locations</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bay of Fundy region</span>
                  <span className="text-purple-300">up to 10 cm vertical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bristol Channel, UK</span>
                  <span className="text-purple-300">5-7 cm vertical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gulf of St. Malo</span>
                  <span className="text-purple-300">4-6 cm vertical</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-3 border-l-4 border-emerald-500">
              <p className="text-slate-300 text-xs leading-relaxed">
                <span className="text-emerald-400 font-medium">Scale context:</span> These centimeter-level
                motions may seem tiny, but they're comparable to the precision of GPS positioning
                and matter greatly for surveying, construction, and scientific instruments.
              </p>
            </div>
          </div>
        )}

        {selectedTopic === 'effects' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-blue-400 font-medium text-sm mb-2">🛰️ GPS & Surveying</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Precise GPS measurements must account for ocean tidal loading. Without corrections,
                position errors of several centimeters can occur. This affects everything from
                cadastral surveys to monitoring tectonic plate motion.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-yellow-400 font-medium text-sm mb-2">🔬 Particle Physics</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                The Large Hadron Collider at CERN experiences measurable deformation from ocean tidal
                loading (even though it's ~400 km from the sea). The 27 km ring expands and contracts
                by about 1 mm, requiring compensation in beam steering.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-red-400 font-medium text-sm mb-2">🌋 Volcano Monitoring</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Tidal loading can trigger or modulate volcanic activity. The deformation and stress
                changes can affect magma movement and eruption timing at some volcanoes, particularly
                those near coastlines.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-green-400 font-medium text-sm mb-2">📐 Height References</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                National height systems and tide gauge networks must account for the fact that the
                land itself is moving. A tide gauge measures water level relative to land—but if
                the land moves too, the measurement is affected.
              </p>
            </div>
          </div>
        )}

        {selectedTopic === 'measurement' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-cyan-400 font-medium text-sm mb-2">Detection Methods</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-cyan-400">📡</span>
                  <div>
                    <span className="text-white">GPS/GNSS:</span>
                    <span className="text-slate-400"> Continuous position monitoring to sub-cm precision</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">⚖️</span>
                  <div>
                    <span className="text-white">Gravimeters:</span>
                    <span className="text-slate-400"> Measure tiny gravity changes from mass redistribution</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">📏</span>
                  <div>
                    <span className="text-white">Strainmeters:</span>
                    <span className="text-slate-400"> Detect horizontal crustal stretching</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">🛰️</span>
                  <div>
                    <span className="text-white">InSAR:</span>
                    <span className="text-slate-400"> Satellite radar measures ground deformation patterns</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-amber-400 font-medium text-sm mb-2">Modeling</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Ocean tidal loading is predicted using global ocean tide models (like FES2014 or GOT4.10c)
                combined with Earth models that describe how the planet deforms under load. These
                calculations involve complex integrals over all ocean areas.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-emerald-400 font-medium text-sm mb-2">Loading Coefficients</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Just like tidal harmonic constituents, ocean loading effects are decomposed into
                harmonic components (M2, S2, K1, etc.). Each constituent has its own loading
                amplitude and phase at every location, provided by services like the IERS or EOST.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fun fact */}
      <div className="mt-4 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-lg p-3 border border-emerald-800/30">
        <p className="text-emerald-200 text-xs leading-relaxed">
          <span className="font-semibold">🌍 Did you know?</span> The entire continent of Europe
          tilts slightly towards the Atlantic Ocean twice a day due to ocean tidal loading.
          Scandinavia rises while the UK and France sink—then reverses 6 hours later!
        </p>
      </div>
    </div>
  );
}
