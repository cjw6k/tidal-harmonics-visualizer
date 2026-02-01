import { useState, lazy, Suspense, useMemo, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// LocalStorage keys
const RECENT_TOOLS_KEY = 'tidal-harmonics-recent-tools';
const MAX_RECENT_TOOLS = 6;
const PANEL_MINIMIZED_KEY = 'tidal-harmonics-panel-minimized';
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

// Tool definitions for search
interface ToolDef {
  id: string;
  label: string;
  tooltip: string;
  tab: TabId;
  keywords: string[];
}

const TOOLS: ToolDef[] = [
  // Charts
  { id: 'phasor', label: 'Phasor', tooltip: 'Rotating vector diagram showing constituent phases', tab: 'charts', keywords: ['vector', 'diagram', 'rotation', 'phase'] },
  { id: 'curve', label: 'Curve', tooltip: 'Predicted tide height curve over time', tab: 'charts', keywords: ['height', 'prediction', 'graph', 'tide'] },
  { id: 'accuracy', label: 'Accuracy', tooltip: 'Compare predictions with observed data', tab: 'charts', keywords: ['compare', 'observed', 'validation'] },
  { id: 'waves', label: 'Waves', tooltip: 'Individual constituent waveforms combined', tab: 'charts', keywords: ['waveform', 'decomposition', 'sine'] },
  { id: 'spectrum', label: 'Spectrum', tooltip: 'Frequency spectrum of tidal constituents', tab: 'charts', keywords: ['frequency', 'fft', 'analysis'] },
  { id: 'timeline', label: 'Timeline', tooltip: 'Horizontal timeline with tide heights', tab: 'charts', keywords: ['horizontal', 'time'] },
  { id: 'clock', label: 'Clock', tooltip: 'Analog clock face showing tide state', tab: 'charts', keywords: ['analog', 'time', 'display'] },
  { id: 'phase', label: '▶ Phase', tooltip: 'Animated constituent rotation', tab: 'charts', keywords: ['animation', 'rotation', 'play'] },
  { id: 'beats', label: 'Beats', tooltip: 'Beat patterns from constituent interaction', tab: 'charts', keywords: ['pattern', 'interaction', 'interference'] },
  { id: 'waterFx', label: 'Water FX', tooltip: '3D water surface visualization', tab: 'charts', keywords: ['3d', 'shader', 'surface', 'visualization'] },
  { id: 'live', label: 'Live', tooltip: 'Real-time tide display', tab: 'charts', keywords: ['realtime', 'current', 'now'] },
  { id: 'rate', label: 'Rate', tooltip: 'Rate of tide change (rising/falling)', tab: 'charts', keywords: ['rising', 'falling', 'change', 'speed'] },
  { id: 'compare', label: 'Compare', tooltip: 'Compare multiple tide stations', tab: 'charts', keywords: ['station', 'multiple', 'comparison'] },
  { id: 'ranges', label: 'Ranges', tooltip: 'Chart of tidal ranges over time', tab: 'charts', keywords: ['range', 'amplitude'] },
  { id: 'pie', label: 'Pie', tooltip: 'Pie chart of constituent amplitudes', tab: 'charts', keywords: ['chart', 'amplitude', 'proportion'] },
  { id: 'families', label: 'Families', tooltip: 'Constituents grouped by family', tab: 'charts', keywords: ['group', 'lunar', 'solar'] },
  { id: 'table', label: 'Table', tooltip: 'Sortable table of all constituents', tab: 'charts', keywords: ['list', 'data', 'sortable'] },
  { id: 'map', label: '🗺️ Map', tooltip: 'Map of tide stations', tab: 'charts', keywords: ['location', 'station', 'geographic'] },
  // Predict
  { id: 'hilo', label: 'Hi/Lo', tooltip: 'High and low tide predictions', tab: 'predict', keywords: ['high', 'low', 'extremes', 'prediction'] },
  { id: 'king', label: '👑 King', tooltip: 'Predict extreme king tides', tab: 'predict', keywords: ['extreme', 'perigean', 'spring'] },
  { id: 'calendar', label: 'Calendar', tooltip: 'Spring/neap tide calendar', tab: 'predict', keywords: ['spring', 'neap', 'schedule'] },
  { id: 'moon', label: '🌙 Moon', tooltip: 'Moon phase calendar', tab: 'predict', keywords: ['lunar', 'phase', 'full', 'new'] },
  { id: 'nodal', label: '18.6yr', tooltip: '18.6-year lunar nodal cycle corrections', tab: 'predict', keywords: ['nodal', 'correction', 'long-term'] },
  { id: 'seasonal', label: 'Seasonal', tooltip: 'Compare tides across seasons', tab: 'predict', keywords: ['season', 'summer', 'winter'] },
  { id: 'dateCompare', label: 'Compare', tooltip: 'Compare tides on different dates', tab: 'predict', keywords: ['date', 'comparison'] },
  { id: 'lookup', label: 'Lookup', tooltip: 'Find tide height at specific time', tab: 'predict', keywords: ['search', 'find', 'height', 'time'] },
  { id: 'windows', label: 'Windows', tooltip: 'Calculate safe tidal windows', tab: 'predict', keywords: ['safe', 'window', 'timing'] },
  { id: 'alerts', label: '🔔 Alerts', tooltip: 'Set tide level alerts', tab: 'predict', keywords: ['notification', 'warning', 'alarm'] },
  { id: 'lunarPhase', label: 'Phase', tooltip: 'Current lunar phase display', tab: 'predict', keywords: ['moon', 'lunar', 'current'] },
  { id: 'coef', label: 'Coef', tooltip: 'Tidal coefficients (French system)', tab: 'predict', keywords: ['coefficient', 'french', 'brest'] },
  { id: 'type', label: 'Type', tooltip: 'Classify tide type (diurnal/semidiurnal)', tab: 'predict', keywords: ['diurnal', 'semidiurnal', 'mixed', 'classification'] },
  { id: 'ebbFlood', label: 'Ebb/Flood', tooltip: 'Analyze ebb and flood patterns', tab: 'predict', keywords: ['ebb', 'flood', 'current', 'flow'] },
  { id: 'export', label: '↓ Export', tooltip: 'Export tide data (CSV, JSON)', tab: 'predict', keywords: ['download', 'csv', 'json', 'data'] },
  { id: 'print', label: '🖨️ Print', tooltip: 'Print-friendly tide table', tab: 'predict', keywords: ['print', 'table', 'paper'] },
  { id: 'share', label: '🔗 Share', tooltip: 'Share link to this view', tab: 'predict', keywords: ['link', 'url', 'share'] },
  { id: 'embed', label: 'Embed', tooltip: 'Embeddable widget for websites', tab: 'predict', keywords: ['widget', 'iframe', 'website'] },
  // Learn
  { id: 'doodson', label: 'Doodson #', tooltip: 'Interactive Doodson number breakdown', tab: 'learn', keywords: ['doodson', 'number', 'code'] },
  { id: 'datums', label: 'Datums', tooltip: 'Tidal datum reference levels explained', tab: 'learn', keywords: ['datum', 'reference', 'mllw', 'mhhw'] },
  { id: 'analysis', label: 'Analysis', tooltip: 'How harmonic analysis works', tab: 'learn', keywords: ['harmonic', 'fourier', 'math'] },
  { id: 'bores', label: 'Bores', tooltip: 'Tidal bores around the world', tab: 'learn', keywords: ['bore', 'wave', 'river'] },
  { id: 'amphidromic', label: 'Amphidromic', tooltip: 'Amphidromic points and cotidal lines', tab: 'learn', keywords: ['amphidrome', 'cotidal', 'rotation'] },
  { id: 'loading', label: 'Loading', tooltip: 'Earth deformation from tidal loading', tab: 'learn', keywords: ['earth', 'deformation', 'crustal'] },
  { id: 'resonance', label: 'Resonance', tooltip: 'Tidal resonance in basins', tab: 'learn', keywords: ['basin', 'resonance', 'amplification'] },
  { id: 'coriolis', label: 'Coriolis', tooltip: 'Coriolis effect on tides', tab: 'learn', keywords: ['coriolis', 'rotation', 'earth'] },
  { id: 'lunarDist', label: '🌙 Distance', tooltip: 'Moon distance and tidal forcing', tab: 'learn', keywords: ['perigee', 'apogee', 'distance', 'forcing'] },
  { id: 'eclipse', label: 'Eclipses', tooltip: 'How eclipses affect tides', tab: 'learn', keywords: ['eclipse', 'solar', 'lunar'] },
  { id: 'twelfths', label: 'Rule of 12', tooltip: 'Rule of Twelfths for tide estimation', tab: 'learn', keywords: ['twelfths', 'estimation', 'rule'] },
  { id: 'age', label: 'Age', tooltip: 'Lag between moon phase and tide', tab: 'learn', keywords: ['age', 'lag', 'delay'] },
  { id: 'portTime', label: 'Port Time', tooltip: 'Compare high water times at ports', tab: 'learn', keywords: ['port', 'high water', 'time difference'] },
  { id: 'convert', label: 'Convert', tooltip: 'Convert between tidal datums', tab: 'learn', keywords: ['convert', 'datum', 'transformation'] },
  { id: 'constituentCompare', label: 'Compare', tooltip: 'Side-by-side constituent comparison', tab: 'learn', keywords: ['constituent', 'comparison', 'side by side'] },
  { id: 'quiz', label: '🎓 Quiz', tooltip: 'Test your tidal knowledge', tab: 'learn', keywords: ['quiz', 'test', 'learn', 'game'] },
  { id: 'glossary', label: '📖 Glossary', tooltip: 'Tidal terminology glossary', tab: 'learn', keywords: ['glossary', 'terms', 'definitions'] },
  { id: 'keys', label: '⌨ Keys', tooltip: 'Keyboard shortcuts', tab: 'learn', keywords: ['keyboard', 'shortcuts', 'hotkeys'] },
  // Navigate
  { id: 'safety', label: 'Safety', tooltip: 'Navigation safety overview', tab: 'nav', keywords: ['safety', 'navigation', 'overview'] },
  { id: 'ukc', label: 'Under Keel', tooltip: 'Under-keel clearance calculator', tab: 'nav', keywords: ['under keel', 'clearance', 'draft', 'ukc'] },
  { id: 'bridge', label: '🌉 Bridge', tooltip: 'Bridge clearance calculator', tab: 'nav', keywords: ['bridge', 'clearance', 'height', 'mast'] },
  { id: 'anchor', label: '⚓ Anchor', tooltip: 'Anchor scope calculator', tab: 'nav', keywords: ['anchor', 'scope', 'chain', 'rode'] },
  { id: 'ground', label: '⚠️ Ground', tooltip: 'Grounding risk analysis', tab: 'nav', keywords: ['grounding', 'risk', 'shallow'] },
  { id: 'streams', label: 'Streams', tooltip: 'Tidal stream atlas', tab: 'nav', keywords: ['stream', 'atlas', 'current'] },
  { id: 'passage', label: 'Passage', tooltip: 'Tide-aware passage planner', tab: 'nav', keywords: ['passage', 'plan', 'route'] },
  { id: 'depth', label: 'Depth', tooltip: 'Chart depth correction tool', tab: 'nav', keywords: ['depth', 'correction', 'chart'] },
  { id: 'slack', label: 'Slack', tooltip: 'Find slack water times', tab: 'nav', keywords: ['slack', 'water', 'current', 'zero'] },
  { id: 'current', label: 'Current', tooltip: 'Tidal current speed calculator', tab: 'nav', keywords: ['current', 'speed', 'velocity'] },
  { id: 'gates', label: 'Gates', tooltip: 'Tidal gate/barrier schedules', tab: 'nav', keywords: ['gate', 'barrier', 'lock'] },
  { id: 'races', label: '⚡ Races', tooltip: 'Tidal race warnings', tab: 'nav', keywords: ['race', 'overfalls', 'dangerous'] },
  { id: 'ferry', label: '⛴️ Ferry', tooltip: 'Ferry timing optimization', tab: 'nav', keywords: ['ferry', 'crossing', 'timing'] },
  { id: 'port', label: '🚢 Port', tooltip: 'Port approach advisor', tab: 'nav', keywords: ['port', 'approach', 'entry'] },
  { id: 'dock', label: 'Dock', tooltip: 'Calculate docking windows', tab: 'nav', keywords: ['dock', 'berth', 'window'] },
  { id: 'mooring', label: 'Mooring', tooltip: 'Mooring line length calculator', tab: 'nav', keywords: ['mooring', 'line', 'rope'] },
  { id: 'strand', label: 'Strand', tooltip: 'Stranding countdown timer', tab: 'nav', keywords: ['stranding', 'aground', 'timer'] },
  { id: 'marina', label: 'Marina', tooltip: 'Marina access times', tab: 'nav', keywords: ['marina', 'access', 'entry'] },
  { id: 'fuel', label: '⛽ Fuel', tooltip: 'Tide-adjusted fuel consumption', tab: 'nav', keywords: ['fuel', 'consumption', 'economy'] },
  { id: 'watch', label: 'Watch', tooltip: 'Crew watch scheduler', tab: 'nav', keywords: ['watch', 'crew', 'schedule'] },
  { id: 'route', label: '📍 Route', tooltip: 'Waypoint route planner', tab: 'nav', keywords: ['waypoint', 'route', 'navigation'] },
  { id: 'log', label: '📋 Log', tooltip: 'Generate voyage log', tab: 'nav', keywords: ['voyage', 'log', 'record'] },
  // Plan
  { id: 'beach', label: '🏖️ Beach', tooltip: 'Beach access planner', tab: 'plan', keywords: ['beach', 'access', 'sand'] },
  { id: 'tidepool', label: '🦀 Tidepool', tooltip: 'Tidepool exploration times', tab: 'plan', keywords: ['tidepool', 'intertidal', 'explore'] },
  { id: 'shellfish', label: '🦪 Shellfish', tooltip: 'Shellfish harvesting planner', tab: 'plan', keywords: ['shellfish', 'clam', 'harvest', 'oyster'] },
  { id: 'kayak', label: '🛶 Kayak', tooltip: 'Kayak launch planner', tab: 'plan', keywords: ['kayak', 'launch', 'paddle'] },
  { id: 'dive', label: '🤿 Dive', tooltip: 'Generate dive slate', tab: 'plan', keywords: ['dive', 'scuba', 'slate'] },
  { id: 'hike', label: '🥾 Hike', tooltip: 'Coastal hiking planner', tab: 'plan', keywords: ['hike', 'coastal', 'trail'] },
  { id: 'surf', label: '🏄 Surf', tooltip: 'Surf conditions calculator', tab: 'plan', keywords: ['surf', 'wave', 'swell'] },
  { id: 'photo', label: '📷 Photo', tooltip: 'Photography timing planner', tab: 'plan', keywords: ['photo', 'photography', 'golden hour'] },
  { id: 'fish', label: '🎣 Fish', tooltip: 'Solunar fishing activity', tab: 'plan', keywords: ['fishing', 'solunar', 'bite'] },
  { id: 'pressure', label: 'Pressure', tooltip: 'Barometric pressure effects', tab: 'plan', keywords: ['pressure', 'barometric', 'weather'] },
  { id: 'seaRise', label: 'Sea Rise', tooltip: 'Sea level rise projections', tab: 'plan', keywords: ['sea level', 'rise', 'climate'] },
  { id: 'records', label: 'Records', tooltip: 'Historical tide extremes', tab: 'plan', keywords: ['historical', 'record', 'extreme'] },
  { id: 'storm', label: '⛈️ Storm', tooltip: 'Storm surge estimator', tab: 'plan', keywords: ['storm', 'surge', 'hurricane'] },
  { id: 'weather', label: 'Weather', tooltip: 'Weather effect simulator', tab: 'plan', keywords: ['weather', 'wind', 'effect'] },
  { id: 'marineWx', label: 'Marine Wx', tooltip: 'Marine weather panel', tab: 'plan', keywords: ['marine', 'weather', 'forecast'] },
  { id: 'swell', label: '🌊 Swell', tooltip: 'Swell impact calculator', tab: 'plan', keywords: ['swell', 'wave', 'impact'] },
  { id: 'msl', label: 'MSL', tooltip: 'Mean sea level tracker', tab: 'plan', keywords: ['mean sea level', 'msl', 'average'] },
  { id: 'energy', label: 'Energy', tooltip: 'Tidal energy calculator', tab: 'plan', keywords: ['energy', 'power', 'tidal'] },
  { id: 'prism', label: 'Prism', tooltip: 'Tidal prism calculator', tab: 'plan', keywords: ['prism', 'volume', 'estuary'] },
  { id: 'estuary', label: 'Estuary', tooltip: 'Estuary dynamics', tab: 'plan', keywords: ['estuary', 'dynamics', 'river'] },
  { id: 'drying', label: 'Drying', tooltip: 'Drying heights calculator', tab: 'plan', keywords: ['drying', 'height', 'exposed'] },
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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Panel minimized state
  const [isPanelMinimized, setIsPanelMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PANEL_MINIMIZED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Toggle panel minimized state
  const togglePanelMinimized = useCallback(() => {
    setIsPanelMinimized(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(PANEL_MINIMIZED_KEY, String(newValue));
      } catch {
        // Ignore storage errors
      }
      return newValue;
    });
  }, []);

  // Recently used tools
  const [recentTools, setRecentTools] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_TOOLS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Add tool to recent list
  const addToRecent = useCallback((toolId: string) => {
    setRecentTools(prev => {
      const filtered = prev.filter(id => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, MAX_RECENT_TOOLS);
      try {
        localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  // Get recent tool objects
  const recentToolObjects = useMemo(() => {
    return recentTools
      .map(id => TOOLS.find(t => t.id === id))
      .filter((t): t is ToolDef => t !== undefined);
  }, [recentTools]);

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return TOOLS.filter(tool =>
      tool.label.toLowerCase().includes(query) ||
      tool.tooltip.toLowerCase().includes(query) ||
      tool.keywords.some(kw => kw.includes(query))
    );
  }, [searchQuery]);

  // Clear search when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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

  // Count open panels
  const openPanelCount = useMemo(() => {
    const panels = [
      showPhasorDiagram, showTideCurve, showAccuracyComparison, showWaveform,
      showSpectrum, showTimeline, showClock, showBeatPattern, showWaterShader,
      showLiveTide, showTideRate, showStationComparison, showRangeChart,
      showPieChart, showFamilies, showTable, showMap, showExtremes,
      showKingTidePredictor, showCalendar, showNodal, showAlerts, showLunar,
      showCoefficient, showSeaLevelRise, showHistorical, showEnergy, showBarometric,
      showSolunar,
    ];
    return panels.filter(Boolean).length;
  }, [
    showPhasorDiagram, showTideCurve, showAccuracyComparison, showWaveform,
    showSpectrum, showTimeline, showClock, showBeatPattern, showWaterShader,
    showLiveTide, showTideRate, showStationComparison, showRangeChart,
    showPieChart, showFamilies, showTable, showMap, showExtremes,
    showKingTidePredictor, showCalendar, showNodal, showAlerts, showLunar,
    showCoefficient, showSeaLevelRise, showHistorical, showEnergy, showBarometric,
    showSolunar,
  ]);

  // Close all toggle panels
  const closeAllPanels = useCallback(() => {
    // Close store-managed panels
    if (showPhasorDiagram) togglePhasorDiagram();
    if (showTideCurve) toggleTideCurve();
    // Close local state panels
    setShowAccuracyComparison(false);
    setShowWaveform(false);
    setShowSpectrum(false);
    setShowTimeline(false);
    setShowClock(false);
    setShowBeatPattern(false);
    setShowWaterShader(false);
    setShowLiveTide(false);
    setShowTideRate(false);
    setShowStationComparison(false);
    setShowRangeChart(false);
    setShowPieChart(false);
    setShowFamilies(false);
    setShowTable(false);
    setShowMap(false);
    setShowExtremes(false);
    setShowKingTidePredictor(false);
    setShowCalendar(false);
    setShowNodal(false);
    setShowAlerts(false);
    setShowLunar(false);
    setShowCoefficient(false);
    setShowSeaLevelRise(false);
    setShowHistorical(false);
    setShowEnergy(false);
    setShowBarometric(false);
    setShowSolunar(false);
  }, [showPhasorDiagram, showTideCurve, togglePhasorDiagram, toggleTideCurve]);

  // Handle tool activation from search
  const handleToolClick = (toolId: string) => {
    setSearchQuery('');
    const toolActions: Record<string, () => void> = {
      // Charts
      phasor: togglePhasorDiagram,
      curve: toggleTideCurve,
      accuracy: () => setShowAccuracyComparison(!showAccuracyComparison),
      waves: () => setShowWaveform(!showWaveform),
      spectrum: () => setShowSpectrum(!showSpectrum),
      timeline: () => setShowTimeline(!showTimeline),
      clock: () => setShowClock(!showClock),
      phase: () => setShowPhaseAnimation(true),
      beats: () => setShowBeatPattern(true),
      waterFx: () => setShowWaterShader(!showWaterShader),
      live: () => setShowLiveTide(true),
      rate: () => setShowTideRate(!showTideRate),
      compare: () => setShowStationComparison(!showStationComparison),
      ranges: () => setShowRangeChart(!showRangeChart),
      pie: () => setShowPieChart(!showPieChart),
      families: () => setShowFamilies(!showFamilies),
      table: () => setShowTable(!showTable),
      map: () => setShowMap(!showMap),
      // Predict
      hilo: () => setShowExtremes(!showExtremes),
      king: () => setShowKingTidePredictor(!showKingTidePredictor),
      calendar: () => setShowCalendar(!showCalendar),
      moon: () => setShowMoonCalendar(true),
      nodal: () => setShowNodal(!showNodal),
      seasonal: () => setShowSeasonalTide(true),
      dateCompare: () => setShowDateComparison(true),
      lookup: () => setShowHeightLookup(true),
      windows: () => setShowTidalWindow(true),
      alerts: () => setShowAlerts(!showAlerts),
      lunarPhase: () => setShowLunar(!showLunar),
      coef: () => setShowCoefficient(!showCoefficient),
      type: () => setShowTideType(true),
      ebbFlood: () => setShowEbbFlood(true),
      export: () => setShowExport(true),
      print: () => setShowPrintTable(true),
      share: () => setShowShare(true),
      embed: () => setShowEmbedWidget(true),
      // Learn
      doodson: () => setShowDoodsonExplorer(true),
      datums: () => setShowDatumExplainer(true),
      analysis: () => setShowAnalysis(true),
      bores: () => setShowBoreInfo(true),
      amphidromic: () => setShowAmphidromic(true),
      loading: () => setShowTidalLoading(true),
      resonance: () => setShowResonance(true),
      coriolis: () => setShowCoriolis(true),
      lunarDist: () => setShowLunarDistance(true),
      eclipse: () => setShowEclipseTides(true),
      twelfths: () => setShowTwelfths(true),
      age: () => setShowAgeOfTide(true),
      portTime: () => setShowPortTiming(true),
      convert: () => setShowDatumConverter(true),
      constituentCompare: () => setShowComparison(true),
      quiz: () => setShowQuiz(true),
      glossary: () => setShowGlossary(true),
      keys: () => setShowKeyboardHelp(true),
      // Nav
      safety: () => setShowNavSafety(true),
      ukc: () => setShowUKC(true),
      bridge: () => setShowBridgeClearance(true),
      anchor: () => setShowAnchorScope(true),
      ground: () => setShowGroundingRisk(true),
      streams: () => setShowStreamAtlas(true),
      passage: () => setShowPassagePlanner(true),
      depth: () => setShowDepthCorrection(true),
      slack: () => setShowSlackWater(true),
      current: () => setShowCurrentSpeed(true),
      gates: () => setShowTidalGate(true),
      races: () => setShowTidalRace(true),
      ferry: () => setShowFerryTiming(true),
      port: () => setShowPortApproach(true),
      dock: () => setShowDockingWindow(true),
      mooring: () => setShowMooringLine(true),
      strand: () => setShowStrandingTimer(true),
      marina: () => setShowMarinaAccess(true),
      fuel: () => setShowFuelEstimator(true),
      watch: () => setShowCrewWatch(true),
      route: () => setShowWaypointRoute(true),
      log: () => setShowVoyageLog(true),
      // Plan
      beach: () => setShowBeachAccess(true),
      tidepool: () => setShowIntertidal(true),
      shellfish: () => setShowShellfishPlanner(true),
      kayak: () => setShowKayakPlanner(true),
      dive: () => setShowDiveSlate(true),
      hike: () => setShowHikingPlanner(true),
      surf: () => setShowSurfCalc(true),
      photo: () => setShowPhotoPlanner(true),
      fish: () => setShowSolunar(!showSolunar),
      pressure: () => setShowBarometric(!showBarometric),
      seaRise: () => setShowSeaLevelRise(!showSeaLevelRise),
      records: () => setShowHistorical(!showHistorical),
      storm: () => setShowStormSurge(true),
      weather: () => setShowWeatherSim(true),
      marineWx: () => setShowMarineWeather(true),
      swell: () => setShowSwellImpact(true),
      msl: () => setShowMSLTracker(true),
      energy: () => setShowEnergy(!showEnergy),
      prism: () => setShowTidalPrism(true),
      estuary: () => setShowEstuary(true),
      drying: () => setShowDryingHeights(true),
    };
    const action = toolActions[toolId];
    if (action) {
      action();
      addToRecent(toolId);
    }
  };

  // Render tools for the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'charts':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={togglePhasorDiagram} active={showPhasorDiagram} title="Rotating vector diagram showing constituent phases">Phasor</Btn>
            <Btn onClick={toggleTideCurve} active={showTideCurve} title="Predicted tide height curve over time">Curve</Btn>
            <Btn onClick={() => setShowAccuracyComparison(!showAccuracyComparison)} active={showAccuracyComparison} title="Compare predictions with observed data">Accuracy</Btn>
            <Btn onClick={() => setShowWaveform(!showWaveform)} active={showWaveform} title="Individual constituent waveforms combined">Waves</Btn>
            <Btn onClick={() => setShowSpectrum(!showSpectrum)} active={showSpectrum} title="Frequency spectrum of tidal constituents">Spectrum</Btn>
            <Btn onClick={() => setShowTimeline(!showTimeline)} active={showTimeline} title="Horizontal timeline with tide heights">Timeline</Btn>
            <Btn onClick={() => setShowClock(!showClock)} active={showClock} title="Analog clock face showing tide state">Clock</Btn>
            <Btn onClick={() => setShowPhaseAnimation(true)} title="Animated constituent rotation">▶ Phase</Btn>
            <Btn onClick={() => setShowBeatPattern(true)} title="Beat patterns from constituent interaction">Beats</Btn>
            <Btn onClick={() => setShowWaterShader(!showWaterShader)} active={showWaterShader} title="3D water surface visualization">Water FX</Btn>
            <Btn onClick={() => setShowLiveTide(true)} title="Real-time tide display">Live</Btn>
            <Btn onClick={() => setShowTideRate(!showTideRate)} active={showTideRate} title="Rate of tide change (rising/falling)">Rate</Btn>
            <Btn onClick={() => setShowStationComparison(!showStationComparison)} active={showStationComparison} title="Compare multiple tide stations">Compare</Btn>
            <Btn onClick={() => setShowRangeChart(!showRangeChart)} active={showRangeChart} title="Chart of tidal ranges over time">Ranges</Btn>
            <Btn onClick={() => setShowPieChart(!showPieChart)} active={showPieChart} title="Pie chart of constituent amplitudes">Pie</Btn>
            <Btn onClick={() => setShowFamilies(!showFamilies)} active={showFamilies} title="Constituents grouped by family">Families</Btn>
            <Btn onClick={() => setShowTable(!showTable)} active={showTable} title="Sortable table of all constituents">Table</Btn>
            <Btn onClick={() => setShowMap(!showMap)} active={showMap} title="Map of tide stations">🗺️ Map</Btn>
          </div>
        );

      case 'predict':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowExtremes(!showExtremes)} active={showExtremes} title="High and low tide predictions">Hi/Lo</Btn>
            <Btn onClick={() => setShowKingTidePredictor(!showKingTidePredictor)} active={showKingTidePredictor} title="Predict extreme king tides">👑 King</Btn>
            <Btn onClick={() => setShowCalendar(!showCalendar)} active={showCalendar} title="Spring/neap tide calendar">Calendar</Btn>
            <Btn onClick={() => setShowMoonCalendar(true)} title="Moon phase calendar">🌙 Moon</Btn>
            <Btn onClick={() => setShowNodal(!showNodal)} active={showNodal} title="18.6-year lunar nodal cycle corrections">18.6yr</Btn>
            <Btn onClick={() => setShowSeasonalTide(true)} title="Compare tides across seasons">Seasonal</Btn>
            <Btn onClick={() => setShowDateComparison(true)} title="Compare tides on different dates">Compare</Btn>
            <Btn onClick={() => setShowHeightLookup(true)} title="Find tide height at specific time">Lookup</Btn>
            <Btn onClick={() => setShowTidalWindow(true)} title="Calculate safe tidal windows">Windows</Btn>
            <Btn onClick={() => setShowAlerts(!showAlerts)} active={showAlerts} title="Set tide level alerts">🔔 Alerts</Btn>
            <Btn onClick={() => setShowLunar(!showLunar)} active={showLunar} title="Current lunar phase display">Phase</Btn>
            <Btn onClick={() => setShowCoefficient(!showCoefficient)} active={showCoefficient} title="Tidal coefficients (French system)">Coef</Btn>
            <Btn onClick={() => setShowTideType(true)} title="Classify tide type (diurnal/semidiurnal)">Type</Btn>
            <Btn onClick={() => setShowEbbFlood(true)} title="Analyze ebb and flood patterns">Ebb/Flood</Btn>
            <Btn onClick={() => setShowExport(true)} title="Export tide data (CSV, JSON)">↓ Export</Btn>
            <Btn onClick={() => setShowPrintTable(true)} title="Print-friendly tide table">🖨️ Print</Btn>
            <Btn onClick={() => setShowShare(true)} title="Share link to this view">🔗 Share</Btn>
            <Btn onClick={() => setShowEmbedWidget(true)} title="Embeddable widget for websites">Embed</Btn>
          </div>
        );

      case 'learn':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowDoodsonExplorer(true)} title="Interactive Doodson number breakdown">Doodson #</Btn>
            <Btn onClick={() => setShowDatumExplainer(true)} title="Tidal datum reference levels explained">Datums</Btn>
            <Btn onClick={() => setShowAnalysis(true)} title="How harmonic analysis works">Analysis</Btn>
            <Btn onClick={() => setShowBoreInfo(true)} title="Tidal bores around the world">Bores</Btn>
            <Btn onClick={() => setShowAmphidromic(true)} title="Amphidromic points and cotidal lines">Amphidromic</Btn>
            <Btn onClick={() => setShowTidalLoading(true)} title="Earth deformation from tidal loading">Loading</Btn>
            <Btn onClick={() => setShowResonance(true)} title="Tidal resonance in basins">Resonance</Btn>
            <Btn onClick={() => setShowCoriolis(true)} title="Coriolis effect on tides">Coriolis</Btn>
            <Btn onClick={() => setShowLunarDistance(true)} title="Moon distance and tidal forcing">🌙 Distance</Btn>
            <Btn onClick={() => setShowEclipseTides(true)} title="How eclipses affect tides">Eclipses</Btn>
            <Btn onClick={() => setShowTwelfths(true)} title="Rule of Twelfths for tide estimation">Rule of 12</Btn>
            <Btn onClick={() => setShowAgeOfTide(true)} title="Lag between moon phase and tide">Age</Btn>
            <Btn onClick={() => setShowPortTiming(true)} title="Compare high water times at ports">Port Time</Btn>
            <Btn onClick={() => setShowDatumConverter(true)} title="Convert between tidal datums">Convert</Btn>
            <Btn onClick={() => setShowComparison(true)} title="Side-by-side constituent comparison">Compare</Btn>
            <Btn onClick={() => setShowQuiz(true)} title="Test your tidal knowledge">🎓 Quiz</Btn>
            <Btn onClick={() => setShowGlossary(true)} title="Tidal terminology glossary">📖 Glossary</Btn>
            <Btn onClick={() => setShowKeyboardHelp(true)} title="Keyboard shortcuts">⌨ Keys</Btn>
          </div>
        );

      case 'nav':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowNavSafety(true)} title="Navigation safety overview">Safety</Btn>
            <Btn onClick={() => setShowUKC(true)} title="Under-keel clearance calculator">Under Keel</Btn>
            <Btn onClick={() => setShowBridgeClearance(true)} title="Bridge clearance calculator">🌉 Bridge</Btn>
            <Btn onClick={() => setShowAnchorScope(true)} title="Anchor scope calculator">⚓ Anchor</Btn>
            <Btn onClick={() => setShowGroundingRisk(true)} title="Grounding risk analysis">⚠️ Ground</Btn>
            <Btn onClick={() => setShowStreamAtlas(true)} title="Tidal stream atlas">Streams</Btn>
            <Btn onClick={() => setShowPassagePlanner(true)} title="Tide-aware passage planner">Passage</Btn>
            <Btn onClick={() => setShowDepthCorrection(true)} title="Chart depth correction tool">Depth</Btn>
            <Btn onClick={() => setShowSlackWater(true)} title="Find slack water times">Slack</Btn>
            <Btn onClick={() => setShowCurrentSpeed(true)} title="Tidal current speed calculator">Current</Btn>
            <Btn onClick={() => setShowTidalGate(true)} title="Tidal gate/barrier schedules">Gates</Btn>
            <Btn onClick={() => setShowTidalRace(true)} title="Tidal race warnings">⚡ Races</Btn>
            <Btn onClick={() => setShowFerryTiming(true)} title="Ferry timing optimization">⛴️ Ferry</Btn>
            <Btn onClick={() => setShowPortApproach(true)} title="Port approach advisor">🚢 Port</Btn>
            <Btn onClick={() => setShowDockingWindow(true)} title="Calculate docking windows">Dock</Btn>
            <Btn onClick={() => setShowMooringLine(true)} title="Mooring line length calculator">Mooring</Btn>
            <Btn onClick={() => setShowStrandingTimer(true)} title="Stranding countdown timer">Strand</Btn>
            <Btn onClick={() => setShowMarinaAccess(true)} title="Marina access times">Marina</Btn>
            <Btn onClick={() => setShowFuelEstimator(true)} title="Tide-adjusted fuel consumption">⛽ Fuel</Btn>
            <Btn onClick={() => setShowCrewWatch(true)} title="Crew watch scheduler">Watch</Btn>
            <Btn onClick={() => setShowWaypointRoute(true)} title="Waypoint route planner">📍 Route</Btn>
            <Btn onClick={() => setShowVoyageLog(true)} title="Generate voyage log">📋 Log</Btn>
          </div>
        );

      case 'plan':
        return (
          <div className="flex flex-wrap gap-1.5">
            <Btn onClick={() => setShowBeachAccess(true)} title="Beach access planner">🏖️ Beach</Btn>
            <Btn onClick={() => setShowIntertidal(true)} title="Tidepool exploration times">🦀 Tidepool</Btn>
            <Btn onClick={() => setShowShellfishPlanner(true)} title="Shellfish harvesting planner">🦪 Shellfish</Btn>
            <Btn onClick={() => setShowKayakPlanner(true)} title="Kayak launch planner">🛶 Kayak</Btn>
            <Btn onClick={() => setShowDiveSlate(true)} title="Generate dive slate">🤿 Dive</Btn>
            <Btn onClick={() => setShowHikingPlanner(true)} title="Coastal hiking planner">🥾 Hike</Btn>
            <Btn onClick={() => setShowSurfCalc(true)} title="Surf conditions calculator">🏄 Surf</Btn>
            <Btn onClick={() => setShowPhotoPlanner(true)} title="Photography timing planner">📷 Photo</Btn>
            <Btn onClick={() => setShowSolunar(!showSolunar)} active={showSolunar} title="Solunar fishing activity">🎣 Fish</Btn>
            <Btn onClick={() => setShowBarometric(!showBarometric)} active={showBarometric} title="Barometric pressure effects">Pressure</Btn>
            <Btn onClick={() => setShowSeaLevelRise(!showSeaLevelRise)} active={showSeaLevelRise} title="Sea level rise projections">Sea Rise</Btn>
            <Btn onClick={() => setShowHistorical(!showHistorical)} active={showHistorical} title="Historical tide extremes">Records</Btn>
            <Btn onClick={() => setShowStormSurge(true)} title="Storm surge estimator">⛈️ Storm</Btn>
            <Btn onClick={() => setShowWeatherSim(true)} title="Weather effect simulator">Weather</Btn>
            <Btn onClick={() => setShowMarineWeather(true)} title="Marine weather panel">Marine Wx</Btn>
            <Btn onClick={() => setShowSwellImpact(true)} title="Swell impact calculator">🌊 Swell</Btn>
            <Btn onClick={() => setShowMSLTracker(true)} title="Mean sea level tracker">MSL</Btn>
            <Btn onClick={() => setShowEnergy(!showEnergy)} active={showEnergy} title="Tidal energy calculator">Energy</Btn>
            <Btn onClick={() => setShowTidalPrism(true)} title="Tidal prism calculator">Prism</Btn>
            <Btn onClick={() => setShowEstuary(true)} title="Estuary dynamics">Estuary</Btn>
            <Btn onClick={() => setShowDryingHeights(true)} title="Drying heights calculator">Drying</Btn>
          </div>
        );
    }
  };

  // Minimized panel view
  if (isPanelMinimized) {
    return (
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10">
        {/* Expand button */}
        <button
          onClick={togglePanelMinimized}
          title="Expand control panel"
          className="bg-slate-800/95 backdrop-blur rounded-lg p-3 shadow-lg hover:bg-slate-700/95 transition-colors flex items-center gap-2 text-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium">Tools</span>
          {openPanelCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {openPanelCount}
            </span>
          )}
        </button>

        {/* Still show active visualizations when minimized */}
        {showPhasorDiagram && <PhasorDiagram onConstituentClick={setSelectedConstituent} />}
        {showTideCurve && <TideCurve />}

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

        <ConstituentInfoPanel
          symbol={selectedConstituent}
          onClose={() => setSelectedConstituent(null)}
          onNavigate={setSelectedConstituent}
        />
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col gap-2 z-10 w-[320px] sm:w-[360px] max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent pr-1">
      {/* Station & Current Conditions */}
      <div className="bg-slate-800/90 backdrop-blur rounded-lg p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <StationSelector />
          </div>
          <UnitToggle />
          <button
            onClick={togglePanelMinimized}
            title="Minimize control panel"
            className="p-1.5 rounded bg-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <TidalStatistics />
        <TidalCurrentIndicator />
      </div>

      {/* Constituents */}
      <ConstituentToggles />

      {/* Search Tools */}
      <div className="bg-slate-800/90 backdrop-blur rounded-lg p-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools... (Ctrl+K)"
              className="w-full bg-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 pl-7 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          </div>
          {openPanelCount > 0 && (
            <button
              onClick={closeAllPanels}
              title={`Close ${openPanelCount} open panel${openPanelCount !== 1 ? 's' : ''}`}
              className="px-2 py-1 rounded text-xs bg-red-900/50 text-red-300 hover:bg-red-900 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {openPanelCount}
            </button>
          )}
        </div>
        {/* Search Results */}
        {filteredTools.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto">
            <div className="text-[10px] text-slate-500 mb-1">
              {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
            </div>
            <div className="flex flex-wrap gap-1">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  title={`${tool.tooltip} (${TABS.find(t => t.id === tool.tab)?.label})`}
                  className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-1"
                >
                  <span className="text-[10px] text-slate-500">{TABS.find(t => t.id === tool.tab)?.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {searchQuery && filteredTools.length === 0 && (
          <div className="mt-2 text-xs text-slate-500">No tools found</div>
        )}
        {/* Recent Tools */}
        {!searchQuery && recentToolObjects.length > 0 && (
          <div className="mt-2 border-t border-slate-700 pt-2">
            <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent
            </div>
            <div className="flex flex-wrap gap-1">
              {recentToolObjects.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  title={tool.tooltip}
                  className="px-2 py-1 rounded text-xs bg-slate-600 text-slate-200 hover:bg-slate-500 transition-colors flex items-center gap-1"
                >
                  <span className="text-[10px] text-slate-400">{TABS.find(t => t.id === tool.tab)?.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
