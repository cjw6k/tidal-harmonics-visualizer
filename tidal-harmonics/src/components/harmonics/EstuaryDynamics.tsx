import { useState } from 'react';

interface Props {
  onClose?: () => void;
}

interface EstuaryExample {
  id: string;
  name: string;
  river: string;
  country: string;
  length: string;
  tidalRange: string;
  feature: string;
  description: string;
}

const FAMOUS_ESTUARIES: EstuaryExample[] = [
  {
    id: 'severn',
    name: 'Severn Estuary',
    river: 'River Severn',
    country: 'UK',
    length: '~80 km',
    tidalRange: '12-14 m',
    feature: 'Second highest tides in the world, famous tidal bore',
    description: 'The funnel shape amplifies Atlantic tides to create one of the world\'s highest tidal ranges. The Severn Bore is a surfable wave that travels upstream.',
  },
  {
    id: 'bay-fundy',
    name: 'Bay of Fundy',
    river: 'Multiple rivers',
    country: 'Canada',
    length: '~270 km',
    tidalRange: '11-16 m',
    feature: 'Highest tides in the world',
    description: 'Resonance between tidal period and basin length creates extreme amplification. At Burntcoat Head, tides exceed 16 meters during spring tides.',
  },
  {
    id: 'thames',
    name: 'Thames Estuary',
    river: 'River Thames',
    country: 'UK',
    length: '~100 km',
    tidalRange: '5-7 m',
    feature: 'Tidal to London, heavily managed',
    description: 'The tide reaches as far as Teddington Lock, over 100 km from the sea. The Thames Barrier protects London from storm surge flooding.',
  },
  {
    id: 'amazon',
    name: 'Amazon River',
    river: 'Amazon',
    country: 'Brazil',
    length: '>1000 km tidal',
    tidalRange: '3-6 m',
    feature: 'Pororoca tidal bore',
    description: 'Despite the massive river discharge, tides penetrate over 1000 km upstream. The Pororoca bore can reach 4m high and travel at 25 km/h.',
  },
  {
    id: 'qiantang',
    name: 'Qiantang River',
    river: 'Qiantang',
    country: 'China',
    length: '~100 km tidal',
    tidalRange: '6-9 m',
    feature: 'World\'s largest tidal bore',
    description: 'The Silver Dragon bore can reach 9 meters high and travel at 40 km/h. Viewed by millions during the Mid-Autumn Festival.',
  },
];

