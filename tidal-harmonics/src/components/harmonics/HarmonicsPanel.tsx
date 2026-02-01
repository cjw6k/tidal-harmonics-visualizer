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
const BarometricPressure = lazy(() => import('./BarometricPressure').then(m => ({ default: m.BarometricPressure })));
const KeyboardShortcuts = lazy(() => import('./KeyboardShortcuts').then(m => ({ default: m.KeyboardShortcuts })));
const ConstituentFamilies = lazy(() => import('./ConstituentFamilies').then(m => ({ default: m.ConstituentFamilies })));
const TideAlerts = lazy(() => import('./TideAlerts').then(m => ({ default: m.TideAlerts })));
const LunarPhaseDisplay = lazy(() => import('./LunarPhaseDisplay').then(m => ({ default: m.LunarPhaseDisplay })));
const TidalCoefficients = lazy(() => import('./TidalCoefficients').then(m => ({ default: m.TidalCoefficients })));
const ConstituentQuiz = lazy(() => import('./ConstituentQuiz').then(m => ({ default: m.ConstituentQuiz })));
const TidalBoreInfo = lazy(() => import('./TidalBoreInfo').then(m => ({ default: m.TidalBoreInfo })));
const HarmonicAnalysisExplainer = lazy(() => import('./HarmonicAnalysisExplainer').then(m => ({ default: m.HarmonicAnalysisExplainer })));
const SolunarActivity = lazy(() => import('./SolunarActivity').then(m => ({ default: m.SolunarActivity })));
const TideRateIndicator = lazy(() => import('./TideRateIndicator').then(m => ({ default: m.TideRateIndicator })));
const AmphidromicPoints = lazy(() => import('./AmphidromicPoints').then(m => ({ default: m.AmphidromicPoints })));
const TidalLoadingExplainer = lazy(() => import('./TidalLoadingExplainer').then(m => ({ default: m.TidalLoadingExplainer })));
const PortTimingComparison = lazy(() => import('./PortTimingComparison').then(m => ({ default: m.PortTimingComparison })));
const WeatherEffectSimulator = lazy(() => import('./WeatherEffectSimulator').then(m => ({ default: m.WeatherEffectSimulator })));
const EstuaryDynamics = lazy(() => import('./EstuaryDynamics').then(m => ({ default: m.EstuaryDynamics })));
const NavigationSafety = lazy(() => import('./NavigationSafety').then(m => ({ default: m.NavigationSafety })));
const TidalResonance = lazy(() => import('./TidalResonance').then(m => ({ default: m.TidalResonance })));
const MoonPhaseCalendar = lazy(() => import('./MoonPhaseCalendar').then(m => ({ default: m.MoonPhaseCalendar })));
const EmbeddableTideWidget = lazy(() => import('./EmbeddableTideWidget').then(m => ({ default: m.EmbeddableTideWidget })));
const TidalDatumConverter = lazy(() => import('./TidalDatumConverter').then(m => ({ default: m.TidalDatumConverter })));
const BeatPatternVisualizer = lazy(() => import('./BeatPatternVisualizer').then(m => ({ default: m.BeatPatternVisualizer })));
const UnderKeelClearance = lazy(() => import('./UnderKeelClearance').then(m => ({ default: m.UnderKeelClearance })));
const IntertidalZoneExplorer = lazy(() => import('./IntertidalZoneExplorer').then(m => ({ default: m.IntertidalZoneExplorer })));
const PrintableTideTable = lazy(() => import('./PrintableTideTable').then(m => ({ default: m.PrintableTideTable })));
const SlackWaterFinder = lazy(() => import('./SlackWaterFinder').then(m => ({ default: m.SlackWaterFinder })));
const BeachAccessPlanner = lazy(() => import('./BeachAccessPlanner').then(m => ({ default: m.BeachAccessPlanner })));
const TideDateComparison = lazy(() => import('./TideDateComparison').then(m => ({ default: m.TideDateComparison })));
const TidalCurrentSpeed = lazy(() => import('./TidalCurrentSpeed').then(m => ({ default: m.TidalCurrentSpeed })));
const RuleOfTwelfths = lazy(() => import('./RuleOfTwelfths').then(m => ({ default: m.RuleOfTwelfths })));

