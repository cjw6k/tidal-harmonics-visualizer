import { useState, useMemo } from 'react';

interface TidalGlossaryProps {
  onClose: () => void;
}

interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
  related?: string[];
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // Tidal Types
  {
    term: 'Semidiurnal Tide',
    definition: 'A tide with two high waters and two low waters each tidal day (approximately 24h 50m), with roughly equal heights.',
    category: 'Tidal Types',
    related: ['Diurnal Tide', 'Mixed Tide'],
  },
  {
    term: 'Diurnal Tide',
    definition: 'A tide with only one high water and one low water each tidal day.',
    category: 'Tidal Types',
    related: ['Semidiurnal Tide', 'Mixed Tide'],
  },
  {
    term: 'Mixed Tide',
    definition: 'A tide with two high waters and two low waters of markedly different heights each tidal day.',
    category: 'Tidal Types',
    related: ['Semidiurnal Tide', 'Diurnal Tide'],
  },
  // Tidal Datums
  {
    term: 'Mean Sea Level (MSL)',
    definition: 'The average level of the sea surface over a 19-year period, used as a reference for elevations.',
    category: 'Datums',
    related: ['MLLW', 'MHHW'],
  },
  {
    term: 'Mean Lower Low Water (MLLW)',
    definition: 'The average of the lower of the two low waters each tidal day over a 19-year period. Standard datum for US nautical charts.',
    category: 'Datums',
    related: ['MSL', 'MHHW', 'Chart Datum'],
  },
  {
    term: 'Mean Higher High Water (MHHW)',
    definition: 'The average of the higher of the two high waters each tidal day over a 19-year period.',
    category: 'Datums',
    related: ['MSL', 'MLLW'],
  },
  {
    term: 'Chart Datum (CD)',
    definition: 'The level below which depths are shown on nautical charts. Usually LAT (Lowest Astronomical Tide) or MLLW.',
    category: 'Datums',
    related: ['MLLW', 'LAT'],
  },
  {
    term: 'Lowest Astronomical Tide (LAT)',
    definition: 'The lowest tide level which can be predicted to occur under average meteorological conditions.',
    category: 'Datums',
    related: ['Chart Datum', 'HAT'],
  },
  {
    term: 'Highest Astronomical Tide (HAT)',
    definition: 'The highest tide level which can be predicted to occur under average meteorological conditions.',
    category: 'Datums',
    related: ['LAT'],
  },
  // Tidal Cycles
  {
    term: 'Spring Tide',
    definition: 'Tides of increased range occurring twice per lunar month, when the Sun and Moon are aligned (new and full moon).',
    category: 'Tidal Cycles',
    related: ['Neap Tide', 'Perigean Spring Tide'],
  },
  {
    term: 'Neap Tide',
    definition: 'Tides of decreased range occurring twice per lunar month, when the Sun and Moon are at right angles (first and third quarter).',
    category: 'Tidal Cycles',
    related: ['Spring Tide'],
  },
  {
    term: 'Perigean Spring Tide',
    definition: 'Exceptionally high spring tides that occur when the Moon is at perigee (closest to Earth) during a spring tide.',
    category: 'Tidal Cycles',
    related: ['Spring Tide', 'King Tide', 'Perigee'],
  },
  {
    term: 'King Tide',
    definition: 'Colloquial term for exceptionally high tides, typically during perigean spring tides.',
    category: 'Tidal Cycles',
    related: ['Perigean Spring Tide', 'Spring Tide'],
  },
  {
    term: 'Nodal Cycle',
    definition: 'An 18.61-year cycle in tidal amplitudes caused by the regression of the lunar nodes.',
    category: 'Tidal Cycles',
    related: ['Lunar Node'],
  },
  // Astronomical Terms
  {
    term: 'Perigee',
    definition: 'The point in the Moon\'s orbit when it is closest to Earth, causing stronger tidal forces.',
    category: 'Astronomical',
    related: ['Apogee', 'Perigean Spring Tide'],
  },
  {
    term: 'Apogee',
    definition: 'The point in the Moon\'s orbit when it is farthest from Earth, causing weaker tidal forces.',
    category: 'Astronomical',
    related: ['Perigee'],
  },
  {
    term: 'Lunar Node',
    definition: 'The points where the Moon\'s orbital plane intersects Earth\'s orbital plane. Their regression causes the nodal cycle.',
    category: 'Astronomical',
    related: ['Nodal Cycle'],
  },
  {
    term: 'Declination',
    definition: 'The angular distance of the Sun or Moon north or south of the celestial equator, affecting tidal patterns.',
    category: 'Astronomical',
    related: ['Diurnal Inequality'],
  },
  // Tidal Constituents
  {
    term: 'Harmonic Constituent',
    definition: 'A sinusoidal component of the tide with a specific period, amplitude, and phase. The sum of all constituents predicts the tide.',
    category: 'Harmonics',
    related: ['M2', 'S2', 'Doodson Number'],
  },
  {
    term: 'M2 (Principal Lunar)',
    definition: 'The dominant semidiurnal lunar constituent with a period of 12.42 hours. Usually the largest component of the tide.',
    category: 'Harmonics',
    related: ['S2', 'Harmonic Constituent'],
  },
  {
    term: 'S2 (Principal Solar)',
    definition: 'The principal semidiurnal solar constituent with a period of exactly 12 hours.',
    category: 'Harmonics',
    related: ['M2', 'Harmonic Constituent'],
  },
  {
    term: 'K1 (Luni-Solar Diurnal)',
    definition: 'A diurnal constituent arising from both solar and lunar effects, with a period of 23.93 hours.',
    category: 'Harmonics',
    related: ['O1', 'Harmonic Constituent'],
  },
  {
    term: 'Doodson Number',
    definition: 'A six-digit notation system identifying tidal constituents by their relationship to astronomical frequencies.',
    category: 'Harmonics',
    related: ['Harmonic Constituent'],
  },
  // Tidal Currents
  {
    term: 'Flood Current',
    definition: 'The tidal current flowing toward shore or up an estuary as the tide rises.',
    category: 'Currents',
    related: ['Ebb Current', 'Slack Water'],
  },
  {
    term: 'Ebb Current',
    definition: 'The tidal current flowing away from shore or down an estuary as the tide falls.',
    category: 'Currents',
    related: ['Flood Current', 'Slack Water'],
  },
  {
    term: 'Slack Water',
    definition: 'The period when tidal current velocity is near zero, typically at high and low tide.',
    category: 'Currents',
    related: ['Flood Current', 'Ebb Current'],
  },
  {
    term: 'Tidal Race',
    definition: 'An area of very strong tidal currents, often with dangerous turbulence.',
    category: 'Currents',
    related: ['Overfalls'],
  },
  {
    term: 'Overfalls',
    definition: 'Breaking or confused seas caused by tidal currents meeting obstacles or opposing winds.',
    category: 'Currents',
    related: ['Tidal Race'],
  },
  // Tidal Phenomena
  {
    term: 'Tidal Range',
    definition: 'The vertical difference between high water and the following low water.',
    category: 'Phenomena',
    related: ['Spring Tide', 'Neap Tide'],
  },
  {
    term: 'Tidal Bore',
    definition: 'A tidal wave that travels up certain rivers as a steep-fronted wave during high spring tides.',
    category: 'Phenomena',
    related: ['Spring Tide', 'Funnel-Shaped Estuary'],
  },
  {
    term: 'Amphidromic Point',
    definition: 'A point in the ocean where tidal range is zero and around which tidal waves rotate.',
    category: 'Phenomena',
    related: ['Cotidal Line'],
  },
  {
    term: 'Cotidal Line',
    definition: 'A line connecting points that experience high water at the same time.',
    category: 'Phenomena',
    related: ['Amphidromic Point'],
  },
  {
    term: 'Storm Surge',
    definition: 'An abnormal rise of water above predicted astronomical tide caused by meteorological conditions.',
    category: 'Phenomena',
    related: ['Meteorological Effects'],
  },
  {
    term: 'Seiche',
    definition: 'A standing wave oscillation in an enclosed or partially enclosed body of water.',
    category: 'Phenomena',
    related: ['Resonance'],
  },
  {
    term: 'Tidal Resonance',
    definition: 'Amplification of tidal range that occurs when the natural period of a basin matches the tidal period.',
    category: 'Phenomena',
    related: ['Seiche', 'Bay of Fundy'],
  },
  // Navigation Terms
  {
    term: 'Under Keel Clearance (UKC)',
    definition: 'The distance between the bottom of a vessel\'s keel and the seabed.',
    category: 'Navigation',
    related: ['Draft', 'Chart Datum'],
  },
  {
    term: 'Air Draft',
    definition: 'The vertical distance from the waterline to the highest point of a vessel.',
    category: 'Navigation',
    related: ['Bridge Clearance'],
  },
  {
    term: 'Drying Height',
    definition: 'The height of a feature that uncovers at low water, measured above chart datum.',
    category: 'Navigation',
    related: ['Chart Datum', 'Intertidal Zone'],
  },
  {
    term: 'Rule of Twelfths',
    definition: 'A traditional method for estimating intermediate tide heights using fractions of 12ths of the range.',
    category: 'Navigation',
    related: ['Tidal Range'],
  },
  {
    term: 'Tidal Coefficient',
    definition: 'A value (typically 20-120) expressing tidal range relative to average range. Used in French and Spanish waters.',
    category: 'Navigation',
    related: ['Spring Tide', 'Neap Tide'],
  },
  // Technical Terms
  {
    term: 'Harmonic Analysis',
    definition: 'The mathematical process of decomposing observed tides into constituent components.',
    category: 'Technical',
    related: ['Harmonic Constituent', 'Fourier Analysis'],
  },
  {
    term: 'Tidal Epoch',
    definition: 'A 19-year period used for averaging tidal observations to calculate datums.',
    category: 'Technical',
    related: ['MSL', 'Nodal Cycle'],
  },
  {
    term: 'Age of Tide',
    definition: 'The time interval between new or full moon and the following maximum spring tide.',
    category: 'Technical',
    related: ['Spring Tide'],
  },
  {
    term: 'Diurnal Inequality',
    definition: 'The difference in height or time between the two high (or low) waters of a tidal day.',
    category: 'Technical',
    related: ['Mixed Tide', 'Declination'],
  },
];

