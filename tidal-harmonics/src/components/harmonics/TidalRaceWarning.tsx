import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface TidalRaceWarningProps {
  onClose: () => void;
}

// Known dangerous tidal races worldwide
const KNOWN_TIDAL_RACES = [
  {
    name: 'Corryvreckan',
    location: 'Scotland, UK',
    lat: 56.154,
    lon: -5.718,
    maxSpeed: 8.5, // knots
    danger: 'extreme',
    description: 'One of the largest whirlpools in the world',
    bestConditions: '2 hours before HW or LW slack',
  },
  {
    name: 'Portland Race',
    location: 'Dorset, UK',
    lat: 50.467,
    lon: -2.45,
    maxSpeed: 7,
    danger: 'severe',
    description: 'Dangerous overfalls especially against wind',
    bestConditions: 'Avoid when wind opposes tide',
  },
  {
    name: 'Pentland Firth',
    location: 'Scotland, UK',
    lat: 58.733,
    lon: -3.1,
    maxSpeed: 12,
    danger: 'extreme',
    description: 'Fastest tidal streams in UK waters',
    bestConditions: 'Plan passage for slack water',
  },
  {
    name: 'Raz de Sein',
    location: 'Brittany, France',
    lat: 48.04,
    lon: -4.77,
    maxSpeed: 7,
    danger: 'severe',
    description: 'Violent overfalls and standing waves',
    bestConditions: 'Navigate at neap tides only',
  },
  {
    name: 'Hell Gate',
    location: 'New York, USA',
    lat: 40.779,
    lon: -73.937,
    maxSpeed: 5,
    danger: 'moderate',
    description: 'Historically hazardous narrow strait',
    bestConditions: 'Transit at slack water',
  },
  {
    name: 'Deception Pass',
    location: 'Washington, USA',
    lat: 48.407,
    lon: -122.645,
    maxSpeed: 8,
    danger: 'severe',
    description: 'Strong currents with dangerous eddies',
    bestConditions: 'Transit within 30 min of slack',
  },
  {
    name: 'Saltstraumen',
    location: 'Norway',
    lat: 67.23,
    lon: 14.62,
    maxSpeed: 22,
    danger: 'extreme',
    description: 'Strongest tidal current in the world',
    bestConditions: 'Only at slack water',
  },
  {
    name: 'Naruto Whirlpools',
    location: 'Japan',
    lat: 34.23,
    lon: 134.65,
    maxSpeed: 13,
    danger: 'extreme',
    description: 'Famous large whirlpools up to 20m diameter',
    bestConditions: 'Tourism only - avoid navigation',
  },
];

// Calculate danger level based on current and conditions
function getDangerLevel(
  currentSpeed: number,
  windSpeed: number,
  windAgainstTide: boolean
): { level: string; color: string; advice: string } {
  let effectiveSpeed = currentSpeed;

  // Wind against tide increases danger significantly
  if (windAgainstTide && windSpeed > 15) {
    effectiveSpeed *= 1.5;
  }

  if (effectiveSpeed > 6 || (windAgainstTide && effectiveSpeed > 4)) {
    return {
      level: 'EXTREME',
      color: 'bg-red-600',
      advice: 'Do not attempt passage. Wait for better conditions.',
    };
  } else if (effectiveSpeed > 4) {
    return {
      level: 'SEVERE',
      color: 'bg-orange-600',
      advice: 'Experienced mariners only. Maintain high vigilance.',
    };
  } else if (effectiveSpeed > 2) {
    return {
      level: 'MODERATE',
      color: 'bg-yellow-600',
      advice: 'Navigate with caution. Watch for overfalls.',
    };
  }
  return {
    level: 'LOW',
    color: 'bg-green-600',
    advice: 'Conditions favorable for safe passage.',
  };
}

