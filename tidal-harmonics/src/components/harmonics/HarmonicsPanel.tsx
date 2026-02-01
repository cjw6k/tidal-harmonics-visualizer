import { useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { StationSelector } from './StationSelector';
import { ConstituentToggles } from './ConstituentToggles';
import { PhasorDiagram } from './PhasorDiagram';
import { TideCurve } from './TideCurve';
import { ConstituentInfoPanel } from './ConstituentInfoPanel';

export function HarmonicsPanel() {
  const showPhasorDiagram = useHarmonicsStore((s) => s.showPhasorDiagram);
  const showTideCurve = useHarmonicsStore((s) => s.showTideCurve);
  const togglePhasorDiagram = useHarmonicsStore((s) => s.togglePhasorDiagram);
  const toggleTideCurve = useHarmonicsStore((s) => s.toggleTideCurve);
  const [selectedConstituent, setSelectedConstituent] = useState<string | null>(null);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-10 max-w-[380px]">
      {/* Controls */}
      <div className="flex flex-col gap-2">
        <StationSelector />
        <ConstituentToggles />
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          onClick={togglePhasorDiagram}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showPhasorDiagram ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          Phasor
        </button>
        <button
          onClick={toggleTideCurve}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showTideCurve ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          Tide Curve
        </button>
      </div>

      {/* Visualizations */}
      {showPhasorDiagram && <PhasorDiagram onConstituentClick={setSelectedConstituent} />}
      {showTideCurve && <TideCurve />}

      {/* Info Panel */}
      <ConstituentInfoPanel
        symbol={selectedConstituent}
        onClose={() => setSelectedConstituent(null)}
      />
    </div>
  );
}
