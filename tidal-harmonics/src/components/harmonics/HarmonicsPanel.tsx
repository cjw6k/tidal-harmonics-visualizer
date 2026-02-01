import { useState, lazy, Suspense } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { StationSelector } from './StationSelector';
import { ConstituentToggles } from './ConstituentToggles';
import { PhasorDiagram } from './PhasorDiagram';
import { TideCurve } from './TideCurve';
import { TidalStatistics } from './TidalStatistics';
import { ConstituentInfoPanel } from './ConstituentInfoPanel';

// Lazy load modal/panel components that aren't immediately visible
const DoodsonExplorer = lazy(() => import('./DoodsonExplorer').then(m => ({ default: m.DoodsonExplorer })));
const AccuracyComparison = lazy(() => import('./AccuracyComparison').then(m => ({ default: m.AccuracyComparison })));
const KingTidePredictor = lazy(() => import('./KingTidePredictor').then(m => ({ default: m.KingTidePredictor })));
const StationComparison = lazy(() => import('./StationComparison').then(m => ({ default: m.StationComparison })));
const TidalRangeChart = lazy(() => import('./TidalRangeChart').then(m => ({ default: m.TidalRangeChart })));
const ConstituentPieChart = lazy(() => import('./ConstituentPieChart').then(m => ({ default: m.ConstituentPieChart })));
const WaveformDecomposition = lazy(() => import('./WaveformDecomposition').then(m => ({ default: m.WaveformDecomposition })));
const SpringNeapCalendar = lazy(() => import('./SpringNeapCalendar').then(m => ({ default: m.SpringNeapCalendar })));
const ConstituentTable = lazy(() => import('./ConstituentTable').then(m => ({ default: m.ConstituentTable })));
const TideExtremesPanel = lazy(() => import('./TideExtremesPanel').then(m => ({ default: m.TideExtremesPanel })));
const NodalCorrectionPanel = lazy(() => import('./NodalCorrectionPanel').then(m => ({ default: m.NodalCorrectionPanel })));
const FrequencySpectrum = lazy(() => import('./FrequencySpectrum').then(m => ({ default: m.FrequencySpectrum })));
const PhaseAnimation = lazy(() => import('./PhaseAnimation').then(m => ({ default: m.PhaseAnimation })));
const DataExport = lazy(() => import('./DataExport').then(m => ({ default: m.DataExport })));
const TidalDatumExplainer = lazy(() => import('./TidalDatumExplainer').then(m => ({ default: m.TidalDatumExplainer })));
const ConstituentComparison = lazy(() => import('./ConstituentComparison').then(m => ({ default: m.ConstituentComparison })));

// Loading fallback for lazy components
function LoadingFallback() {
  return (
    <div className="bg-slate-900 rounded-lg p-4 text-center text-slate-400">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}

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
  const [showNodal, setShowNodal] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [showPhaseAnimation, setShowPhaseAnimation] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDatumExplainer, setShowDatumExplainer] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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
        <button
          onClick={() => setShowPhaseAnimation(true)}
          className="px-3 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
          title="Animated phasor rotation"
        >
          ▶
        </button>
        <button
          onClick={() => setShowComparison(true)}
          className="px-3 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
          title="Compare constituents"
        >
          ⚖
        </button>
        <button
          onClick={() => setShowExport(true)}
          className="px-3 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
          title="Export data"
        >
          ↓
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
        <button
          onClick={() => setShowDatumExplainer(true)}
          className="px-3 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
          title="Learn about tidal datums"
        >
          📏
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
        <button
          onClick={() => setShowNodal(!showNodal)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showNodal ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="18.6-year nodal cycle"
        >
          Nodal
        </button>
        <button
          onClick={() => setShowSpectrum(!showSpectrum)}
          className={`flex-1 px-3 py-1 rounded text-xs transition-colors
            ${showSpectrum ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Frequency spectrum"
        >
          Freq
        </button>
      </div>

      {/* Core visualizations (not lazy) */}
      {showPhasorDiagram && <PhasorDiagram onConstituentClick={setSelectedConstituent} />}
      {showTideCurve && <TideCurve />}

      {/* Lazy-loaded visualizations */}
      <Suspense fallback={<LoadingFallback />}>
        {showAccuracyComparison && <AccuracyComparison />}
        {showKingTidePredictor && <KingTidePredictor />}
        {showStationComparison && <StationComparison />}
        {showRangeChart && <TidalRangeChart />}
        {showPieChart && <ConstituentPieChart />}
        {showWaveform && <WaveformDecomposition />}
        {showCalendar && <SpringNeapCalendar />}
        {showTable && <ConstituentTable />}
        {showExtremes && <TideExtremesPanel />}
        {showNodal && <NodalCorrectionPanel />}
        {showSpectrum && <FrequencySpectrum />}
      </Suspense>

      {/* Info Panel */}
      <ConstituentInfoPanel
        symbol={selectedConstituent}
        onClose={() => setSelectedConstituent(null)}
      />

      {/* Lazy-loaded modals */}
      <Suspense fallback={null}>
        {showDoodsonExplorer && (
          <DoodsonExplorer onClose={() => setShowDoodsonExplorer(false)} />
        )}

        {showPhaseAnimation && (
          <PhaseAnimation onClose={() => setShowPhaseAnimation(false)} />
        )}

        {showExport && (
          <DataExport onClose={() => setShowExport(false)} />
        )}

        {showDatumExplainer && (
          <TidalDatumExplainer onClose={() => setShowDatumExplainer(false)} />
        )}

        {showComparison && (
          <ConstituentComparison onClose={() => setShowComparison(false)} />
        )}
      </Suspense>
    </div>
  );
}
