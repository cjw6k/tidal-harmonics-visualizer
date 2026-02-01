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

// Tab types
type TabId = 'charts' | 'predict' | 'learn' | 'nav' | 'plan';

const TABS: { id: TabId; label: string; icon: string; count: number; desc: string }[] = [
  { id: 'charts', label: 'Charts', icon: '📊', count: 18, desc: 'Visualizations and real-time displays' },
  { id: 'predict', label: 'Predict', icon: '📅', count: 18, desc: 'Forecasts, calendars, and export' },
  { id: 'learn', label: 'Learn', icon: '🎓', count: 18, desc: 'Educational content and science' },
  { id: 'nav', label: 'Navigate', icon: '⚓', count: 22, desc: 'Navigation safety and planning' },
  { id: 'plan', label: 'Plan', icon: '🗓️', count: 21, desc: 'Activities, weather, and environment' },
];

// Tool button component
function Btn({
  children,
  onClick,
  active = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2 py-1.5 rounded text-xs transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

export function HarmonicsPanel() {
  const showPhasorDiagram = useHarmonicsStore((s) => s.showPhasorDiagram);
  const showTideCurve = useHarmonicsStore((s) => s.showTideCurve);
  const togglePhasorDiagram = useHarmonicsStore((s) => s.togglePhasorDiagram);
  const toggleTideCurve = useHarmonicsStore((s) => s.toggleTideCurve);

  const [selectedConstituent, setSelectedConstituent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('charts');

  // All modal/panel states
  const [showAccuracyComparison, setShowAccuracyComparison] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [showPhaseAnimation, setShowPhaseAnimation] = useState(false);
  const [showWaterShader, setShowWaterShader] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showBeatPattern, setShowBeatPattern] = useState(false);
  const [showLiveTide, setShowLiveTide] = useState(false);
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
  const [showBeachAccess, setShowBeachAccess] = useState(false);
  const [showIntertidal, setShowIntertidal] = useState(false);
  const [showShellfishPlanner, setShowShellfishPlanner] = useState(false);
  const [showKayakPlanner, setShowKayakPlanner] = useState(false);
  const [showDiveSlate, setShowDiveSlate] = useState(false);
  const [showHikingPlanner, setShowHikingPlanner] = useState(false);
  const [showSurfCalc, setShowSurfCalc] = useState(false);
  const [showPhotoPlanner, setShowPhotoPlanner] = useState(false);
  const [showSolunar, setShowSolunar] = useState(false);

  // Render tools for the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'charts':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={togglePhasorDiagram} active={showPhasorDiagram}>Phasor</Btn>
            <Btn onClick={toggleTideCurve} active={showTideCurve}>Curve</Btn>
            <Btn onClick={() => setShowAccuracyComparison(!showAccuracyComparison)} active={showAccuracyComparison}>Accuracy</Btn>
            <Btn onClick={() => setShowWaveform(!showWaveform)} active={showWaveform}>Waves</Btn>
            <Btn onClick={() => setShowSpectrum(!showSpectrum)} active={showSpectrum}>Spectrum</Btn>
            <Btn onClick={() => setShowTimeline(!showTimeline)} active={showTimeline}>Timeline</Btn>
            <Btn onClick={() => setShowClock(!showClock)} active={showClock}>Clock</Btn>
            <Btn onClick={() => setShowPhaseAnimation(true)}>▶ Phase</Btn>
            <Btn onClick={() => setShowBeatPattern(true)}>Beats</Btn>
            <Btn onClick={() => setShowWaterShader(!showWaterShader)} active={showWaterShader}>Water FX</Btn>
            <Btn onClick={() => setShowLiveTide(true)}>Live</Btn>
            <Btn onClick={() => setShowTideRate(!showTideRate)} active={showTideRate}>Rate</Btn>
            <Btn onClick={() => setShowStationComparison(!showStationComparison)} active={showStationComparison}>Compare</Btn>
            <Btn onClick={() => setShowRangeChart(!showRangeChart)} active={showRangeChart}>Ranges</Btn>
            <Btn onClick={() => setShowPieChart(!showPieChart)} active={showPieChart}>Pie</Btn>
            <Btn onClick={() => setShowFamilies(!showFamilies)} active={showFamilies}>Families</Btn>
            <Btn onClick={() => setShowTable(!showTable)} active={showTable}>Table</Btn>
            <Btn onClick={() => setShowMap(!showMap)} active={showMap}>🗺️ Map</Btn>
          </div>
        );

      case 'predict':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowExtremes(!showExtremes)} active={showExtremes}>Hi/Lo</Btn>
            <Btn onClick={() => setShowKingTidePredictor(!showKingTidePredictor)} active={showKingTidePredictor}>👑 King</Btn>
            <Btn onClick={() => setShowCalendar(!showCalendar)} active={showCalendar}>Calendar</Btn>
            <Btn onClick={() => setShowMoonCalendar(true)}>🌙 Moon</Btn>
            <Btn onClick={() => setShowNodal(!showNodal)} active={showNodal}>18.6yr</Btn>
            <Btn onClick={() => setShowSeasonalTide(true)}>Seasonal</Btn>
            <Btn onClick={() => setShowDateComparison(true)}>Compare</Btn>
            <Btn onClick={() => setShowHeightLookup(true)}>Lookup</Btn>
            <Btn onClick={() => setShowTidalWindow(true)}>Windows</Btn>
            <Btn onClick={() => setShowAlerts(!showAlerts)} active={showAlerts}>🔔 Alerts</Btn>
            <Btn onClick={() => setShowLunar(!showLunar)} active={showLunar}>Phase</Btn>
            <Btn onClick={() => setShowCoefficient(!showCoefficient)} active={showCoefficient}>Coef</Btn>
            <Btn onClick={() => setShowTideType(true)}>Type</Btn>
            <Btn onClick={() => setShowEbbFlood(true)}>Ebb/Flood</Btn>
            <Btn onClick={() => setShowExport(true)}>↓ Export</Btn>
            <Btn onClick={() => setShowPrintTable(true)}>🖨️ Print</Btn>
            <Btn onClick={() => setShowShare(true)}>🔗 Share</Btn>
            <Btn onClick={() => setShowEmbedWidget(true)}>Embed</Btn>
          </div>
        );

      case 'learn':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowDoodsonExplorer(true)}>Doodson #</Btn>
            <Btn onClick={() => setShowDatumExplainer(true)}>Datums</Btn>
            <Btn onClick={() => setShowAnalysis(true)}>Analysis</Btn>
            <Btn onClick={() => setShowBoreInfo(true)}>Bores</Btn>
            <Btn onClick={() => setShowAmphidromic(true)}>Amphidromic</Btn>
            <Btn onClick={() => setShowTidalLoading(true)}>Loading</Btn>
            <Btn onClick={() => setShowResonance(true)}>Resonance</Btn>
            <Btn onClick={() => setShowCoriolis(true)}>Coriolis</Btn>
            <Btn onClick={() => setShowLunarDistance(true)}>🌙 Distance</Btn>
            <Btn onClick={() => setShowEclipseTides(true)}>Eclipses</Btn>
            <Btn onClick={() => setShowTwelfths(true)}>Rule of 12</Btn>
            <Btn onClick={() => setShowAgeOfTide(true)}>Age</Btn>
            <Btn onClick={() => setShowPortTiming(true)}>Port Time</Btn>
            <Btn onClick={() => setShowDatumConverter(true)}>Convert</Btn>
            <Btn onClick={() => setShowComparison(true)}>Compare</Btn>
            <Btn onClick={() => setShowQuiz(true)}>🎓 Quiz</Btn>
            <Btn onClick={() => setShowGlossary(true)}>📖 Glossary</Btn>
            <Btn onClick={() => setShowKeyboardHelp(true)}>⌨ Keys</Btn>
          </div>
        );

      case 'nav':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowNavSafety(true)}>Safety</Btn>
            <Btn onClick={() => setShowUKC(true)}>Under Keel</Btn>
            <Btn onClick={() => setShowBridgeClearance(true)}>🌉 Bridge</Btn>
            <Btn onClick={() => setShowAnchorScope(true)}>⚓ Anchor</Btn>
            <Btn onClick={() => setShowGroundingRisk(true)}>⚠️ Ground</Btn>
            <Btn onClick={() => setShowStreamAtlas(true)}>Streams</Btn>
            <Btn onClick={() => setShowPassagePlanner(true)}>Passage</Btn>
            <Btn onClick={() => setShowDepthCorrection(true)}>Depth</Btn>
            <Btn onClick={() => setShowSlackWater(true)}>Slack</Btn>
            <Btn onClick={() => setShowCurrentSpeed(true)}>Current</Btn>
            <Btn onClick={() => setShowTidalGate(true)}>Gates</Btn>
            <Btn onClick={() => setShowTidalRace(true)}>⚡ Races</Btn>
            <Btn onClick={() => setShowFerryTiming(true)}>⛴️ Ferry</Btn>
            <Btn onClick={() => setShowPortApproach(true)}>🚢 Port</Btn>
            <Btn onClick={() => setShowDockingWindow(true)}>Dock</Btn>
            <Btn onClick={() => setShowMooringLine(true)}>Mooring</Btn>
            <Btn onClick={() => setShowStrandingTimer(true)}>Strand</Btn>
            <Btn onClick={() => setShowMarinaAccess(true)}>Marina</Btn>
            <Btn onClick={() => setShowFuelEstimator(true)}>⛽ Fuel</Btn>
            <Btn onClick={() => setShowCrewWatch(true)}>Watch</Btn>
            <Btn onClick={() => setShowWaypointRoute(true)}>📍 Route</Btn>
            <Btn onClick={() => setShowVoyageLog(true)}>📋 Log</Btn>
          </div>
        );

      case 'plan':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowBeachAccess(true)}>🏖️ Beach</Btn>
            <Btn onClick={() => setShowIntertidal(true)}>🦀 Tidepool</Btn>
            <Btn onClick={() => setShowShellfishPlanner(true)}>🦪 Shellfish</Btn>
            <Btn onClick={() => setShowKayakPlanner(true)}>🛶 Kayak</Btn>
            <Btn onClick={() => setShowDiveSlate(true)}>🤿 Dive</Btn>
            <Btn onClick={() => setShowHikingPlanner(true)}>🥾 Hike</Btn>
            <Btn onClick={() => setShowSurfCalc(true)}>🏄 Surf</Btn>
            <Btn onClick={() => setShowPhotoPlanner(true)}>📷 Photo</Btn>
            <Btn onClick={() => setShowSolunar(!showSolunar)} active={showSolunar}>🎣 Fish</Btn>
            <Btn onClick={() => setShowBarometric(!showBarometric)} active={showBarometric}>Pressure</Btn>
            <Btn onClick={() => setShowSeaLevelRise(!showSeaLevelRise)} active={showSeaLevelRise}>Sea Rise</Btn>
            <Btn onClick={() => setShowHistorical(!showHistorical)} active={showHistorical}>Records</Btn>
            <Btn onClick={() => setShowStormSurge(true)}>⛈️ Storm</Btn>
            <Btn onClick={() => setShowWeatherSim(true)}>Weather</Btn>
            <Btn onClick={() => setShowMarineWeather(true)}>Marine Wx</Btn>
            <Btn onClick={() => setShowSwellImpact(true)}>🌊 Swell</Btn>
            <Btn onClick={() => setShowMSLTracker(true)}>MSL</Btn>
            <Btn onClick={() => setShowEnergy(!showEnergy)} active={showEnergy}>Energy</Btn>
            <Btn onClick={() => setShowTidalPrism(true)}>Prism</Btn>
            <Btn onClick={() => setShowEstuary(true)}>Estuary</Btn>
            <Btn onClick={() => setShowDryingHeights(true)}>Drying</Btn>
          </div>
        );
    }
  };

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col gap-2 z-10 w-[320px] sm:w-[360px] max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-1">
      {/* Station & Current Conditions */}
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

      {/* Constituents */}
      <ConstituentToggles />

      {/* Tab Navigation */}
      <div className="bg-slate-800/90 backdrop-blur rounded-lg overflow-hidden">
        <div
          className="flex border-b border-slate-700"
          role="tablist"
          aria-label="Tool categories"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                const currentIndex = TABS.findIndex(t => t.id === activeTab);
                let newIndex = currentIndex;
                if (e.key === 'ArrowRight') {
                  newIndex = (currentIndex + 1) % TABS.length;
                } else if (e.key === 'ArrowLeft') {
                  newIndex = (currentIndex - 1 + TABS.length) % TABS.length;
                } else if (e.key === 'Home') {
                  newIndex = 0;
                } else if (e.key === 'End') {
                  newIndex = TABS.length - 1;
                } else {
                  return;
                }
                const newTab = TABS[newIndex];
                if (newTab) {
                  setActiveTab(newTab.id);
                  (e.currentTarget.parentElement?.children[newIndex] as HTMLElement)?.focus();
                }
              }}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span className="block" aria-hidden="true">{tab.icon}</span>
              <span className="block mt-0.5">{tab.label}</span>
              <span className={`block text-[10px] ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div
          key={activeTab}
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="p-3"
          style={{ animation: 'fadeIn 150ms ease-out' }}
        >
          <p className="text-xs text-slate-500 mb-2">
            {TABS.find(t => t.id === activeTab)?.desc}
          </p>
          {renderTabContent()}
        </div>
      </div>

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
