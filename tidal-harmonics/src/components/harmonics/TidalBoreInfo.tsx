import { useState } from 'react';

interface TidalBore {
  name: string;
  location: string;
  river: string;
  country: string;
  maxHeight: string;
  maxSpeed: string;
  tidalRange: string;
  bestTime: string;
  description: string;
}

const FAMOUS_BORES: TidalBore[] = [
  {
    name: 'Qiantang River Bore',
    location: 'Hangzhou Bay',
    river: 'Qiantang River',
    country: 'China',
    maxHeight: '9 m (30 ft)',
    maxSpeed: '40 km/h (25 mph)',
    tidalRange: '8.9 m',
    bestTime: 'Mid-Autumn Festival (September/October)',
    description: 'The largest tidal bore in the world, known as the "Silver Dragon." The funnel shape of Hangzhou Bay amplifies the incoming tide dramatically. The bore has been observed for over 2,000 years and attracts millions of spectators annually.',
  },
  {
    name: 'Severn Bore',
    location: 'Bristol Channel',
    river: 'River Severn',
    country: 'United Kingdom',
    maxHeight: '2 m (6.5 ft)',
    maxSpeed: '21 km/h (13 mph)',
    tidalRange: '15 m',
    bestTime: 'Spring tides in March and September',
    description: 'One of the most famous bores in the world, occurring about 130 days per year. The Bristol Channel has the second-highest tidal range globally. Popular with surfers who can ride the wave for miles upstream.',
  },
  {
    name: 'Pororoca',
    location: 'Amazon Delta',
    river: 'Amazon River',
    country: 'Brazil',
    maxHeight: '4 m (13 ft)',
    maxSpeed: '30 km/h (19 mph)',
    tidalRange: '6 m',
    bestTime: 'February to March (spring equinox)',
    description: 'The name means "great roar" in the indigenous Tupi language. The bore can be heard 30 minutes before arrival. Surfing championships have been held on the Pororoca, with riders covering up to 12 km.',
  },
  {
    name: 'Mascaret',
    location: 'Gironde Estuary',
    river: 'Dordogne/Garonne Rivers',
    country: 'France',
    maxHeight: '1.5 m (5 ft)',
    maxSpeed: '30 km/h (19 mph)',
    tidalRange: '6 m',
    bestTime: 'Spring and autumn equinoxes',
    description: 'The French mascaret gave the generic name to tidal bores in many languages. Once more powerful before river modifications, it\'s now a popular surfing destination near Bordeaux.',
  },
  {
    name: 'Benak',
    location: 'Batang Lupar',
    river: 'Batang Lupar River',
    country: 'Malaysia (Sarawak)',
    maxHeight: '3 m (10 ft)',
    maxSpeed: '25 km/h (15 mph)',
    tidalRange: '5 m',
    bestTime: 'New and full moon periods',
    description: 'Known locally as "Benak," this bore is considered sacred by the indigenous Iban people. The river\'s shape and shallow depth create ideal conditions for bore formation.',
  },
  {
    name: 'Bay of Fundy Bore',
    location: 'Petitcodiac/Salmon Rivers',
    river: 'Multiple rivers',
    country: 'Canada',
    maxHeight: '2 m (6.5 ft)',
    maxSpeed: '15 km/h (9 mph)',
    tidalRange: '16 m (highest in world)',
    bestTime: 'Large spring tides',
    description: 'While the Bay of Fundy has the world\'s highest tides (16+ meters), the bores in its rivers are relatively modest. The extreme tidal range creates strong currents and rapid water level changes.',
  },
];

export function TidalBoreInfo({ onClose }: { onClose: () => void }) {
  const [selectedBore, setSelectedBore] = useState<TidalBore | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌊</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Tidal Bores</h2>
              <p className="text-sm text-slate-400">
                Where rivers meet the sea
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
          {/* Explanation */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">What is a Tidal Bore?</h3>
            <p className="text-sm text-slate-300 mb-3">
              A tidal bore is a surge of water that travels up a river or narrow bay against the direction
              of the current when the incoming tide is strong. It forms when the tide enters a funnel-shaped
              estuary or river with a large tidal range, creating a wave that can travel many kilometers upstream.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded p-2">
                <span className="text-slate-400">Required conditions:</span>
                <ul className="text-slate-300 mt-1 list-disc list-inside">
                  <li>Large tidal range (usually {'>'} 6m)</li>
                  <li>Funnel-shaped estuary</li>
                  <li>Shallow, gently sloping riverbed</li>
                  <li>Relatively narrow river</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded p-2">
                <span className="text-slate-400">Best viewing:</span>
                <ul className="text-slate-300 mt-1 list-disc list-inside">
                  <li>Spring tides (new/full moon)</li>
                  <li>Equinoxes (March, September)</li>
                  <li>1-2 hours after low tide</li>
                  <li>When river flow is lower</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Famous bores list */}
          <div>
            <h3 className="text-white font-medium mb-3">Famous Tidal Bores Worldwide</h3>
            <div className="space-y-2">
              {FAMOUS_BORES.map((bore) => (
                <button
                  key={bore.name}
                  onClick={() => setSelectedBore(selectedBore?.name === bore.name ? null : bore)}
                  className={`w-full text-left rounded-lg p-3 transition-colors ${
                    selectedBore?.name === bore.name
                      ? 'bg-blue-600/30 border border-blue-500'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">{bore.name}</span>
                      <span className="text-slate-400 text-sm ml-2">({bore.country})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-cyan-400">↕ {bore.maxHeight}</span>
                      <span className="text-amber-400">→ {bore.maxSpeed}</span>
                      <span className={`transition-transform ${selectedBore?.name === bore.name ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>

                  {selectedBore?.name === bore.name && (
                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
                      <p className="text-sm text-slate-300">{bore.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">River:</span>
                          <span className="text-slate-300 ml-1">{bore.river}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Location:</span>
                          <span className="text-slate-300 ml-1">{bore.location}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Tidal Range:</span>
                          <span className="text-slate-300 ml-1">{bore.tidalRange}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Best Time:</span>
                          <span className="text-slate-300 ml-1">{bore.bestTime}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Science note */}
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-400">💡</span>
              <div className="text-sm">
                <p className="text-amber-200 font-medium">The Physics of Bore Formation</p>
                <p className="text-slate-300 mt-1">
                  When the speed of the incoming tide exceeds the speed of shallow water waves
                  (determined by √(gh) where g is gravity and h is depth), the tide "breaks" into a
                  bore. The funnel shape of estuaries concentrates the tidal energy, amplifying the
                  wave height as it travels upstream.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