const CATEGORIES = [...new Set(GLOSSARY_ENTRIES.map((e) => e.category))];

export function TidalGlossary({ onClose }: TidalGlossaryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let entries = GLOSSARY_ENTRIES;

    if (selectedCategory) {
      entries = entries.filter((e) => e.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.term.toLowerCase().includes(search) ||
          e.definition.toLowerCase().includes(search)
      );
    }

    return entries.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchTerm, selectedCategory]);

  const handleRelatedClick = (term: string) => {
    setSearchTerm(term);
    setSelectedCategory(null);
    setExpandedTerm(term);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-emerald-400">Tidal Glossary</h3>
            <p className="text-slate-400 text-sm">
              {GLOSSARY_ENTRIES.length} terms and definitions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search terms..."
            className="w-full bg-slate-800 text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-xs text-slate-400 mb-2">
          Showing {filteredEntries.length} of {GLOSSARY_ENTRIES.length} terms
        </div>

        {/* Glossary Entries */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredEntries.map((entry) => (
            <div
              key={entry.term}
              className={`bg-slate-800 rounded-lg p-3 cursor-pointer transition-colors ${
                expandedTerm === entry.term ? 'ring-2 ring-emerald-500' : 'hover:bg-slate-700'
              }`}
              onClick={() => setExpandedTerm(expandedTerm === entry.term ? null : entry.term)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-emerald-400">{entry.term}</h4>
                  <span className="text-xs text-slate-500">{entry.category}</span>
                </div>
                <span className="text-slate-500 text-sm">
                  {expandedTerm === entry.term ? '−' : '+'}
                </span>
              </div>

              {expandedTerm === entry.term && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-sm text-slate-300">{entry.definition}</p>

                  {entry.related && entry.related.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400 mb-1">Related terms:</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.related.map((rel) => (
                          <button
                            key={rel}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRelatedClick(rel);
                            }}
                            className="px-2 py-0.5 bg-slate-700 text-xs text-emerald-400 rounded hover:bg-slate-600 transition-colors"
                          >
                            {rel}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>No matching terms found.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}
                className="mt-2 text-sm text-emerald-400 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500 text-center">
          Click on a term to expand its definition and see related terms.
        </div>
      </div>
    </div>
  );
}