// Import hook directly since it's not lazy-loadable
import { useKeyboardNavigation } from './KeyboardShortcuts';

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
  const [showBarometric, setShowBarometric] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showFamilies, setShowFamilies] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showLunar, setShowLunar] = useState(false);
  const [showCoefficient, setShowCoefficient] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showBoreInfo, setShowBoreInfo] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSolunar, setShowSolunar] = useState(false);
  const [showTideRate, setShowTideRate] = useState(false);
  const [showAmphidromic, setShowAmphidromic] = useState(false);
  const [showTidalLoading, setShowTidalLoading] = useState(false);
  const [showPortTiming, setShowPortTiming] = useState(false);
  const [showWeatherSim, setShowWeatherSim] = useState(false);
  const [showEstuary, setShowEstuary] = useState(false);
  const [showNavSafety, setShowNavSafety] = useState(false);
  const [showResonance, setShowResonance] = useState(false);
  const [showMoonCalendar, setShowMoonCalendar] = useState(false);
  const [showEmbedWidget, setShowEmbedWidget] = useState(false);
  const [showDatumConverter, setShowDatumConverter] = useState(false);
  const [showBeatPattern, setShowBeatPattern] = useState(false);
  const [showUKC, setShowUKC] = useState(false);
  const [showIntertidal, setShowIntertidal] = useState(false);
  const [showPrintTable, setShowPrintTable] = useState(false);
  const [showSlackWater, setShowSlackWater] = useState(false);
  const [showBeachAccess, setShowBeachAccess] = useState(false);
  const [showDateComparison, setShowDateComparison] = useState(false);
  const [showCurrentSpeed, setShowCurrentSpeed] = useState(false);
  const [showTwelfths, setShowTwelfths] = useState(false);

  // Enable keyboard navigation
  useKeyboardNavigation(showKeyboardHelp, setShowKeyboardHelp, {
    setShowDoodsonExplorer,
    setShowAccuracyComparison,
    setShowKingTidePredictor,
    setShowStationComparison,
    setShowRangeChart,
    setShowPieChart,
    setShowWaveform,
    setShowCalendar,
    setShowTable,
    setShowExtremes,
    setShowNodal,
    setShowSpectrum,
    setShowPhaseAnimation,
    setShowExport,
    setShowDatumExplainer,
    setShowComparison,
    setShowSeaLevelRise,
    setShowHistorical,
    setShowWaterShader,
    setShowEnergy,
    setShowClock,
    setShowTimeline,
    setShowShare,
    setShowMap,
    setShowBarometric,
    setShowFamilies,
    setShowAlerts,
    setShowLunar,
    setShowCoefficient,
  });

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
        <button
          onClick={() => setShowKeyboardHelp(true)}
          aria-label="Keyboard shortcuts"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Keyboard shortcuts (?)"
        >
          ⌨
        </button>
        <button
          onClick={() => setShowQuiz(true)}
          aria-label="Test your knowledge"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Test your knowledge"
        >
          🎓
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
          onClick={() => setShowFamilies(!showFamilies)}
          aria-pressed={showFamilies}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showFamilies ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Constituent families"
        >
          Family
        </button>
        <button
          onClick={() => setShowDatumExplainer(true)}
          aria-label="Learn about tidal datums"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Learn about tidal datums"
        >
          📏
        </button>
        <button
          onClick={() => setShowBoreInfo(true)}
          aria-label="Learn about tidal bores"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Learn about tidal bores"
        >
          🌊
        </button>
        <button
          onClick={() => setShowAnalysis(true)}
          aria-label="Learn about harmonic analysis"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Learn about harmonic analysis"
        >
          📊
        </button>
        <button
          onClick={() => setShowSolunar(!showSolunar)}
          aria-pressed={showSolunar}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showSolunar ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Solunar fishing forecast"
        >
          🎣 Fish
        </button>
        <button
          onClick={() => setShowAmphidromic(true)}
          aria-label="Learn about amphidromic points"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Amphidromic points"
        >
          🌀
        </button>
        <button
          onClick={() => setShowTidalLoading(true)}
          aria-label="Learn about tidal loading"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Tidal loading - land deformation"
        >
          ⬇️
        </button>
        <button
          onClick={() => setShowPortTiming(true)}
          aria-label="Compare port timing"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Port timing comparison"
        >
          ⏱️
        </button>
        <button
          onClick={() => setShowWeatherSim(true)}
          aria-label="Weather effects simulator"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Weather effects on sea level"
        >
          🌪️
        </button>
        <button
          onClick={() => setShowEstuary(true)}
          aria-label="Estuary tidal dynamics"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Estuary dynamics"
        >
          🏞️
        </button>
        <button
          onClick={() => setShowNavSafety(true)}
          aria-label="Navigation safety calculator"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Navigation safety"
        >
          ⚓
        </button>
        <button
          onClick={() => setShowResonance(true)}
          aria-label="Tidal resonance explainer"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Why some bays have giant tides"
        >
          📢
        </button>
        <button
          onClick={() => setShowMoonCalendar(true)}
          aria-label="Moon phase and tide calendar"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Moon phase calendar with tides"
        >
          📆
        </button>
        <button
          onClick={() => setShowEmbedWidget(true)}
          aria-label="Get embeddable tide widget"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Embeddable widget code"
        >
          📤
        </button>
        <button
          onClick={() => setShowDatumConverter(true)}
          aria-label="Tidal datum converter"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Convert between tidal datums"
        >
          🔄
        </button>
        <button
          onClick={() => setShowBeatPattern(true)}
          aria-label="Beat pattern visualizer"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Constituent beat patterns"
        >
          〰️
        </button>
        <button
          onClick={() => setShowUKC(true)}
          aria-label="Under keel clearance calculator"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Under keel clearance"
        >
          🚢
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
          onClick={() => setShowLunar(!showLunar)}
          aria-pressed={showLunar}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showLunar ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Lunar phase"
        >
          Moon
        </button>
        <button
          onClick={() => setShowCoefficient(!showCoefficient)}
          aria-pressed={showCoefficient}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showCoefficient ? 'bg-lime-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Tidal coefficient (French scale)"
        >
          Coef
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
          onClick={() => setShowTideRate(!showTideRate)}
          aria-pressed={showTideRate}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showTideRate ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Current tide rate"
        >
          Rate
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
        <button
          onClick={() => setShowBarometric(!showBarometric)}
          aria-pressed={showBarometric}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showBarometric ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Barometric pressure effects"
        >
          Baro
        </button>
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          aria-pressed={showAlerts}
          className={`flex-1 px-3 py-2 sm:py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-slate-900
            ${showAlerts ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Tide alerts"
        >
          Alerts
        </button>
        <button
          onClick={() => setShowIntertidal(true)}
          aria-label="Intertidal zone explorer"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Explore intertidal zones and tidepooling"
        >
          🦀
        </button>
        <button
          onClick={() => setShowPrintTable(true)}
          aria-label="Printable tide table"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Print-friendly tide table"
        >
          🖨️
        </button>
        <button
          onClick={() => setShowSlackWater(true)}
          aria-label="Slack water finder"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Find slack water times"
        >
          ⏸️
        </button>
        <button
          onClick={() => setShowBeachAccess(true)}
          aria-label="Beach access planner"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Plan beach access windows"
        >
          🏖️
        </button>
        <button
          onClick={() => setShowDateComparison(true)}
          aria-label="Compare dates"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Compare tides between dates"
        >
          📅
        </button>
        <button
          onClick={() => setShowCurrentSpeed(true)}
          aria-label="Current speed estimator"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Estimated tidal current speed"
        >
          🌀
        </button>
        <button
          onClick={() => setShowTwelfths(true)}
          aria-label="Rule of Twelfths"
          className="px-3 py-2 sm:py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600 active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          title="Traditional mariner's Rule of Twelfths"
        >
          ¹²
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
        {showBarometric && <BarometricPressure />}
        {showFamilies && <ConstituentFamilies />}
        {showAlerts && <TideAlerts />}
        {showLunar && <LunarPhaseDisplay />}
        {showCoefficient && <TidalCoefficients />}
        {showSolunar && <SolunarActivity />}
        {showTideRate && <TideRateIndicator />}
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

        {showKeyboardHelp && (
          <KeyboardShortcuts onClose={() => setShowKeyboardHelp(false)} />
        )}

        {showQuiz && (
          <ConstituentQuiz onClose={() => setShowQuiz(false)} />
        )}

        {showBoreInfo && (
          <TidalBoreInfo onClose={() => setShowBoreInfo(false)} />
        )}

        {showAnalysis && (
          <HarmonicAnalysisExplainer onClose={() => setShowAnalysis(false)} />
        )}

        {showAmphidromic && (
          <AmphidromicPoints onClose={() => setShowAmphidromic(false)} />
        )}

        {showTidalLoading && (
          <TidalLoadingExplainer onClose={() => setShowTidalLoading(false)} />
        )}

        {showPortTiming && (
          <PortTimingComparison onClose={() => setShowPortTiming(false)} />
        )}

        {showWeatherSim && (
          <WeatherEffectSimulator onClose={() => setShowWeatherSim(false)} />
        )}

        {showEstuary && (
          <EstuaryDynamics onClose={() => setShowEstuary(false)} />
        )}

        {showNavSafety && (
          <NavigationSafety onClose={() => setShowNavSafety(false)} />
        )}

        {showResonance && (
          <TidalResonance onClose={() => setShowResonance(false)} />
        )}

        {showMoonCalendar && (
          <MoonPhaseCalendar onClose={() => setShowMoonCalendar(false)} />
        )}

        {showEmbedWidget && (
          <EmbeddableTideWidget onClose={() => setShowEmbedWidget(false)} />
        )}

        {showDatumConverter && (
          <TidalDatumConverter onClose={() => setShowDatumConverter(false)} />
        )}

        {showBeatPattern && (
          <BeatPatternVisualizer onClose={() => setShowBeatPattern(false)} />
        )}

        {showUKC && (
          <UnderKeelClearance onClose={() => setShowUKC(false)} />
        )}

        {showIntertidal && (
          <IntertidalZoneExplorer onClose={() => setShowIntertidal(false)} />
        )}

        {showPrintTable && (
          <PrintableTideTable onClose={() => setShowPrintTable(false)} />
        )}

        {showSlackWater && (
          <SlackWaterFinder onClose={() => setShowSlackWater(false)} />
        )}

        {showBeachAccess && (
          <BeachAccessPlanner onClose={() => setShowBeachAccess(false)} />
        )}

        {showDateComparison && (
          <TideDateComparison onClose={() => setShowDateComparison(false)} />
        )}

        {showCurrentSpeed && (
          <TidalCurrentSpeed onClose={() => setShowCurrentSpeed(false)} />
        )}

        {showTwelfths && (
          <RuleOfTwelfths onClose={() => setShowTwelfths(false)} />
        )}
      </Suspense>
    </div>
  );
}