export function TidalRaceWarning({ onClose }: TidalRaceWarningProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const [windSpeed, setWindSpeed] = useState(10);
  const [windDirection, setWindDirection] = useState<'with' | 'against'>('with');

  // Estimate current speed based on tidal range and rate of change
  const currentConditions = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const height = predictTide(selectedStation, now);
    const heightIn1Hr = predictTide(
      selectedStation,
      new Date(now.getTime() + 3600000)
    );

    // Rate of change indicates current speed (simplified)
    const rateOfChange = Math.abs(heightIn1Hr - height);
    const estimatedSpeed = rateOfChange * 2.5; // Rough conversion factor

    // Find nearby tidal races
    const nearbyRaces = KNOWN_TIDAL_RACES.filter((race) => {
      const distance = Math.sqrt(
        Math.pow(race.lat - selectedStation.lat, 2) +
          Math.pow(race.lon - selectedStation.lon, 2)
      );
      return distance < 5; // Within ~5 degrees
    });

    return {
      rateOfChange,
      estimatedSpeed,
      nearbyRaces,
    };
  }, [selectedStation]);

  const dangerAssessment = useMemo(() => {
    if (!currentConditions) return null;
    return getDangerLevel(
      currentConditions.estimatedSpeed,
      windSpeed,
      windDirection === 'against'
    );
  }, [currentConditions, windSpeed, windDirection]);

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-orange-400">Tidal Race Warning</h3>
            <p className="text-slate-400 text-sm">
              Dangerous waters from tidal acceleration
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

        {/* What is a Tidal Race */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">What is a Tidal Race?</h4>
          <p className="text-sm text-slate-400 mb-3">
            A <strong className="text-slate-300">tidal race</strong> occurs when tidal streams
            accelerate through narrow channels, around headlands, or over underwater obstacles.
            This creates dangerous conditions including:
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">🌀</span>
              <span><strong className="text-slate-300">Overfalls:</strong> Turbulent, breaking waves even in calm weather</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">🌊</span>
              <span><strong className="text-slate-300">Standing waves:</strong> Large stationary waves that can swamp vessels</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">🔄</span>
              <span><strong className="text-slate-300">Eddies & whirlpools:</strong> Circular currents that trap vessels</span>
            </li>
          </ul>
        </div>

        {/* Current Conditions */}
        {currentConditions && dangerAssessment && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">
              Current Assessment - {stationName}
            </h4>

            <div className={`${dangerAssessment.color} rounded-lg p-3 mb-3`}>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-lg">
                  {dangerAssessment.level} RISK
                </span>
                <span className="text-white/80 text-sm">
                  Est. current: {currentConditions.estimatedSpeed.toFixed(1)} kn
                </span>
              </div>
              <p className="text-white/90 text-sm mt-1">{dangerAssessment.advice}</p>
            </div>

            {/* Wind conditions input */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Wind Speed (kn)</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-slate-300">{windSpeed} kn</div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Wind vs Tide</label>
                <select
                  value={windDirection}
                  onChange={(e) => setWindDirection(e.target.value as 'with' | 'against')}
                  className="w-full bg-slate-700 text-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="with">With tide</option>
                  <option value="against">Against tide</option>
                </select>
              </div>
            </div>

            <div className="bg-red-900/30 rounded p-2 text-sm text-red-200">
              <strong>Warning:</strong> Wind against tide dramatically increases
              wave height and danger. Avoid these conditions.
            </div>
          </div>
        )}

        {/* Nearby Tidal Races */}
        {currentConditions?.nearbyRaces && currentConditions.nearbyRaces.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Nearby Tidal Races</h4>
            <div className="space-y-3">
              {currentConditions.nearbyRaces.map((race) => (
                <div
                  key={race.name}
                  className="bg-slate-700/50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-200 font-medium">{race.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      race.danger === 'extreme'
                        ? 'bg-red-600 text-white'
                        : race.danger === 'severe'
                          ? 'bg-orange-600 text-white'
                          : 'bg-yellow-600 text-black'
                    }`}>
                      {race.danger.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{race.location}</p>
                  <p className="text-sm text-slate-300 mt-1">{race.description}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Max speed: <span className="text-orange-400">{race.maxSpeed} kn</span>
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    Best conditions: {race.bestConditions}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Famous Tidal Races */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Notable Tidal Races</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {KNOWN_TIDAL_RACES.slice(0, 5).map((race) => (
              <div
                key={race.name}
                className="flex items-center justify-between p-2 bg-slate-700/50 rounded"
              >
                <div>
                  <p className="text-sm text-slate-200">{race.name}</p>
                  <p className="text-xs text-slate-400">{race.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-400">{race.maxSpeed} kn max</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Guidelines */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Safety Guidelines</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Plan passages for slack water whenever possible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Check wind vs tide conditions - avoid when opposing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Spring tides create faster currents and greater danger</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Carry updated tidal atlases and stream information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Maintain larger safety margins during peak flows</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">✗</span>
              <span>Never approach a tidal race in deteriorating conditions</span>
            </li>
          </ul>
        </div>

        {/* Formation Diagram */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">How Races Form</h4>
          <svg viewBox="0 0 300 120" className="w-full h-32">
            {/* Water flow */}
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" className="fill-blue-400" />
              </marker>
            </defs>

            {/* Narrow channel */}
            <rect x="0" y="40" width="100" height="40" className="fill-slate-600" />
            <rect x="100" y="30" width="100" height="60" className="fill-slate-700" rx="5" />
            <rect x="200" y="40" width="100" height="40" className="fill-slate-600" />

            {/* Land masses */}
            <path d="M100,30 Q150,0 200,30" className="fill-amber-800" />
            <path d="M100,90 Q150,120 200,90" className="fill-amber-800" />

            {/* Flow arrows - accelerating through narrows */}
            <line x1="20" y1="60" x2="70" y2="60" stroke="currentColor"
              strokeWidth="2" className="text-blue-400" markerEnd="url(#arrow)" />
            <line x1="120" y1="60" x2="180" y2="60" stroke="currentColor"
              strokeWidth="3" className="text-blue-400" markerEnd="url(#arrow)" />
            <line x1="230" y1="60" x2="280" y2="60" stroke="currentColor"
              strokeWidth="2" className="text-blue-400" markerEnd="url(#arrow)" />

            {/* Turbulence indicators */}
            <circle cx="195" cy="55" r="3" className="fill-orange-400 animate-pulse" />
            <circle cx="200" cy="65" r="2" className="fill-orange-400 animate-pulse" />
            <circle cx="210" cy="58" r="2.5" className="fill-orange-400 animate-pulse" />

            {/* Labels */}
            <text x="50" y="95" textAnchor="middle" className="fill-slate-400 text-[8px]">
              Normal flow
            </text>
            <text x="150" y="115" textAnchor="middle" className="fill-slate-400 text-[8px]">
              Accelerated (race)
            </text>
            <text x="250" y="95" textAnchor="middle" className="fill-slate-400 text-[8px]">
              Overfalls
            </text>
          </svg>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Water accelerates through constrictions, creating turbulence downstream
          </p>
        </div>
      </div>
    </div>
  );
}
