import { useState } from 'react';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'basics' | 'constituents' | 'cycles' | 'measurement' | 'phenomena';
  related?: string[];
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Basics
  {
    term: 'Tide',
    definition: 'The periodic rise and fall of sea level caused by gravitational forces of the Moon and Sun acting on Earth\'s oceans.',
    category: 'basics',
    related: ['Tidal Range', 'High Tide', 'Low Tide'],
  },
  {
    term: 'High Tide',
    definition: 'The maximum water level reached during a tidal cycle. Also called "high water."',
    category: 'basics',
    related: ['Low Tide', 'Tidal Range'],
  },
  {
    term: 'Low Tide',
    definition: 'The minimum water level reached during a tidal cycle. Also called "low water."',
    category: 'basics',
    related: ['High Tide', 'Tidal Range'],
  },
  {
    term: 'Tidal Range',
    definition: 'The vertical difference between high tide and low tide at a location.',
    category: 'basics',
    related: ['Spring Tide', 'Neap Tide'],
  },
  {
    term: 'Tidal Bulge',
    definition: 'The elongation of Earth\'s oceans toward (and away from) the Moon/Sun due to differential gravitational force. Creates two "bulges" on opposite sides of Earth.',
    category: 'basics',
    related: ['Tide'],
  },

  // Tidal Types
  {
    term: 'Semidiurnal Tide',
    definition: 'A tidal pattern with two high tides and two low tides of roughly equal height each day. Period ≈ 12.42 hours. Common in Atlantic.',
    category: 'basics',
    related: ['Diurnal Tide', 'Mixed Tide'],
  },
  {
    term: 'Diurnal Tide',
    definition: 'A tidal pattern with only one high tide and one low tide per day. Period ≈ 24.84 hours. Relatively rare globally.',
    category: 'basics',
    related: ['Semidiurnal Tide', 'Mixed Tide'],
  },
  {
    term: 'Mixed Tide',
    definition: 'A tidal pattern showing both semidiurnal and diurnal characteristics, with significant inequality between successive highs or lows.',
    category: 'basics',
    related: ['Diurnal Inequality', 'Semidiurnal Tide'],
  },
  {
    term: 'Diurnal Inequality',
    definition: 'The difference in height between two successive high tides or two successive low tides. Caused by lunar/solar declination.',
    category: 'basics',
    related: ['Mixed Tide', 'K1', 'O1'],
  },

  // Cycles
  {
    term: 'Spring Tide',
    definition: 'Tides with maximum range, occurring when Sun and Moon are aligned (new or full Moon). "Spring" refers to the tide "springing forth," not the season.',
    category: 'cycles',
    related: ['Neap Tide', 'Syzygy'],
  },
  {
    term: 'Neap Tide',
    definition: 'Tides with minimum range, occurring when Sun and Moon are at right angles (first or third quarter Moon).',
    category: 'cycles',
    related: ['Spring Tide', 'Quadrature'],
  },
  {
    term: 'King Tide',
    definition: 'Informal term for exceptionally high tides occurring when spring tide coincides with lunar perigee. Also called "perigean spring tide."',
    category: 'cycles',
    related: ['Spring Tide', 'Perigee'],
  },
  {
    term: 'Syzygy',
    definition: 'Alignment of Sun, Moon, and Earth (new or full Moon). Produces spring tides.',
    category: 'cycles',
    related: ['Spring Tide', 'Quadrature'],
  },
  {
    term: 'Quadrature',
    definition: 'Configuration when Moon is at 90° from the Sun-Earth line (quarter Moons). Produces neap tides.',
    category: 'cycles',
    related: ['Neap Tide', 'Syzygy'],
  },
  {
    term: 'Perigee',
    definition: 'Point in the Moon\'s orbit closest to Earth (≈356,000 km). Increases tidal forces by ~20%.',
    category: 'cycles',
    related: ['Apogee', 'King Tide'],
  },
  {
    term: 'Apogee',
    definition: 'Point in the Moon\'s orbit farthest from Earth (≈407,000 km). Weakens tidal forces.',
    category: 'cycles',
    related: ['Perigee'],
  },
  {
    term: 'Nodal Cycle',
    definition: 'The 18.61-year cycle of the lunar orbital plane\'s precession. Modulates tidal amplitudes by ±5%.',
    category: 'cycles',
    related: ['Nodal Factor'],
  },

  // Constituents
  {
    term: 'Tidal Constituent',
    definition: 'A single sinusoidal component of the tide, corresponding to a specific astronomical period. Combined together, they predict the actual tide.',
    category: 'constituents',
    related: ['M2', 'S2', 'Harmonic Analysis'],
  },
  {
    term: 'M2',
    definition: 'Principal lunar semidiurnal constituent. Period 12.42 hours. Typically the largest component (60-70% of total tide).',
    category: 'constituents',
    related: ['S2', 'Semidiurnal Tide'],
  },
  {
    term: 'S2',
    definition: 'Principal solar semidiurnal constituent. Period exactly 12 hours. About 46% of M2\'s strength.',
    category: 'constituents',
    related: ['M2', 'Spring Tide'],
  },
  {
    term: 'K1',
    definition: 'Lunisolar diurnal constituent. Largest diurnal component, caused by Moon/Sun declination.',
    category: 'constituents',
    related: ['O1', 'Diurnal Inequality'],
  },
  {
    term: 'O1',
    definition: 'Principal lunar diurnal constituent. Captures Moon\'s changing declination effect.',
    category: 'constituents',
    related: ['K1', 'Diurnal Tide'],
  },
  {
    term: 'Doodson Number',
    definition: 'Six-integer code identifying a tidal constituent by its relationship to astronomical cycles. Format: [T, s, h, p, N\', p\'].',
    category: 'constituents',
    related: ['Tidal Constituent'],
  },
  {
    term: 'Amplitude',
    definition: 'The height of a tidal constituent\'s contribution, measured from mean level to peak.',
    category: 'constituents',
    related: ['Phase'],
  },
  {
    term: 'Phase',
    definition: 'The timing offset of a tidal constituent, expressed as Greenwich epoch phase lag in degrees.',
    category: 'constituents',
    related: ['Amplitude'],
  },

  // Measurement
  {
    term: 'Datum',
    definition: 'Reference level for measuring tide heights. Common datums: MLLW (Mean Lower Low Water), MSL (Mean Sea Level).',
    category: 'measurement',
    related: ['MLLW', 'Chart Datum'],
  },
  {
    term: 'MLLW',
    definition: 'Mean Lower Low Water - average of the lower low tides over a 19-year period. Common reference for US tide predictions.',
    category: 'measurement',
    related: ['Datum', 'MHHW'],
  },
  {
    term: 'MHHW',
    definition: 'Mean Higher High Water - average of the higher high tides over a 19-year period.',
    category: 'measurement',
    related: ['MLLW', 'Datum'],
  },
  {
    term: 'Harmonic Analysis',
    definition: 'Mathematical technique of decomposing observed tides into constituent sinusoids. Enables long-term tide prediction.',
    category: 'measurement',
    related: ['Tidal Constituent', 'Harmonic Constants'],
  },
  {
    term: 'Harmonic Constants',
    definition: 'The amplitude and phase of each constituent at a specific location, derived from tide gauge observations.',
    category: 'measurement',
    related: ['Harmonic Analysis', 'Tidal Constituent'],
  },
  {
    term: 'Form Number',
    definition: 'Ratio (K1+O1)/(M2+S2) used to classify tidal type. <0.25=semidiurnal, 0.25-1.5=mixed-semi, 1.5-3=mixed-di, >3=diurnal.',
    category: 'measurement',
    related: ['Semidiurnal Tide', 'Diurnal Tide'],
  },
  {
    term: 'Nodal Factor',
    definition: 'Correction factor applied to constituent amplitudes to account for the 18.6-year nodal cycle.',
    category: 'measurement',
    related: ['Nodal Cycle'],
  },

  // Phenomena
  {
    term: 'Amphidromic Point',
    definition: 'Location where tidal range is nearly zero, around which tidal waves rotate. Caused by Earth\'s rotation.',
    category: 'phenomena',
  },
  {
    term: 'Tidal Bore',
    definition: 'A wave that forms when an incoming tide funnels into a shallow, narrowing river. Notable examples: Severn Bore, Qiantang River.',
    category: 'phenomena',
    related: ['Shallow Water Constituents'],
  },
  {
    term: 'Storm Surge',
    definition: 'Abnormal rise in sea level during storms, caused by wind and low pressure. Not predicted by harmonic analysis.',
    category: 'phenomena',
  },
  {
    term: 'Overtide',
    definition: 'Higher harmonics (M4, M6, etc.) generated when tides become distorted in shallow water.',
    category: 'phenomena',
    related: ['Shallow Water Constituents', 'M4'],
  },
  {
    term: 'Shallow Water Constituents',
    definition: 'Tidal constituents created by nonlinear effects in shallow coastal waters. Examples: M4, MS4, M6.',
    category: 'phenomena',
    related: ['Overtide', 'M4'],
  },
];

