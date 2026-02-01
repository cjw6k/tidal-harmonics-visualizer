import { useState, lazy, Suspense } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { StationSelector } from './StationSelector';
import { ConstituentToggles } from './ConstituentToggles';
import { PhasorDiagram } from './PhasorDiagram';
import { TideCurve } from './TideCurve';
import { TidalStatistics } from './TidalStatistics';
import { TidalCurrentIndicator } from './TidalCurrentIndicator';
import { ConstituentInfoPanel } from './ConstituentInfoPanel';
import { UnitToggle } from './UnitToggle';

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
const SeaLevelRisePanel = lazy(() => import('./SeaLevelRisePanel').then(m => ({ default: m.SeaLevelRisePanel })));
const HistoricalExtremes = lazy(() => import('./HistoricalExtremes').then(m => ({ default: m.HistoricalExtremes })));
const WaterSurfaceShader = lazy(() => import('./WaterSurfaceShader').then(m => ({ default: m.WaterSurfaceShader })));
const TidalEnergyCalculator = lazy(() => import('./TidalEnergyCalculator').then(m => ({ default: m.TidalEnergyCalculator })));
const TideClock = lazy(() => import('./TideClock').then(m => ({ default: m.TideClock })));
const TideTimeline = lazy(() => import('./TideTimeline').then(m => ({ default: m.TideTimeline })));
const SharePanel = lazy(() => import('./SharePanel').then(m => ({ default: m.SharePanel })));
const StationMap = lazy(() => import('./StationMap').then(m => ({ default: m.StationMap })));

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
  const [showSeaLevelRise, setShowSeaLevelRise] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showWaterShader, setShowWaterShader] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col gap-2 sm:gap-3 z-10 max-w-[320px] sm:max-w-[380px]">
      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <StationSelector />
          </div>
          <UnitToggle />
        </div>
        <TidalStatistics />
        <TidalCurrentIndicator />
        <ConstituentToggles />
      </div>

      {/* Toggle buttons - row 1 */}
      <div className="flex flex-wrap gap-1 sm:gap-2" role="group" aria-label="Visualization controls - primary">
        <button
          onClick={togglePhasorDiagram}
          aria-pressed={showPhasorDiagram}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showPhasorDiagram ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          Phasor
        </button>
        <button
          onClick={toggleTideCurve}
          aria-pressed={showTideCurve}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showTideCurve ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
        >
          Curve
        </button>
        <button
          onClick={() => setShowAccuracyComparison(!showAccuracyComparison)}
          aria-pressed={showAccuracyComparison}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showAccuracyComparison ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Compare prediction accuracy"
        >
          Accuracy
        </button>
        <button
          onClick={() => setShowDoodsonExplorer(true)}
          aria-label="Learn about Doodson numbers"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Learn about Doodson numbers"
        >
          ?
        </button>
        <button
          onClick={() => setShowPhaseAnimation(true)}
          aria-label="Show animated phasor rotation"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Animated phasor rotation"
        >
          ▶
        </button>
        <button
          onClick={() => setShowComparison(true)}
          aria-label="Compare constituents"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Compare constituents"
        >
          ⚖
        </button>
        <button
          onClick={() => setShowExport(true)}
          aria-label="Export data"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Export data"
        >
          ↓
        </button>
        <button
          onClick={() => setShowShare(true)}
          aria-label="Share this view"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Share this view"
        >
          🔗
        </button>
      </div>

      {/* Toggle buttons - row 2 */}
      <div className="flex flex-wrap gap-1 sm:gap-2" role="group" aria-label="Visualization controls - secondary">
        <button
          onClick={() => setShowKingTidePredictor(!showKingTidePredictor)}
          aria-pressed={showKingTidePredictor}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showKingTidePredictor ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Predict king tides (perigean spring tides)"
        >
          👑 King
        </button>
        <button
          onClick={() => setShowStationComparison(!showStationComparison)}
          aria-pressed={showStationComparison}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showStationComparison ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Compare stations over time"
        >
          Compare
        </button>
        <button
          onClick={() => setShowRangeChart(!showRangeChart)}
          aria-pressed={showRangeChart}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showRangeChart ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Compare tidal ranges"
        >
          Ranges
        </button>
        <button
          onClick={() => setShowPieChart(!showPieChart)}
          aria-pressed={showPieChart}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showPieChart ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Constituent breakdown"
        >
          Pie
        </button>
        <button
          onClick={() => setShowDatumExplainer(true)}
          aria-label="Learn about tidal datums"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Learn about tidal datums"
        >
          📏
        </button>
      </div>

      {/* Toggle buttons - row 3 */}
      <div className="flex flex-wrap gap-1 sm:gap-2" role="group" aria-label="Visualization controls - tertiary">
        <button
          onClick={() => setShowWaveform(!showWaveform)}
          aria-pressed={showWaveform}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showWaveform ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Waveform decomposition"
        >
          Waves
        </button>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          aria-pressed={showCalendar}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showCalendar ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Spring-neap calendar"
        >
          Calendar
        </button>
        <button
          onClick={() => setShowTable(!showTable)}
          aria-pressed={showTable}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showTable ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Constituent table"
        >
          Table
        </button>
        <button
          onClick={() => setShowExtremes(!showExtremes)}
          aria-pressed={showExtremes}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showExtremes ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="High/low tide predictions"
        >
          Hi/Lo
        </button>
        <button
          onClick={() => setShowNodal(!showNodal)}
          aria-pressed={showNodal}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showNodal ? 'bg-fuchsia-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="18.6-year nodal cycle"
        >
          Nodal
        </button>
        <button
          onClick={() => setShowSpectrum(!showSpectrum)}
          aria-pressed={showSpectrum}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showSpectrum ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Frequency spectrum"
        >
          Freq
        </button>
        <button
          onClick={() => setShowSeaLevelRise(!showSeaLevelRise)}
          aria-pressed={showSeaLevelRise}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showSeaLevelRise ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Sea level rise projections"
        >
          SLR
        </button>
        <button
          onClick={() => setShowHistorical(!showHistorical)}
          aria-pressed={showHistorical}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showHistorical ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Historical extreme tides"
        >
          Records
        </button>
        <button
          onClick={() => setShowWaterShader(!showWaterShader)}
          aria-pressed={showWaterShader}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showWaterShader ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="WebGL water surface animation"
        >
          Shader
        </button>
        <button
          onClick={() => setShowEnergy(!showEnergy)}
          aria-pressed={showEnergy}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showEnergy ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Tidal energy potential calculator"
        >
          Energy
        </button>
        <button
          onClick={() => setShowClock(!showClock)}
          aria-pressed={showClock}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showClock ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Tide clock visualization"
        >
          Clock
        </button>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          aria-pressed={showTimeline}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showTimeline ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="24-hour tide timeline"
        >
          Timeline
        </button>
        <button
          onClick={() => setShowMap(!showMap)}
          aria-pressed={showMap}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showMap ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Station map"
        >
          Map
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
        {showSeaLevelRise && <SeaLevelRisePanel />}
        {showHistorical && <HistoricalExtremes />}
        {showWaterShader && <WaterSurfaceShader />}
        {showEnergy && <TidalEnergyCalculator />}
        {showClock && <TideClock />}
        {showTimeline && <TideTimeline />}
        {showMap && <StationMap />}
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

        {showShare && (
          <SharePanel onClose={() => setShowShare(false)} />
        )}
      </Suspense>
    </div>
  );
}