export function EstuaryDynamics({ onClose }: Props) {
  const [selectedEstuary, setSelectedEstuary] = useState<EstuaryExample | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('propagation');

  const topics = [
    { id: 'propagation', label: 'Wave Propagation', icon: '🌊' },
    { id: 'asymmetry', label: 'Tidal Asymmetry', icon: '⚖️' },
    { id: 'bore', label: 'Tidal Bores', icon: '🏄' },
    { id: 'mixing', label: 'Salt Wedge', icon: '🧪' },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 border border-slate-700 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Estuary Tidal Dynamics</h3>
          <p className="text-slate-400 text-xs mt-1">
            How tides behave in rivers and coastal inlets
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
                ? 'bg-teal-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {topic.icon} {topic.label}
          </button>
        ))}
      </div>

      {/* Topic content */}
      <div className="space-y-4 mb-4">
        {selectedTopic === 'propagation' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-teal-400 font-medium text-sm mb-2">How Tides Enter Estuaries</h4>
              <p className="text-slate-300 text-xs leading-relaxed mb-3">
                When the oceanic tidal wave enters an estuary, several things happen:
              </p>

              {/* Animation-like visualization */}
              <svg viewBox="0 0 300 100" className="w-full bg-slate-900 rounded-lg p-2">
                {/* Estuary shape */}
                <path
                  d="M10 50 L50 30 L150 25 L250 20 L290 15"
                  fill="none"
                  stroke="#4a5568"
                  strokeWidth="2"
                />
                <path
                  d="M10 50 L50 70 L150 75 L250 80 L290 85"
                  fill="none"
                  stroke="#4a5568"
                  strokeWidth="2"
                />

                {/* Wave lines representing tide */}
                <path
                  d="M30 50 Q45 40 60 50 Q75 60 90 50"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <path
                  d="M110 50 Q120 42 130 50 Q140 58 150 50"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2"
                  opacity="0.6"
                />
                <path
                  d="M180 50 Q187 44 194 50 Q201 56 208 50"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2"
                  opacity="0.4"
                />

                {/* Labels */}
                <text x="20" y="95" fill="#9ca3af" fontSize="8">Ocean</text>
                <text x="260" y="95" fill="#9ca3af" fontSize="8">Upstream</text>
                <text x="90" y="15" fill="#14b8a6" fontSize="7">Funneling amplifies</text>
              </svg>

              <div className="space-y-2 text-xs mt-3">
                <div className="flex gap-2">
                  <span className="text-teal-400 shrink-0">1.</span>
                  <div>
                    <span className="text-white">Funneling:</span>
                    <span className="text-slate-400"> Narrowing channels concentrate tidal energy, increasing range</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400 shrink-0">2.</span>
                  <div>
                    <span className="text-white">Shoaling:</span>
                    <span className="text-slate-400"> Shallow water slows the wave and increases height</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400 shrink-0">3.</span>
                  <div>
                    <span className="text-white">Friction:</span>
                    <span className="text-slate-400"> Channel bed and banks dampen the wave with distance</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-teal-400 shrink-0">4.</span>
                  <div>
                    <span className="text-white">Reflection:</span>
                    <span className="text-slate-400"> Waves bounce off barriers, creating standing wave patterns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'asymmetry' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-amber-400 font-medium text-sm mb-2">Flood vs Ebb Dominance</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                In many estuaries, the rising (flood) and falling (ebb) tides are not symmetrical.
                This <span className="text-amber-300">tidal asymmetry</span> has important consequences.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <h5 className="text-green-400 text-xs font-medium mb-2">Flood-Dominant</h5>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Rising tide is shorter and faster than falling tide. Sediment moves upstream,
                  building up shoals and mudflats.
                </p>
                <div className="mt-2 text-center">
                  <span className="text-green-400 text-lg">↑↑ fast</span>
                  <span className="text-slate-500 mx-2">vs</span>
                  <span className="text-red-400 text-sm">↓ slow</span>
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <h5 className="text-red-400 text-xs font-medium mb-2">Ebb-Dominant</h5>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Falling tide is shorter and faster. Sediment flushes seaward, keeping
                  channels deep and clear.
                </p>
                <div className="mt-2 text-center">
                  <span className="text-green-400 text-sm">↑ slow</span>
                  <span className="text-slate-500 mx-2">vs</span>
                  <span className="text-red-400 text-lg">↓↓ fast</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h5 className="text-cyan-400 text-xs font-medium mb-2">Why It Matters</h5>
              <div className="space-y-1 text-xs text-slate-400">
                <p>• Navigation: Timing entry/exit for favorable currents</p>
                <p>• Dredging: Understanding sediment transport patterns</p>
                <p>• Ecology: Larvae and fish use asymmetry for transport</p>
                <p>• Pollution: Affects how contaminants disperse</p>
              </div>
            </div>
          </div>
        )}

        {selectedTopic === 'bore' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-pink-400 font-medium text-sm mb-2">Tidal Bores</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                A tidal bore is a wall of water that travels upstream against the river current
                when conditions are just right. It forms when a large tidal range enters a
                shallow, funnel-shaped estuary.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <h5 className="text-pink-400 text-xs font-medium mb-2">Conditions for Bore Formation</h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span>
                  <span className="text-slate-300">Large tidal range (typically &gt;6m)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span>
                  <span className="text-slate-300">Funnel-shaped estuary narrowing upstream</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span>
                  <span className="text-slate-300">Shallow, gently-sloping riverbed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">✓</span>
                  <span className="text-slate-300">Moderate river discharge (not too high or low)</span>
                </div>
              </div>
            </div>

            {/* Visual representation */}
            <svg viewBox="0 0 300 80" className="w-full bg-slate-900 rounded-lg p-2">
              {/* Riverbed */}
              <line x1="0" y1="60" x2="300" y2="55" stroke="#4a5568" strokeWidth="2" />

              {/* River water before bore */}
              <rect x="150" y="45" width="150" height="12" fill="#1e3a5f" />

              {/* Bore wave */}
              <path
                d="M150 45 Q140 35 130 45 L130 57 L150 57 Z"
                fill="#ec4899"
                opacity="0.6"
              />
              <path
                d="M130 45 Q120 30 110 45 L110 57 L130 57 Z"
                fill="#ec4899"
                opacity="0.8"
              />

              {/* Arrow showing direction */}
              <path d="M180 35 L140 35" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="160" y="30" fill="#ec4899" fontSize="8">Bore direction</text>

              {/* Labels */}
              <text x="220" y="40" fill="#9ca3af" fontSize="8">River level</text>
              <text x="50" y="40" fill="#ec4899" fontSize="8">Rising water</text>
            </svg>
          </div>
        )}

        {selectedTopic === 'mixing' && (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <h4 className="text-purple-400 font-medium text-sm mb-2">Salt Wedge Dynamics</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                Saltwater is denser than freshwater. In estuaries, this creates a
                <span className="text-purple-300"> salt wedge</span>—a layer of saltwater that
                penetrates along the bottom while fresher water flows seaward on top.
              </p>
            </div>

            {/* Visualization */}
            <svg viewBox="0 0 300 100" className="w-full bg-slate-900 rounded-lg p-2">
              {/* Estuary outline */}
              <path d="M0 20 L300 20" stroke="#4a5568" strokeWidth="1" />
              <path d="M0 80 L300 80" stroke="#4a5568" strokeWidth="1" />

              {/* Salt wedge */}
              <path
                d="M0 80 L0 60 Q100 55 200 65 Q250 70 300 80 L0 80"
                fill="#6366f1"
                opacity="0.4"
              />

              {/* Fresh water layer */}
              <path
                d="M0 20 L300 20 L300 65 Q250 55 200 50 Q100 40 0 45 Z"
                fill="#22d3ee"
                opacity="0.3"
              />

              {/* Halocline */}
              <path
                d="M0 50 Q100 45 200 55 Q250 60 300 70"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="5,3"
                fill="none"
              />

              {/* Labels */}
              <text x="150" y="35" fill="#22d3ee" fontSize="9" textAnchor="middle">Fresh (river water)</text>
              <text x="150" y="75" fill="#6366f1" fontSize="9" textAnchor="middle">Salt (seawater)</text>
              <text x="50" y="90" fill="#9ca3af" fontSize="7">Ocean</text>
              <text x="260" y="90" fill="#9ca3af" fontSize="7">Upstream</text>
            </svg>

            <div className="bg-slate-800 rounded-lg p-3">
              <h5 className="text-purple-400 text-xs font-medium mb-2">Tidal Influence on Mixing</h5>
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <span className="text-amber-400">Flood tide:</span> Salt wedge advances upstream,
                  intruding further into the estuary
                </p>
                <p>
                  <span className="text-cyan-400">Ebb tide:</span> Salt wedge retreats seaward,
                  freshwater dominates
                </p>
                <p>
                  <span className="text-pink-400">Spring tides:</span> Stronger currents enhance
                  vertical mixing, breaking down stratification
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Famous estuaries */}
      <div className="bg-slate-800 rounded-lg p-3">
        <h4 className="text-white font-medium text-sm mb-3">Famous Tidal Estuaries</h4>
        <div className="flex flex-wrap gap-1 mb-3">
          {FAMOUS_ESTUARIES.map((est) => (
            <button
              key={est.id}
              onClick={() => setSelectedEstuary(selectedEstuary?.id === est.id ? null : est)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedEstuary?.id === est.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {est.name}
            </button>
          ))}
        </div>

        {selectedEstuary && (
          <div className="bg-slate-900 rounded-lg p-3 border-l-4 border-teal-500">
            <h5 className="text-white font-medium">{selectedEstuary.name}</h5>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div>
                <span className="text-slate-500">River:</span>
                <span className="text-slate-300 ml-1">{selectedEstuary.river}</span>
              </div>
              <div>
                <span className="text-slate-500">Country:</span>
                <span className="text-slate-300 ml-1">{selectedEstuary.country}</span>
              </div>
              <div>
                <span className="text-slate-500">Length:</span>
                <span className="text-teal-400 ml-1">{selectedEstuary.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Tidal Range:</span>
                <span className="text-teal-400 ml-1">{selectedEstuary.tidalRange}</span>
              </div>
            </div>
            <p className="text-amber-300 text-xs mt-2">{selectedEstuary.feature}</p>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">{selectedEstuary.description}</p>
          </div>
        )}
      </div>

      {/* Fun fact */}
      <div className="mt-4 bg-gradient-to-r from-teal-900/30 to-cyan-900/30 rounded-lg p-3 border border-teal-800/30">
        <p className="text-teal-200 text-xs leading-relaxed">
          <span className="font-semibold">🌊 Did you know?</span> The world's longest tidal river
          is the Amazon—tides can be detected over 1,000 km from the ocean! The interaction
          between the massive river discharge and the Atlantic tides creates complex, ever-changing
          dynamics.
        </p>
      </div>
    </div>
  );
}