const CATEGORY_LABELS = {
  basics: 'Basic Concepts',
  constituents: 'Constituents & Analysis',
  cycles: 'Astronomical Cycles',
  measurement: 'Measurement & Prediction',
  phenomena: 'Special Phenomena',
};

const CATEGORY_COLORS = {
  basics: 'bg-blue-500/20 text-blue-400',
  constituents: 'bg-green-500/20 text-green-400',
  cycles: 'bg-purple-500/20 text-purple-400',
  measurement: 'bg-cyan-500/20 text-cyan-400',
  phenomena: 'bg-amber-500/20 text-amber-400',
};

interface TidalGlossaryProps {
  onClose: () => void;
}

export function TidalGlossary({ onClose }: TidalGlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filteredTerms = GLOSSARY_TERMS.filter((term) => {
    const matchesSearch =
      searchQuery === '' ||
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedTerms = filteredTerms.reduce<Record<string, GlossaryTerm[]>>(
    (acc, term) => {
      const existing = acc[term.category];
      if (existing) {
        existing.push(term);
      } else {
        acc[term.category] = [term];
      }
      return acc;
    },
    {}
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Tidal Glossary</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms..."
            className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-600 focus:border-blue-500 outline-none text-sm mb-3"
          />

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
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === key
                    ? CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(groupedTerms).map(([category, terms]) => (
            <div key={category} className="mb-6">
              <h3 className={`text-sm font-medium mb-2 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]?.split(' ')[1] || 'text-slate-400'}`}>
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </h3>
              <div className="space-y-2">
                {terms.map((term) => (
                  <div
                    key={term.term}
                    className="border border-slate-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-white font-medium">{term.term}</span>
                      <span className="text-slate-500 text-sm">
                        {expandedTerm === term.term ? '−' : '+'}
                      </span>
                    </button>
                    {expandedTerm === term.term && (
                      <div className="px-3 py-2 bg-slate-800/30 border-t border-slate-700">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {term.definition}
                        </p>
                        {term.related && term.related.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-slate-500 text-xs">Related:</span>
                            {term.related.map((rel) => (
                              <button
                                key={rel}
                                onClick={() => {
                                  setSearchQuery(rel);
                                  setExpandedTerm(rel);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                {rel}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredTerms.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              No terms found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 text-center text-xs text-slate-500">
          {GLOSSARY_TERMS.length} terms in glossary
        </div>
      </div>
    </div>
  );
}
