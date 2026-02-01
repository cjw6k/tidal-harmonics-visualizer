import { useState, useEffect, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';

interface TidalFact {
  id: string;
  category: 'constituent' | 'station' | 'science' | 'history';
  text: string;
  icon: string;
}

const GENERAL_FACTS: TidalFact[] = [
  {
    id: 'g1',
    category: 'science',
    text: 'The Moon is 384,400 km away but its gravity creates ocean bulges up to 0.5m high in the open ocean.',
    icon: '🌙',
  },
  {
    id: 'g2',
    category: 'science',
    text: "The Sun's tidal force is 46% of the Moon's, despite being 400× farther away, because it's so massive.",
    icon: '☀️',
  },
  {
    id: 'g3',
    category: 'science',
    text: 'Spring tides occur at new and full moons when Sun and Moon align. They can be 20% higher than average.',
    icon: '🌊',
  },
  {
    id: 'g4',
    category: 'science',
    text: 'Neap tides occur at quarter moons when Sun and Moon are at right angles, reducing the range by 20%.',
    icon: '🌓',
  },
  {
    id: 'g5',
    category: 'history',
    text: "Arthur Doodson identified 388 tidal constituents in 1921. NOAA uses 37 for most predictions.",
    icon: '📚',
  },
  {
    id: 'g6',
    category: 'history',
    text: "Lord Kelvin built the first mechanical tide predictor in 1872, using gears to sum harmonics.",
    icon: '⚙️',
  },
  {
    id: 'g7',
    category: 'science',
    text: 'Tidal friction is slowing Earth\'s rotation by 2.3 milliseconds per century.',
    icon: '🌍',
  },
  {
    id: 'g8',
    category: 'science',
    text: 'The Moon is slowly spiraling away from Earth at 3.8 cm per year due to tidal energy transfer.',
    icon: '🌙',
  },
  {
    id: 'g9',
    category: 'science',
    text: 'The 18.61-year lunar nodal cycle causes tidal ranges to vary by about ±5% over nearly two decades.',
    icon: '📅',
  },
  {
    id: 'g10',
    category: 'history',
    text: 'Julius Caesar\'s fleet was damaged by English Channel tides in 55 BC - Romans were unfamiliar with large tidal ranges.',
    icon: '⚔️',
  },
];

/**
 * TidalFactsWidget
 *
 * Displays rotating educational facts about tides.
 * Facts are contextual to the currently selected station and constituent.
 */
export function TidalFactsWidget() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [factIndex, setFactIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Generate contextual facts based on current selection
  const allFacts = useMemo(() => {
    const facts = [...GENERAL_FACTS];

    if (station) {
      // Add station-specific facts
      const dominantConstituent = station.constituents.reduce((max, c) =>
        c.amplitude > max.amplitude ? c : max
      );

      const info = CONSTITUENTS[dominantConstituent.symbol];
      if (info) {
        facts.push({
          id: `s1-${station.id}`,
          category: 'station',
          text: `At ${station.name}, the ${info.name} (${dominantConstituent.symbol}) is the dominant constituent with ${dominantConstituent.amplitude.toFixed(2)}m amplitude.`,
          icon: '📍',
        });
      }

      // Calculate approximate tidal type
      const m2 = station.constituents.find((c) => c.symbol === 'M2')?.amplitude ?? 0;
      const s2 = station.constituents.find((c) => c.symbol === 'S2')?.amplitude ?? 0;
      const k1 = station.constituents.find((c) => c.symbol === 'K1')?.amplitude ?? 0;
      const o1 = station.constituents.find((c) => c.symbol === 'O1')?.amplitude ?? 0;

      const formNumber = (m2 + s2) > 0 ? (k1 + o1) / (m2 + s2) : 0;

      let tidalType = 'semidiurnal';
      if (formNumber > 3) tidalType = 'diurnal';
      else if (formNumber > 1.5) tidalType = 'mixed-diurnal';
      else if (formNumber > 0.25) tidalType = 'mixed-semidiurnal';

      facts.push({
        id: `s2-${station.id}`,
        category: 'station',
        text: `${station.name} has ${tidalType} tides with a form number of ${formNumber.toFixed(2)}.`,
        icon: '🌊',
      });

      // Add constituent count fact
      const significantCount = station.constituents.filter((c) => c.amplitude > 0.01).length;
      facts.push({
        id: `s3-${station.id}`,
        category: 'station',
        text: `This station has ${station.constituents.length} constituents, with ${significantCount} having amplitudes > 1cm.`,
        icon: '📊',
      });
    }

    return facts;
  }, [station]);

  // Rotate facts every 8 seconds
  useEffect(() => {
    if (isPaused || allFacts.length === 0) return;

    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % allFacts.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isPaused, allFacts.length]);

  const currentFact = allFacts[factIndex % allFacts.length];

  if (!currentFact) return null;

  const categoryColors: Record<string, string> = {
    constituent: 'bg-blue-500/20 text-blue-400',
    station: 'bg-green-500/20 text-green-400',
    science: 'bg-purple-500/20 text-purple-400',
    history: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div
      className="fixed bottom-24 left-4 z-30 max-w-xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-700 shadow-lg">
        <div className="flex items-start gap-2">
          <span className="text-xl">{currentFact.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[currentFact.category] ?? 'bg-slate-700 text-slate-400'}`}
              >
                {currentFact.category === 'constituent'
                  ? 'Constituent'
                  : currentFact.category === 'station'
                  ? 'This Station'
                  : currentFact.category === 'history'
                  ? 'History'
                  : 'Science'}
              </span>
              {isPaused && (
                <span className="text-[10px] text-slate-500">Paused</span>
              )}
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {currentFact.text}
            </p>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {allFacts.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => setFactIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === factIndex % allFacts.length
                  ? 'bg-white'
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
            />
          ))}
          {allFacts.length > 8 && (
            <span className="text-[10px] text-slate-500 ml-1">
              +{allFacts.length - 8}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
