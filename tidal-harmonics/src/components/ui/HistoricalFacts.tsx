import { useState, useMemo } from 'react';

interface HistoricalFact {
  id: number;
  year?: string;
  title: string;
  content: string;
  category: 'discovery' | 'technology' | 'disaster' | 'culture' | 'science';
}

const HISTORICAL_FACTS: HistoricalFact[] = [
  {
    id: 1,
    year: '~150 AD',
    title: 'Ptolemy Discovers Evection',
    content: 'The Greek astronomer Ptolemy identified the lunar evection - a periodic variation in the Moon\'s orbit caused by the Sun\'s gravity. This affects tides with a ~32-day cycle and is captured by the NU2 constituent.',
    category: 'discovery',
  },
  {
    id: 2,
    year: '1687',
    title: 'Newton Explains Tides',
    content: 'Isaac Newton published Principia Mathematica, providing the first scientific explanation of tides using his law of gravitation. He correctly identified the Moon and Sun as the causes, but his equilibrium theory predicted tides too small.',
    category: 'science',
  },
  {
    id: 3,
    year: '1775',
    title: 'Laplace\'s Dynamic Theory',
    content: 'Pierre-Simon Laplace developed the dynamic theory of tides, recognizing that ocean basins respond to tidal forces like resonant systems. This explained why actual tides differ so much from Newton\'s predictions.',
    category: 'science',
  },
  {
    id: 4,
    year: '1867',
    title: 'Kelvin\'s Tide Predictor',
    content: 'Lord Kelvin (William Thomson) built the first mechanical tide-predicting machine, combining rotating gears to sum up to 10 harmonic constituents. Later versions used up to 40 constituents and remained in use until the 1960s.',
    category: 'technology',
  },
  {
    id: 5,
    year: '1921',
    title: 'Doodson\'s Complete Analysis',
    content: 'Arthur Doodson published his complete harmonic development of the tide-generating potential, identifying 388 tidal constituents. His numbering system (Doodson numbers) is still used today.',
    category: 'science',
  },
  {
    id: 6,
    title: 'Bay of Fundy\'s Extreme Tides',
    content: 'The Bay of Fundy between Nova Scotia and New Brunswick has the world\'s highest tides - up to 16 meters (53 feet) range. The bay\'s funnel shape and natural resonance period (close to 12 hours) amplify the semidiurnal tide.',
    category: 'science',
  },
  {
    id: 7,
    year: '1953',
    title: 'North Sea Flood',
    content: 'A catastrophic storm surge combined with spring tides killed over 2,500 people in the Netherlands, UK, and Belgium. This disaster led to the construction of the Thames Barrier and Delta Works.',
    category: 'disaster',
  },
  {
    id: 8,
    title: 'Tidal Power Generation',
    content: 'The tidal power plant at La Rance, France (built 1966) was the world\'s first large-scale tidal power station. It generates 240 MW using the 8-meter tidal range of the Rance estuary.',
    category: 'technology',
  },
  {
    id: 9,
    title: 'Moon Slowing Earth',
    content: 'Tidal friction is gradually slowing Earth\'s rotation. Days are getting longer by about 2.3 milliseconds per century. The Moon is also moving away at 3.8 cm per year as a result.',
    category: 'science',
  },
  {
    id: 10,
    title: 'Ancient Tidal Mills',
    content: 'Tidal mills were used in Roman Britain and medieval Europe. They used incoming tides to fill a millpond, then released the water through a waterwheel at low tide. Some operated for over 800 years.',
    category: 'culture',
  },
  {
    id: 11,
    year: '55 BC',
    title: 'Julius Caesar\'s Surprise',
    content: 'Julius Caesar\'s invasion fleet was badly damaged by tides at Deal, Kent. Mediterranean Romans were unfamiliar with the large tidal range of the English Channel.',
    category: 'disaster',
  },
  {
    id: 12,
    title: 'Galileo\'s Error',
    content: 'Galileo believed tides were caused by Earth\'s rotation and orbit, not the Moon. He dismissed the lunar connection as "occult" astrology, one of his few scientific errors.',
    category: 'science',
  },
  {
    id: 13,
    title: 'D-Day Tide Planning',
    content: 'The June 6, 1944 D-Day invasion date was chosen partly for favorable tides. Planners needed low tide at dawn to expose beach obstacles, followed by a rising tide to bring landing craft closer to shore.',
    category: 'disaster',
  },
  {
    id: 14,
    title: 'Qiantang River Bore',
    content: 'China\'s Qiantang River has one of the world\'s most spectacular tidal bores, with waves up to 9 meters high traveling at 40 km/h. It\'s been observed and celebrated for over 2,000 years.',
    category: 'culture',
  },
  {
    id: 15,
    title: 'Tides on Other Worlds',
    content: 'Jupiter\'s moon Io experiences tidal heating so intense it drives volcanic eruptions. Europa\'s subsurface ocean is kept liquid by tidal flexing. Tidal forces shaped our solar system.',
    category: 'science',
  },
  {
    id: 16,
    year: '1831',
    title: 'Whewell Coins "Scientist"',
    content: 'William Whewell, who created the first global co-tidal charts, also coined the word "scientist" in 1833. His tidal work revealed how waves propagate across ocean basins.',
    category: 'discovery',
  },
  {
    id: 17,
    title: 'The 18.6-Year Cycle',
    content: 'The lunar nodal cycle of 18.61 years causes tidal ranges to vary by about ±5%. Coastal construction and flood planning must account for this long-period variation.',
    category: 'science',
  },
  {
    id: 18,
    title: 'Mont Saint-Michel',
    content: 'The island monastery of Mont Saint-Michel, France, experiences tidal ranges up to 14 meters. The saying goes: "The tide comes in as fast as a galloping horse."',
    category: 'culture',
  },
  {
    id: 19,
    year: '1966',
    title: 'Satellite Altimetry Begins',
    content: 'Modern satellite altimetry, starting with early missions in the 1970s and advancing with TOPEX/Poseidon (1992), revolutionized our understanding of ocean tides by measuring sea surface height globally.',
    category: 'technology',
  },
  {
    id: 20,
    title: 'Amphidromic Points',
    content: 'Tides rotate around "amphidromic points" where tidal range is nearly zero. The North Sea has three such points. First mapped by Whewell in the 1830s.',
    category: 'discovery',
  },
];

