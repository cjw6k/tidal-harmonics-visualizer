import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface IntertidalZone {
  name: string;
  color: string;
  minHeight: number; // relative to MLLW in meters
  maxHeight: number;
  description: string;
  species: string[];
  exposureType: 'always-submerged' | 'rarely-exposed' | 'twice-daily' | 'rarely-submerged' | 'splash-only';
}

// Standard intertidal zones relative to MLLW (in meters)
const INTERTIDAL_ZONES: IntertidalZone[] = [
  {
    name: 'Subtidal',
    color: '#1e3a5f',
    minHeight: -30,
    maxHeight: -0.3,
    description: 'Always underwater. Home to kelp forests, sea urchins, and diverse fish.',
    species: ['Kelp', 'Sea urchins', 'Rockfish', 'Anemones', 'Nudibranchs'],
    exposureType: 'always-submerged',
  },
  {
    name: 'Low Intertidal',
    color: '#1e5f4f',
    minHeight: -0.3,
    maxHeight: 0.3,
    description: 'Exposed only during lowest tides. Rich biodiversity zone.',
    species: ['Sea stars', 'Abalone', 'Sea lettuce', 'Purple urchins', 'Octopus'],
    exposureType: 'rarely-exposed',
  },
  {
    name: 'Mid Intertidal',
    color: '#3d7c47',
    minHeight: 0.3,
    maxHeight: 1.0,
    description: 'Covered and uncovered twice daily. Classic tidepool zone.',
    species: ['Mussels', 'Hermit crabs', 'Sea anemones', 'Sculpins', 'Chitons'],
    exposureType: 'twice-daily',
  },
  {
    name: 'High Intertidal',
    color: '#6b8e23',
    minHeight: 1.0,
    maxHeight: 1.7,
    description: 'Submerged only during high tides. Organisms tolerate drying.',
    species: ['Barnacles', 'Limpets', 'Periwinkles', 'Rockweed', 'Shore crabs'],
    exposureType: 'rarely-submerged',
  },
  {
    name: 'Splash Zone',
    color: '#8b7355',
    minHeight: 1.7,
    maxHeight: 2.5,
    description: 'Above high tide, wetted by spray. Most extreme conditions.',
    species: ['Lichens', 'Cyanobacteria', 'Isopods', 'Sea roaches', 'Rough periwinkles'],
    exposureType: 'splash-only',
  },
];

interface Props {
  onClose: () => void;
}

