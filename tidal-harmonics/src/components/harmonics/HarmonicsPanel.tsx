import { useState, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
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
const TidalWindowCalculator = lazy(() => import('./TidalWindowCalculator').then(m => ({ default: m.TidalWindowCalculator })));
const DepthCorrectionTool = lazy(() => import('./DepthCorrectionTool').then(m => ({ default: m.DepthCorrectionTool })));
const TideTypeClassifier = lazy(() => import('./TideTypeClassifier').then(m => ({ default: m.TideTypeClassifier })));
const EbbFloodAnalyzer = lazy(() => import('./EbbFloodAnalyzer').then(m => ({ default: m.EbbFloodAnalyzer })));
const AgeOfTide = lazy(() => import('./AgeOfTide').then(m => ({ default: m.AgeOfTide })));
const AnchorScopeCalculator = lazy(() => import('./AnchorScopeCalculator').then(m => ({ default: m.AnchorScopeCalculator })));
const TidalPrismCalculator = lazy(() => import('./TidalPrismCalculator').then(m => ({ default: m.TidalPrismCalculator })));
const MarinaAccessPlanner = lazy(() => import('./MarinaAccessPlanner').then(m => ({ default: m.MarinaAccessPlanner })));
const BridgeClearanceCalculator = lazy(() => import('./BridgeClearanceCalculator').then(m => ({ default: m.BridgeClearanceCalculator })));
const TidalStreamAtlas = lazy(() => import('./TidalStreamAtlas').then(m => ({ default: m.TidalStreamAtlas })));
const PassagePlannerTide = lazy(() => import('./PassagePlannerTide').then(m => ({ default: m.PassagePlannerTide })));
const FuelConsumptionEstimator = lazy(() => import('./FuelConsumptionEstimator').then(m => ({ default: m.FuelConsumptionEstimator })));
const CrewWatchScheduler = lazy(() => import('./CrewWatchScheduler').then(m => ({ default: m.CrewWatchScheduler })));
const WaypointRoutePlanner = lazy(() => import('./WaypointRoutePlanner').then(m => ({ default: m.WaypointRoutePlanner })));
const SeasonalTideComparison = lazy(() => import('./SeasonalTideComparison').then(m => ({ default: m.SeasonalTideComparison })));
const PortApproachAdvisor = lazy(() => import('./PortApproachAdvisor').then(m => ({ default: m.PortApproachAdvisor })));
const DockingWindowCalculator = lazy(() => import('./DockingWindowCalculator').then(m => ({ default: m.DockingWindowCalculator })));
const MooringLineCalculator = lazy(() => import('./MooringLineCalculator').then(m => ({ default: m.MooringLineCalculator })));
const SwellImpactCalculator = lazy(() => import('./SwellImpactCalculator').then(m => ({ default: m.SwellImpactCalculator })));
const VoyageLogGenerator = lazy(() => import('./VoyageLogGenerator').then(m => ({ default: m.VoyageLogGenerator })));
const GroundingRiskAnalyzer = lazy(() => import('./GroundingRiskAnalyzer').then(m => ({ default: m.GroundingRiskAnalyzer })));
const TidalStrandingTimer = lazy(() => import('./TidalStrandingTimer').then(m => ({ default: m.TidalStrandingTimer })));
const TideHeightLookup = lazy(() => import('./TideHeightLookup').then(m => ({ default: m.TideHeightLookup })));
const LunarDistancePanel = lazy(() => import('./LunarDistancePanel').then(m => ({ default: m.LunarDistancePanel })));
const EclipseTidesPanel = lazy(() => import('./EclipseTidesPanel').then(m => ({ default: m.EclipseTidesPanel })));
const DryingHeightsCalculator = lazy(() => import('./DryingHeightsCalculator').then(m => ({ default: m.DryingHeightsCalculator })));
const StormSurgeEstimator = lazy(() => import('./StormSurgeEstimator').then(m => ({ default: m.StormSurgeEstimator })));
const TidalGateScheduler = lazy(() => import('./TidalGateScheduler').then(m => ({ default: m.TidalGateScheduler })));
const CoriolisEffectPanel = lazy(() => import('./CoriolisEffectPanel').then(m => ({ default: m.CoriolisEffectPanel })));
const MeanSeaLevelTracker = lazy(() => import('./MeanSeaLevelTracker').then(m => ({ default: m.MeanSeaLevelTracker })));
const TidalRaceWarning = lazy(() => import('./TidalRaceWarning').then(m => ({ default: m.TidalRaceWarning })));
const FerryTimingOptimizer = lazy(() => import('./FerryTimingOptimizer').then(m => ({ default: m.FerryTimingOptimizer })));
const TidalGlossary = lazy(() => import('./TidalGlossary').then(m => ({ default: m.TidalGlossary })));
const MarineWeatherPanel = lazy(() => import('./MarineWeatherPanel').then(m => ({ default: m.MarineWeatherPanel })));
const LiveTideDisplay = lazy(() => import('./LiveTideDisplay').then(m => ({ default: m.LiveTideDisplay })));
const PhotoTimingPlanner = lazy(() => import('./PhotoTimingPlanner').then(m => ({ default: m.PhotoTimingPlanner })));
const ShellfishHarvestPlanner = lazy(() => import('./ShellfishHarvestPlanner').then(m => ({ default: m.ShellfishHarvestPlanner })));
const KayakLaunchPlanner = lazy(() => import('./KayakLaunchPlanner').then(m => ({ default: m.KayakLaunchPlanner })));
const DiveSlateGenerator = lazy(() => import('./DiveSlateGenerator').then(m => ({ default: m.DiveSlateGenerator })));
const CoastalHikingPlanner = lazy(() => import('./CoastalHikingPlanner').then(m => ({ default: m.CoastalHikingPlanner })));
const SurfConditionsCalculator = lazy(() => import('./SurfConditionsCalculator').then(m => ({ default: m.SurfConditionsCalculator })));

// Loading fallback for lazy components
function LoadingFallback() {
  return (
    <div className="bg-slate-900 rounded-lg p-4 text-center text-slate-400">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}

// Collapsible section component
function Section({
  title,
  icon,
  children,
  defaultOpen = false,
  count
}: {
  title: string;
  icon: string;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <span>{icon}</span>
          <span>{title}</span>
          {count !== undefined && (
            <span className="text-xs text-slate-500">({count})</span>
          )}
        </span>
        <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

// Tool button with label
function ToolButton({
  label,
  icon,
  onClick,
  active = false,
  color = 'slate'
}: {
  label: string;
  icon?: string;
  onClick: () => void;
  active?: boolean;
  color?: 'slate' | 'blue' | 'amber' | 'emerald' | 'purple' | 'rose' | 'cyan';
}) {
  const colorClasses = {
    slate: active ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
    blue: active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-blue-600/50',
    amber: active ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-amber-600/50',
    emerald: active ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-emerald-600/50',
    purple: active ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-purple-600/50',
    rose: active ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-rose-600/50',
    cyan: active ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-cyan-600/50',
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${colorClasses[color]}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

export function HarmonicsPanel() {
  const showPhasorDiagram = useHarmonicsStore((s) => s.showPhasorDiagram);
  const showTideCurve = useHarmonicsStore((s) => s.showTideCurve);
  const togglePhasorDiagram = useHarmonicsStore((s) => s.togglePhasorDiagram);
  const toggleTideCurve = useHarmonicsStore((s) => s.toggleTideCurve);

  // Selected constituent for info panel
  const [selectedConstituent, setSelectedConstituent] = useState<string | null>(null);

  // Modal/panel visibility states - organized by category
  // Visualizations
  const [showAccuracyComparison, setShowAccuracyComparison] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [showPhaseAnimation, setShowPhaseAnimation] = useState(false);
  const [showWaterShader, setShowWaterShader] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showBeatPattern, setShowBeatPattern] = useState(false);
  const [showLiveTide, setShowLiveTide] = useState(false);

  // Predictions & Data
  const [showExtremes, setShowExtremes] = useState(false);
  const [showKingTidePredictor, setShowKingTidePredictor] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNodal, setShowNodal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPrintTable, setShowPrintTable] = useState(false);
  const [showDateComparison, setShowDateComparison] = useState(false);
  const [showHeightLookup, setShowHeightLookup] = useState(false);
  const [showMoonCalendar, setShowMoonCalendar] = useState(false);
  const [showTidalWindow, setShowTidalWindow] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showEmbedWidget, setShowEmbedWidget] = useState(false);
  const [showSeasonalTide, setShowSeasonalTide] = useState(false);

  // Education & Science
  const [showDoodsonExplorer, setShowDoodsonExplorer] = useState(false);
  const [showDatumExplainer, setShowDatumExplainer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showBoreInfo, setShowBoreInfo] = useState(false);
  const [showAmphidromic, setShowAmphidromic] = useState(false);
  const [showTidalLoading, setShowTidalLoading] = useState(false);
  const [showResonance, setShowResonance] = useState(false);
  const [showCoriolis, setShowCoriolis] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showLunarDistance, setShowLunarDistance] = useState(false);
  const [showEclipseTides, setShowEclipseTides] = useState(false);
  const [showTwelfths, setShowTwelfths] = useState(false);
  const [showAgeOfTide, setShowAgeOfTide] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Station & Constituent Analysis
  const [showStationComparison, setShowStationComparison] = useState(false);
  const [showRangeChart, setShowRangeChart] = useState(false);
  const [showPieChart, setShowPieChart] = useState(false);
  const [showFamilies, setShowFamilies] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPortTiming, setShowPortTiming] = useState(false);
  const [showDatumConverter, setShowDatumConverter] = useState(false);
  const [showLunar, setShowLunar] = useState(false);
  const [showCoefficient, setShowCoefficient] = useState(false);
  const [showTideType, setShowTideType] = useState(false);
  const [showEbbFlood, setShowEbbFlood] = useState(false);
  const [showTideRate, setShowTideRate] = useState(false);

  // Navigation & Safety
  const [showNavSafety, setShowNavSafety] = useState(false);
  const [showUKC, setShowUKC] = useState(false);
  const [showBridgeClearance, setShowBridgeClearance] = useState(false);
  const [showAnchorScope, setShowAnchorScope] = useState(false);
  const [showGroundingRisk, setShowGroundingRisk] = useState(false);
  const [showStreamAtlas, setShowStreamAtlas] = useState(false);
  const [showPassagePlanner, setShowPassagePlanner] = useState(false);
  const [showDepthCorrection, setShowDepthCorrection] = useState(false);
  const [showSlackWater, setShowSlackWater] = useState(false);
  const [showCurrentSpeed, setShowCurrentSpeed] = useState(false);
  const [showTidalGate, setShowTidalGate] = useState(false);
  const [showTidalRace, setShowTidalRace] = useState(false);
  const [showFerryTiming, setShowFerryTiming] = useState(false);
  const [showPortApproach, setShowPortApproach] = useState(false);
  const [showDockingWindow, setShowDockingWindow] = useState(false);
  const [showMooringLine, setShowMooringLine] = useState(false);
  const [showStrandingTimer, setShowStrandingTimer] = useState(false);
  const [showMarinaAccess, setShowMarinaAccess] = useState(false);
  const [showFuelEstimator, setShowFuelEstimator] = useState(false);
  const [showCrewWatch, setShowCrewWatch] = useState(false);
  const [showWaypointRoute, setShowWaypointRoute] = useState(false);
  const [showVoyageLog, setShowVoyageLog] = useState(false);

  // Weather & Environment
  const [showBarometric, setShowBarometric] = useState(false);
  const [showSeaLevelRise, setShowSeaLevelRise] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showStormSurge, setShowStormSurge] = useState(false);
  const [showWeatherSim, setShowWeatherSim] = useState(false);
  const [showMarineWeather, setShowMarineWeather] = useState(false);
  const [showSwellImpact, setShowSwellImpact] = useState(false);
  const [showMSLTracker, setShowMSLTracker] = useState(false);
  const [showEnergy, setShowEnergy] = useState(false);
  const [showTidalPrism, setShowTidalPrism] = useState(false);
  const [showEstuary, setShowEstuary] = useState(false);
  const [showDryingHeights, setShowDryingHeights] = useState(false);

  // Activities & Recreation
  const [showBeachAccess, setShowBeachAccess] = useState(false);
  const [showIntertidal, setShowIntertidal] = useState(false);
  const [showShellfishPlanner, setShowShellfishPlanner] = useState(false);
  const [showKayakPlanner, setShowKayakPlanner] = useState(false);
  const [showDiveSlate, setShowDiveSlate] = useState(false);
  const [showHikingPlanner, setShowHikingPlanner] = useState(false);
  const [showSurfCalc, setShowSurfCalc] = useState(false);
  const [showPhotoPlanner, setShowPhotoPlanner] = useState(false);
  const [showSolunar, setShowSolunar] = useState(false);

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col gap-2 z-10 w-[320px] sm:w-[360px] max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-1">
      {/* Station & Current Conditions - Always visible */}
      <div className="bg-slate-800/90 backdrop-blur rounded-lg p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <StationSelector />
          </div>
          <UnitToggle />
        </div>
        <TidalStatistics />
        <TidalCurrentIndicator />
      </div>

      {/* Constituents - Always visible */}
      <div className="bg-slate-800/90 backdrop-blur rounded-lg p-3">
        <ConstituentToggles />
      </div>

      {/* Core Visualization Toggles */}
      <div className="bg-slate-800/90 backdrop-blur rounded-lg p-3">
        <div className="flex flex-wrap gap-1.5">
          <ToolButton
            label="Phasor"
            onClick={togglePhasorDiagram}
            active={showPhasorDiagram}
            color="blue"
          />
          <ToolButton
            label="Tide Curve"
            onClick={toggleTideCurve}
            active={showTideCurve}
            color="blue"
          />
          <ToolButton
            label="Hi/Lo"
            onClick={() => setShowExtremes(!showExtremes)}
            active={showExtremes}
            color="cyan"
          />
          <ToolButton
            label="Timeline"
            onClick={() => setShowTimeline(!showTimeline)}
            active={showTimeline}
            color="cyan"
          />
          <ToolButton
            label="Map"
            icon="🗺️"
            onClick={() => setShowMap(!showMap)}
            active={showMap}
          />
        </div>
      </div>

      {/* Collapsible Sections */}
      <Section title="Visualizations" icon="📊" count={9}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="Accuracy" onClick={() => setShowAccuracyComparison(!showAccuracyComparison)} active={showAccuracyComparison} />
          <ToolButton label="Waveforms" onClick={() => setShowWaveform(!showWaveform)} active={showWaveform} />
          <ToolButton label="Spectrum" onClick={() => setShowSpectrum(!showSpectrum)} active={showSpectrum} />
          <ToolButton label="Phase Anim" icon="▶" onClick={() => setShowPhaseAnimation(true)} />
          <ToolButton label="Water FX" onClick={() => setShowWaterShader(!showWaterShader)} active={showWaterShader} />
          <ToolButton label="Clock" onClick={() => setShowClock(!showClock)} active={showClock} />
          <ToolButton label="Beat Pattern" onClick={() => setShowBeatPattern(true)} />
          <ToolButton label="Live Display" onClick={() => setShowLiveTide(true)} />
          <ToolButton label="Rate" onClick={() => setShowTideRate(!showTideRate)} active={showTideRate} />
        </div>
      </Section>

      <Section title="Predictions & Calendar" icon="📅" count={13}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="King Tides" icon="👑" onClick={() => setShowKingTidePredictor(!showKingTidePredictor)} active={showKingTidePredictor} color="amber" />
          <ToolButton label="Spring/Neap" onClick={() => setShowCalendar(!showCalendar)} active={showCalendar} />
          <ToolButton label="Moon Calendar" onClick={() => setShowMoonCalendar(true)} />
          <ToolButton label="18.6yr Nodal" onClick={() => setShowNodal(!showNodal)} active={showNodal} />
          <ToolButton label="Seasonal" onClick={() => setShowSeasonalTide(true)} />
          <ToolButton label="Compare Dates" onClick={() => setShowDateComparison(true)} />
          <ToolButton label="Height Lookup" onClick={() => setShowHeightLookup(true)} />
          <ToolButton label="Tide Windows" onClick={() => setShowTidalWindow(true)} />
          <ToolButton label="Alerts" onClick={() => setShowAlerts(!showAlerts)} active={showAlerts} />
          <ToolButton label="Export" icon="↓" onClick={() => setShowExport(true)} />
          <ToolButton label="Print Table" icon="🖨️" onClick={() => setShowPrintTable(true)} />
          <ToolButton label="Share" icon="🔗" onClick={() => setShowShare(true)} />
          <ToolButton label="Embed Widget" onClick={() => setShowEmbedWidget(true)} />
        </div>
      </Section>

      <Section title="Education & Science" icon="🎓" count={15}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="Doodson Numbers" onClick={() => setShowDoodsonExplorer(true)} color="purple" />
          <ToolButton label="Tidal Datums" onClick={() => setShowDatumExplainer(true)} />
          <ToolButton label="Harmonic Analysis" onClick={() => setShowAnalysis(true)} />
          <ToolButton label="Tidal Bores" onClick={() => setShowBoreInfo(true)} />
          <ToolButton label="Amphidromic Pts" onClick={() => setShowAmphidromic(true)} />
          <ToolButton label="Tidal Loading" onClick={() => setShowTidalLoading(true)} />
          <ToolButton label="Resonance" onClick={() => setShowResonance(true)} />
          <ToolButton label="Coriolis Effect" onClick={() => setShowCoriolis(true)} />
          <ToolButton label="Moon Distance" onClick={() => setShowLunarDistance(true)} />
          <ToolButton label="Eclipse Tides" onClick={() => setShowEclipseTides(true)} />
          <ToolButton label="Rule of 12ths" onClick={() => setShowTwelfths(true)} />
          <ToolButton label="Age of Tide" onClick={() => setShowAgeOfTide(true)} />
          <ToolButton label="Quiz" icon="🎓" onClick={() => setShowQuiz(true)} color="emerald" />
          <ToolButton label="Glossary" icon="📖" onClick={() => setShowGlossary(true)} />
          <ToolButton label="Shortcuts" icon="⌨" onClick={() => setShowKeyboardHelp(true)} />
        </div>
      </Section>

      <Section title="Station Analysis" icon="📈" count={13}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="Compare Stations" onClick={() => setShowStationComparison(!showStationComparison)} active={showStationComparison} />
          <ToolButton label="Range Chart" onClick={() => setShowRangeChart(!showRangeChart)} active={showRangeChart} />
          <ToolButton label="Amplitude Pie" onClick={() => setShowPieChart(!showPieChart)} active={showPieChart} />
          <ToolButton label="Families" onClick={() => setShowFamilies(!showFamilies)} active={showFamilies} />
          <ToolButton label="Data Table" onClick={() => setShowTable(!showTable)} active={showTable} />
          <ToolButton label="Compare Const." onClick={() => setShowComparison(true)} />
          <ToolButton label="Port Timing" onClick={() => setShowPortTiming(true)} />
          <ToolButton label="Datum Convert" onClick={() => setShowDatumConverter(true)} />
          <ToolButton label="Moon Phase" onClick={() => setShowLunar(!showLunar)} active={showLunar} />
          <ToolButton label="Coefficient" onClick={() => setShowCoefficient(!showCoefficient)} active={showCoefficient} />
          <ToolButton label="Tide Type" onClick={() => setShowTideType(true)} />
          <ToolButton label="Ebb/Flood" onClick={() => setShowEbbFlood(true)} />
        </div>
      </Section>

      <Section title="Navigation & Safety" icon="⚓" count={20}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="Safety Calc" onClick={() => setShowNavSafety(true)} color="rose" />
          <ToolButton label="Under Keel" onClick={() => setShowUKC(true)} />
          <ToolButton label="Bridge Clear." onClick={() => setShowBridgeClearance(true)} />
          <ToolButton label="Anchor Scope" onClick={() => setShowAnchorScope(true)} />
          <ToolButton label="Grounding Risk" icon="⚠️" onClick={() => setShowGroundingRisk(true)} color="rose" />
          <ToolButton label="Stream Atlas" onClick={() => setShowStreamAtlas(true)} />
          <ToolButton label="Passage Plan" onClick={() => setShowPassagePlanner(true)} />
          <ToolButton label="Depth Correct" onClick={() => setShowDepthCorrection(true)} />
          <ToolButton label="Slack Water" onClick={() => setShowSlackWater(true)} />
          <ToolButton label="Current Speed" onClick={() => setShowCurrentSpeed(true)} />
          <ToolButton label="Tidal Gates" onClick={() => setShowTidalGate(true)} />
          <ToolButton label="Tidal Races" icon="⚡" onClick={() => setShowTidalRace(true)} />
          <ToolButton label="Ferry Timing" onClick={() => setShowFerryTiming(true)} />
          <ToolButton label="Port Approach" onClick={() => setShowPortApproach(true)} />
          <ToolButton label="Docking Window" onClick={() => setShowDockingWindow(true)} />
          <ToolButton label="Mooring Lines" onClick={() => setShowMooringLine(true)} />
          <ToolButton label="Stranding Time" onClick={() => setShowStrandingTimer(true)} />
          <ToolButton label="Marina Access" onClick={() => setShowMarinaAccess(true)} />
          <ToolButton label="Fuel Est." onClick={() => setShowFuelEstimator(true)} />
          <ToolButton label="Crew Watch" onClick={() => setShowCrewWatch(true)} />
          <ToolButton label="Waypoints" onClick={() => setShowWaypointRoute(true)} />
          <ToolButton label="Voyage Log" onClick={() => setShowVoyageLog(true)} />
        </div>
      </Section>

      <Section title="Weather & Environment" icon="🌊" count={12}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="Barometric" onClick={() => setShowBarometric(!showBarometric)} active={showBarometric} />
          <ToolButton label="Sea Level Rise" onClick={() => setShowSeaLevelRise(!showSeaLevelRise)} active={showSeaLevelRise} />
          <ToolButton label="Historical" onClick={() => setShowHistorical(!showHistorical)} active={showHistorical} />
          <ToolButton label="Storm Surge" onClick={() => setShowStormSurge(true)} color="amber" />
          <ToolButton label="Weather Sim" onClick={() => setShowWeatherSim(true)} />
          <ToolButton label="Marine Weather" onClick={() => setShowMarineWeather(true)} />
          <ToolButton label="Swell Impact" onClick={() => setShowSwellImpact(true)} />
          <ToolButton label="MSL Tracker" onClick={() => setShowMSLTracker(true)} />
          <ToolButton label="Tidal Energy" onClick={() => setShowEnergy(!showEnergy)} active={showEnergy} />
          <ToolButton label="Tidal Prism" onClick={() => setShowTidalPrism(true)} />
          <ToolButton label="Estuary" onClick={() => setShowEstuary(true)} />
          <ToolButton label="Drying Heights" onClick={() => setShowDryingHeights(true)} />
        </div>
      </Section>

      <Section title="Activities & Recreation" icon="🏄" count={9}>
        <div className="flex flex-wrap gap-1.5">
          <ToolButton label="Beach Access" icon="🏖️" onClick={() => setShowBeachAccess(true)} />
          <ToolButton label="Tidepools" icon="🦀" onClick={() => setShowIntertidal(true)} />
          <ToolButton label="Shellfish" icon="🦪" onClick={() => setShowShellfishPlanner(true)} />
          <ToolButton label="Kayak/SUP" icon="🛶" onClick={() => setShowKayakPlanner(true)} />
          <ToolButton label="Dive Slate" icon="🤿" onClick={() => setShowDiveSlate(true)} />
          <ToolButton label="Coastal Hike" icon="🥾" onClick={() => setShowHikingPlanner(true)} />
          <ToolButton label="Surf" icon="🏄" onClick={() => setShowSurfCalc(true)} />
          <ToolButton label="Photo Timing" icon="📷" onClick={() => setShowPhotoPlanner(true)} />
          <ToolButton label="Fishing" icon="🎣" onClick={() => setShowSolunar(!showSolunar)} active={showSolunar} color="emerald" />
        </div>
      </Section>

      {/* Core visualizations (not lazy) */}
      {showPhasorDiagram && <PhasorDiagram onConstituentClick={setSelectedConstituent} />}
      {showTideCurve && <TideCurve />}

      {/* Lazy-loaded toggle panels */}
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
        onNavigate={setSelectedConstituent}
      />

      {/* Lazy-loaded modals */}
      <Suspense fallback={null}>
        {showDoodsonExplorer && <DoodsonExplorer onClose={() => setShowDoodsonExplorer(false)} />}
        {showPhaseAnimation && <PhaseAnimation onClose={() => setShowPhaseAnimation(false)} />}
        {showExport && <DataExport onClose={() => setShowExport(false)} />}
        {showDatumExplainer && <TidalDatumExplainer onClose={() => setShowDatumExplainer(false)} />}
        {showComparison && <ConstituentComparison onClose={() => setShowComparison(false)} />}
        {showShare && <SharePanel onClose={() => setShowShare(false)} />}
        {showKeyboardHelp && <KeyboardShortcuts onClose={() => setShowKeyboardHelp(false)} />}
        {showQuiz && <ConstituentQuiz onClose={() => setShowQuiz(false)} />}
        {showBoreInfo && <TidalBoreInfo onClose={() => setShowBoreInfo(false)} />}
        {showAnalysis && <HarmonicAnalysisExplainer onClose={() => setShowAnalysis(false)} />}
        {showAmphidromic && <AmphidromicPoints onClose={() => setShowAmphidromic(false)} />}
        {showTidalLoading && <TidalLoadingExplainer onClose={() => setShowTidalLoading(false)} />}
        {showPortTiming && <PortTimingComparison onClose={() => setShowPortTiming(false)} />}
        {showWeatherSim && <WeatherEffectSimulator onClose={() => setShowWeatherSim(false)} />}
        {showEstuary && <EstuaryDynamics onClose={() => setShowEstuary(false)} />}
        {showNavSafety && <NavigationSafety onClose={() => setShowNavSafety(false)} />}
        {showResonance && <TidalResonance onClose={() => setShowResonance(false)} />}
        {showMoonCalendar && <MoonPhaseCalendar onClose={() => setShowMoonCalendar(false)} />}
        {showEmbedWidget && <EmbeddableTideWidget onClose={() => setShowEmbedWidget(false)} />}
        {showDatumConverter && <TidalDatumConverter onClose={() => setShowDatumConverter(false)} />}
        {showBeatPattern && <BeatPatternVisualizer onClose={() => setShowBeatPattern(false)} />}
        {showUKC && <UnderKeelClearance onClose={() => setShowUKC(false)} />}
        {showIntertidal && <IntertidalZoneExplorer onClose={() => setShowIntertidal(false)} />}
        {showPrintTable && <PrintableTideTable onClose={() => setShowPrintTable(false)} />}
        {showSlackWater && <SlackWaterFinder onClose={() => setShowSlackWater(false)} />}
        {showBeachAccess && <BeachAccessPlanner onClose={() => setShowBeachAccess(false)} />}
        {showDateComparison && <TideDateComparison onClose={() => setShowDateComparison(false)} />}
        {showCurrentSpeed && <TidalCurrentSpeed onClose={() => setShowCurrentSpeed(false)} />}
        {showTwelfths && <RuleOfTwelfths onClose={() => setShowTwelfths(false)} />}
        {showTidalWindow && <TidalWindowCalculator onClose={() => setShowTidalWindow(false)} />}
        {showDepthCorrection && <DepthCorrectionTool onClose={() => setShowDepthCorrection(false)} />}
        {showTideType && <TideTypeClassifier onClose={() => setShowTideType(false)} />}
        {showEbbFlood && <EbbFloodAnalyzer onClose={() => setShowEbbFlood(false)} />}
        {showAgeOfTide && <AgeOfTide onClose={() => setShowAgeOfTide(false)} />}
        {showAnchorScope && <AnchorScopeCalculator onClose={() => setShowAnchorScope(false)} />}
        {showTidalPrism && <TidalPrismCalculator onClose={() => setShowTidalPrism(false)} />}
        {showMarinaAccess && <MarinaAccessPlanner onClose={() => setShowMarinaAccess(false)} />}
        {showBridgeClearance && <BridgeClearanceCalculator onClose={() => setShowBridgeClearance(false)} />}
        {showStreamAtlas && <TidalStreamAtlas onClose={() => setShowStreamAtlas(false)} />}
        {showPassagePlanner && <PassagePlannerTide onClose={() => setShowPassagePlanner(false)} />}
        {showFuelEstimator && <FuelConsumptionEstimator onClose={() => setShowFuelEstimator(false)} />}
        {showCrewWatch && <CrewWatchScheduler onClose={() => setShowCrewWatch(false)} />}
        {showWaypointRoute && <WaypointRoutePlanner onClose={() => setShowWaypointRoute(false)} />}
        {showSeasonalTide && <SeasonalTideComparison onClose={() => setShowSeasonalTide(false)} />}
        {showPortApproach && <PortApproachAdvisor onClose={() => setShowPortApproach(false)} />}
        {showDockingWindow && <DockingWindowCalculator onClose={() => setShowDockingWindow(false)} />}
        {showMooringLine && <MooringLineCalculator onClose={() => setShowMooringLine(false)} />}
        {showSwellImpact && <SwellImpactCalculator onClose={() => setShowSwellImpact(false)} />}
        {showVoyageLog && <VoyageLogGenerator onClose={() => setShowVoyageLog(false)} />}
        {showGroundingRisk && <GroundingRiskAnalyzer onClose={() => setShowGroundingRisk(false)} />}
        {showStrandingTimer && <TidalStrandingTimer onClose={() => setShowStrandingTimer(false)} />}
        {showHeightLookup && <TideHeightLookup onClose={() => setShowHeightLookup(false)} />}
        {showLunarDistance && <LunarDistancePanel onClose={() => setShowLunarDistance(false)} />}
        {showEclipseTides && <EclipseTidesPanel onClose={() => setShowEclipseTides(false)} />}
        {showDryingHeights && <DryingHeightsCalculator onClose={() => setShowDryingHeights(false)} />}
        {showStormSurge && <StormSurgeEstimator onClose={() => setShowStormSurge(false)} />}
        {showTidalGate && <TidalGateScheduler onClose={() => setShowTidalGate(false)} />}
        {showCoriolis && <CoriolisEffectPanel onClose={() => setShowCoriolis(false)} />}
        {showMSLTracker && <MeanSeaLevelTracker onClose={() => setShowMSLTracker(false)} />}
        {showTidalRace && <TidalRaceWarning onClose={() => setShowTidalRace(false)} />}
        {showFerryTiming && <FerryTimingOptimizer onClose={() => setShowFerryTiming(false)} />}
        {showGlossary && <TidalGlossary onClose={() => setShowGlossary(false)} />}
        {showMarineWeather && <MarineWeatherPanel onClose={() => setShowMarineWeather(false)} />}
        {showLiveTide && <LiveTideDisplay onClose={() => setShowLiveTide(false)} />}
        {showPhotoPlanner && <PhotoTimingPlanner onClose={() => setShowPhotoPlanner(false)} />}
        {showShellfishPlanner && <ShellfishHarvestPlanner onClose={() => setShowShellfishPlanner(false)} />}
        {showKayakPlanner && <KayakLaunchPlanner onClose={() => setShowKayakPlanner(false)} />}
        {showDiveSlate && <DiveSlateGenerator onClose={() => setShowDiveSlate(false)} />}
        {showHikingPlanner && <CoastalHikingPlanner onClose={() => setShowHikingPlanner(false)} />}
        {showSurfCalc && <SurfConditionsCalculator onClose={() => setShowSurfCalc(false)} />}
      </Suspense>
    </div>
  );
}