const CATEGORY_LABELS = {
  discovery: 'Discoveries',
  technology: 'Technology',
  disaster: 'Historical Events',
  culture: 'Culture',
  science: 'Science',
};

const CATEGORY_COLORS = {
  discovery: 'bg-purple-500/20 text-purple-400',
  technology: 'bg-blue-500/20 text-blue-400',
  disaster: 'bg-red-500/20 text-red-400',
  culture: 'bg-amber-500/20 text-amber-400',
  science: 'bg-green-500/20 text-green-400',
};

const CATEGORY_ICONS = {
  discovery: '🔭',
  technology: '⚙️',
  disaster: '📜',
  culture: '🏛️',
  science: '🔬',
};

interface HistoricalFactsProps {
  onClose: () => void;
}

export function HistoricalFacts({ onClose }: HistoricalFactsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFacts = useMemo(() => {
    if (!selectedCategory) return HISTORICAL_FACTS;
    return HISTORICAL_FACTS.filter((fact) => fact.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Tidal History & Facts</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedCategory === null
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              All ({HISTORICAL_FACTS.length})
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const count = HISTORICAL_FACTS.filter((f) => f.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                    selectedCategory === key
                      ? CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <span>{CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]}</span>
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className={`p-4 rounded-lg border ${
                CATEGORY_COLORS[fact.category]
              } border-opacity-30`}
              style={{
                borderColor:
                  fact.category === 'discovery'
                    ? 'rgb(168 85 247 / 0.3)'
                    : fact.category === 'technology'
                    ? 'rgb(59 130 246 / 0.3)'
                    : fact.category === 'disaster'
                    ? 'rgb(239 68 68 / 0.3)'
                    : fact.category === 'culture'
                    ? 'rgb(245 158 11 / 0.3)'
                    : 'rgb(34 197 94 / 0.3)',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {CATEGORY_ICONS[fact.category]}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {fact.year && (
                      <span className="text-xs text-slate-500 font-mono">{fact.year}</span>
                    )}
                    <h3 className="text-white font-medium">{fact.title}</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{fact.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 text-center text-xs text-slate-500">
          {filteredFacts.length} historical facts
        </div>
      </div>
    </div>
  );
}

/**
 * Random fact display for embedding elsewhere
 */
export function RandomFact() {
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * HISTORICAL_FACTS.length)
  );

  const fact = HISTORICAL_FACTS[factIndex];

  const showNext = () => {
    setFactIndex((prev) => (prev + 1) % HISTORICAL_FACTS.length);
  };

  if (!fact) return null;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Did You Know?</span>
        <button
          onClick={showNext}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Next →
        </button>
      </div>
      <div className="flex gap-2">
        <span>{CATEGORY_ICONS[fact.category]}</span>
        <div>
          <h4 className="text-white text-sm font-medium">{fact.title}</h4>
          <p className="text-slate-400 text-xs mt-1 line-clamp-2">{fact.content}</p>
        </div>
      </div>
    </div>
  );
}