export function IntertidalZoneExplorer({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [selectedZone, setSelectedZone] = useState<IntertidalZone | null>(null);
  const [showSpecies, setShowSpecies] = useState(false);

  const useMetric = unitSystem === 'metric';

  // Get current tide height
  const currentHeight = useMemo(() => {
    if (!station) return 0;
    return predictTide(station, new Date());
  }, [station]);

  // Calculate 24-hour exposure windows for each zone
  const zoneTimeline = useMemo(() => {
    if (!station) return [];

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const timeline: { zone: IntertidalZone; exposedRanges: { start: Date; end: Date }[] }[] = [];

    for (const zone of INTERTIDAL_ZONES) {
      const exposedRanges: { start: Date; end: Date }[] = [];
      let currentlyExposed = false;
      let exposureStart: Date | null = null;

      // Sample every 15 minutes
      for (let minute = 0; minute <= 24 * 60; minute += 15) {
        const time = new Date(startOfDay.getTime() + minute * 60 * 1000);
        const height = predictTide(station, time);

        // Zone is "exposed" when water level is BELOW the zone's maximum
        const zoneExposed = height < zone.maxHeight;

        if (zoneExposed && !currentlyExposed) {
          exposureStart = time;
          currentlyExposed = true;
        } else if (!zoneExposed && currentlyExposed && exposureStart) {
          exposedRanges.push({ start: exposureStart, end: time });
          currentlyExposed = false;
          exposureStart = null;
        }
      }

      if (currentlyExposed && exposureStart) {
        exposedRanges.push({
          start: exposureStart,
          end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        });
      }

      timeline.push({ zone, exposedRanges });
    }

    return timeline;
  }, [station]);

  // Determine which zone the current water level is at
  const currentZone = useMemo((): IntertidalZone => {
    for (const zone of [...INTERTIDAL_ZONES].reverse()) {
      if (currentHeight >= zone.minHeight && currentHeight < zone.maxHeight) {
        return zone;
      }
    }
    const firstZone = INTERTIDAL_ZONES[0];
    const lastZone = INTERTIDAL_ZONES[INTERTIDAL_ZONES.length - 1];
    if (firstZone && currentHeight < firstZone.minHeight) {
      return firstZone;
    }
    return lastZone ?? INTERTIDAL_ZONES[0] as IntertidalZone;
  }, [currentHeight]);

  const displayHeight = useMetric ? currentHeight : currentHeight * 3.28084;
  const heightUnit = useMetric ? 'm' : 'ft';

  // Calculate total exposure time today for each zone
  const exposureStats = useMemo(() => {
    return zoneTimeline.map(({ zone, exposedRanges }) => {
      const totalMinutes = exposedRanges.reduce((sum, range) => {
        return sum + (range.end.getTime() - range.start.getTime()) / 60000;
      }, 0);
      return { zone, totalMinutes, exposedRanges };
    });
  }, [zoneTimeline]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatZoneHeight = (meters: number) => {
    if (useMetric) {
      return `${meters.toFixed(1)} m`;
    }
    return `${(meters * 3.28084).toFixed(1)} ft`;
  };

  if (!station) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🦀 Intertidal Zone Explorer</h2>
            <p className="text-sm text-slate-400">Discover what lives at each tide level</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Current Status */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Current Water Level</div>
            <div className="text-2xl font-bold text-cyan-400">
              {displayHeight.toFixed(2)} {heightUnit}
            </div>
            {currentZone && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: currentZone.color }}
                />
                <span className="text-white">Water is at: <strong>{currentZone.name}</strong></span>
              </div>
            )}
          </div>

          {/* Zone Diagram */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Zone Profile</h3>
            <div className="relative">
              {/* Vertical zone visualization */}
              <div className="flex flex-col gap-1">
                {[...INTERTIDAL_ZONES].reverse().map((zone) => {
                  const isCurrentZone = currentZone && zone.name === currentZone.name;
                  const zoneHeightPx = ((zone.maxHeight - zone.minHeight) / 3) * 60;

                  return (
                    <button
                      key={zone.name}
                      onClick={() => setSelectedZone(selectedZone?.name === zone.name ? null : zone)}
                      className={`relative flex items-center justify-between px-3 py-2 rounded transition-all text-left
                        ${isCurrentZone ? 'ring-2 ring-cyan-400' : ''}
                        ${selectedZone?.name === zone.name ? 'ring-2 ring-white' : ''}
                      `}
                      style={{
                        backgroundColor: zone.color,
                        minHeight: Math.max(40, zoneHeightPx)
                      }}
                    >
                      <div>
                        <div className="text-white font-medium text-sm">{zone.name}</div>
                        <div className="text-white/70 text-xs">
                          {formatZoneHeight(zone.minHeight)} - {formatZoneHeight(zone.maxHeight)}
                        </div>
                      </div>
                      <div className="text-white/80 text-xs text-right">
                        {zone.species.slice(0, 2).join(', ')}...
                      </div>
                      {isCurrentZone && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"
                             title="Current water level" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Zone Details */}
          {selectedZone && (
            <div className="bg-slate-900/50 rounded-lg p-4 border-l-4" style={{ borderColor: selectedZone.color }}>
              <h3 className="text-white font-bold text-lg mb-2">{selectedZone.name}</h3>
              <p className="text-slate-300 text-sm mb-3">{selectedZone.description}</p>

              <div className="mb-3">
                <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Exposure Pattern</div>
                <div className="text-white text-sm">
                  {selectedZone.exposureType === 'always-submerged' && '🌊 Always underwater'}
                  {selectedZone.exposureType === 'rarely-exposed' && '🌊 Exposed only during lowest tides'}
                  {selectedZone.exposureType === 'twice-daily' && '🔄 Covered/uncovered twice daily'}
                  {selectedZone.exposureType === 'rarely-submerged' && '☀️ Submerged only during high tides'}
                  {selectedZone.exposureType === 'splash-only' && '💨 Wetted by spray only'}
                </div>
              </div>

              <button
                onClick={() => setShowSpecies(!showSpecies)}
                className="text-cyan-400 text-sm hover:text-cyan-300"
              >
                {showSpecies ? '▼ Hide' : '▶ Show'} Common Species
              </button>

              {showSpecies && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedZone.species.map((species) => (
                    <span
                      key={species}
                      className="px-2 py-1 bg-slate-700 rounded text-xs text-white"
                    >
                      {species}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Today's Exposure Timeline */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Today's Exposure Windows</h3>
            <div className="text-xs text-slate-400 mb-3">
              Best tidepooling: Low & Mid zones when exposed
            </div>

            <div className="space-y-2">
              {exposureStats.slice(1, 4).map(({ zone, totalMinutes, exposedRanges }) => (
                <div key={zone.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{zone.name}</div>
                    <div className="text-slate-400 text-xs">
                      {exposedRanges.length > 0 ? (
                        exposedRanges.slice(0, 3).map((range, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            {formatTime(range.start)} - {formatTime(range.end)}
                          </span>
                        ))
                      ) : (
                        'No exposure today'
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 text-sm font-medium">
                      {Math.floor(totalMinutes / 60)}h {Math.round(totalMinutes % 60)}m
                    </div>
                    <div className="text-slate-500 text-xs">exposed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
            <h3 className="text-amber-400 font-medium mb-2">Tidepooling Tips</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Best viewing: 1-2 hours before lowest tide</li>
              <li>• Low intertidal has highest diversity but shortest windows</li>
              <li>• Never turn over rocks without replacing them</li>
              <li>• Watch for incoming tide - it can cut off return paths</li>
              <li>• Wear sturdy shoes - rocks are slippery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
