import { useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { StationSelector } from './StationSelector';
import { ConstituentToggles } from './ConstituentToggles';
import { PhasorDiagram } from './PhasorDiagram';
import { TideCurve } from './TideCurve';
import { TidalStatistics } from './TidalStatistics';
import { ConstituentInfoPanel } from './ConstituentInfoPanel';
import { DoodsonExplorer } from './DoodsonExplorer';
import { AccuracyComparison } from './AccuracyComparison';
import { KingTidePredictor } from './KingTidePredictor';
import { StationComparison } from './StationComparison';
import { TidalRangeChart } from './TidalRangeChart';
import { ConstituentPieChart } from './ConstituentPieChart';
import { WaveformDecomposition } from './WaveformDecomposition';
import { SpringNeapCalendar } from './SpringNeapCalendar';
import { ConstituentTable } from './ConstituentTable';
import { TideExtremesPanel } from './TideExtremesPanel';

export function HarmonicsPanel() {
  const showPhasorDiagram = useHarmonicsStore((s) => s.showPhasorDiagram);
  const showTideCurve = useHarmonicsStore((s) => s.showTideCurve);
  const togglePhasorDiagram = useHarmonicsStore((s) => s.togglePhasorDiagram);
  const toggleTideCurve = useHarmonicsStore((s) => s.toggleTideCurve);
  const [selectedConstituent, setSelectedConstituent] = useState<string | null>(null);
  const [showDoodsonExplorer, setShowDoodsonExplorer] = useState(false);
  const [showAccuracyComparison, setShowAccuracyComparison] = useState(false);
  const [showKingTidePredictor, setShowKingTidePredictor] = useState(false);
  const [showStationComparison, setShowStationComparison] = useState(false);
  const [showRangeChart, setShowRangeChart] = useState(false);
  const [showPieChart, setShowPieChart] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showExtremes, setShowExtremes] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-10 max-w-[380px]">
      {/* Controls */}
      <div className="flex flex-col gap-2">
        <StationSelector />
        <TidalStatistics />
        <ConstituentToggles />
      </div>

      {/* Toggle buttons - row 1 */}
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
          Curve
        </button>
        <button
          onClick={() => setShowAccuracyComparison(!showAccuracyComparison)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showAccuracyComparison ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Compare prediction accuracy"
        >
          Accuracy
        </button>
        <button
          onClick={() => setShowDoodsonExplorer(true)}
          className="px-3 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
          title="Learn about Doodson numbers"
        >
          ?
        </button>
      </div>

      {/* Toggle buttons - row 2 */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowKingTidePredictor(!showKingTidePredictor)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showKingTidePredictor ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Predict king tides (perigean spring tides)"
        >
          👑 King
        </button>
        <button
          onClick={() => setShowStationComparison(!showStationComparison)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showStationComparison ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Compare stations over time"
        >
          Compare
        </button>
        <button
          onClick={() => setShowRangeChart(!showRangeChart)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showRangeChart ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Compare tidal ranges"
        >
          Ranges
        </button>
        <button
          onClick={() => setShowPieChart(!showPieChart)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showPieChart ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Constituent breakdown"
        >
          Pie
        </button>
      </div>

      {/* Toggle buttons - row 3 */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowWaveform(!showWaveform)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showWaveform ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Waveform decomposition"
        >
          Waves
        </button>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showCalendar ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Spring-neap calendar"
        >
          Calendar
        </button>
        <button
          onClick={() => setShowTable(!showTable)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showTable ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Constituent table"
        >
          Table
        </button>
        <button
          onClick={() => setShowExtremes(!showExtremes)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showExtremes ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="High/low tide predictions"
        >
          Hi/Lo
        </button>
      </div>

      {/* Visualizations */}
      {showPhasorDiagram && <PhasorDiagram onConstituentClick={setSelectedConstituent} />}
      {showTideCurve && <TideCurve />}
      {showAccuracyComparison && <AccuracyComparison />}
      {showKingTidePredictor && <KingTidePredictor />}
      {showStationComparison && <StationComparison />}
      {showRangeChart && <TidalRangeChart />}
      {showPieChart && <ConstituentPieChart />}
      {showWaveform && <WaveformDecomposition />}
      {showCalendar && <SpringNeapCalendar />}
      {showTable && <ConstituentTable />}
      {showExtremes && <TideExtremesPanel />}

      {/* Info Panel */}
      <ConstituentInfoPanel
        symbol={selectedConstituent}
        onClose={() => setSelectedConstituent(null)}
      />

      {/* Doodson Explorer */}
      {showDoodsonExplorer && (
        <DoodsonExplorer onClose={() => setShowDoodsonExplorer(false)} />
      )}
    </div>
  );
}
