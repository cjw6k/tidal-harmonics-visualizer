import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

/**
 * StationMap
 *
 * A simple SVG-based mini-map showing all tide station locations
 * with the selected station highlighted.
 */
export function StationMap() {
  const stations = useHarmonicsStore((s) => s.stations);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const selectStation = useHarmonicsStore((s) => s.selectStation);

  // Project coordinates to SVG viewport
  // Using a simple equirectangular projection
  const projectCoords = useMemo(() => {
    // Find bounds of all stations
    const lats = stations.map((s) => s.lat);
    const lons = stations.map((s) => s.lon);
    const minLat = Math.min(...lats) - 5;
    const maxLat = Math.max(...lats) + 5;
    const minLon = Math.min(...lons) - 5;
    const maxLon = Math.max(...lons) + 5;

    return (lat: number, lon: number) => {
      const x = ((lon - minLon) / (maxLon - minLon)) * 100;
      const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
      return { x, y };
    };
  }, [stations]);

  // Group stations by region for better visualization
  const stationsByRegion = useMemo(() => {
    const regions: Record<string, typeof stations> = {
      'US East Coast': [],
      'US West Coast': [],
      'US Gulf': [],
      'Pacific': [],
      'Europe': [],
      'Other': [],
    };

    stations.forEach((station) => {
      if (station.lon > -100 && station.lon < -60 && station.lat > 25) {
        regions['US East Coast']!.push(station);
      } else if (station.lon < -115 && station.lat > 30) {
        regions['US West Coast']!.push(station);
      } else if (station.lon > -100 && station.lon < -80 && station.lat < 30) {
        regions['US Gulf']!.push(station);
      } else if (station.lon < -100 || station.lon > 100) {
        regions['Pacific']!.push(station);
      } else if (station.lon > -20 && station.lon < 40) {
        regions['Europe']!.push(station);
      } else {
        regions['Other']!.push(station);
      }
    });

    return regions;
  }, [stations]);

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>🗺️</span>
        Station Map
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        Click a marker to select a station ({stations.length} available)
      </p>

      {/* Mini map */}
      <div className="relative bg-slate-800/50 rounded-lg overflow-hidden" style={{ height: '180px' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          {/* Simple world outline hint */}
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#oceanGrad)" />

          {/* Grid lines */}
          {[20, 40, 60, 80].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#334155" strokeWidth="0.2" />
              <line x1="0" y1={v} x2="100" y2={v} stroke="#334155" strokeWidth="0.2" />
            </g>
          ))}

          {/* Station markers */}
          {stations.map((station) => {
            const { x, y } = projectCoords(station.lat, station.lon);
            const isSelected = selectedStation?.id === station.id;

            return (
              <g
                key={station.id}
                onClick={() => selectStation(station.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`Select ${station.name}`}
              >
                {/* Selection highlight ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="0.5"
                    className="animate-ping"
                  />
                )}

                {/* Marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 3 : 2}
                  className={`transition-all ${
                    isSelected
                      ? 'fill-cyan-400 stroke-cyan-200'
                      : 'fill-blue-500 stroke-blue-300 hover:fill-cyan-400'
                  }`}
                  strokeWidth="0.5"
                />

                {/* Tooltip on hover */}
                <title>{station.name}</title>
              </g>
            );
          })}

          {/* Selected station label */}
          {selectedStation && (() => {
            const { x, y } = projectCoords(selectedStation.lat, selectedStation.lon);
            const labelX = x > 50 ? x - 2 : x + 2;
            const anchor = x > 50 ? 'end' : 'start';
            return (
              <text
                x={labelX}
                y={y - 4}
                textAnchor={anchor}
                className="fill-cyan-300 text-[4px] font-medium pointer-events-none"
              >
                {selectedStation.name}
              </text>
            );
          })()}
        </svg>
      </div>

      {/* Region legend */}
      <div className="mt-3 grid grid-cols-2 gap-1">
        {Object.entries(stationsByRegion)
          .filter(([, list]) => list.length > 0)
          .map(([region, list]) => (
            <div key={region} className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>{region}</span>
              <span className="text-slate-600">({list.length})</span>
            </div>
          ))}
      </div>

      {/* Selected station info */}
      {selectedStation && (
        <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/20 rounded">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 text-sm font-medium">{selectedStation.name}</span>
            <span className="text-slate-500 text-xs">
              {selectedStation.lat.toFixed(2)}°N, {Math.abs(selectedStation.lon).toFixed(2)}°W
            </span>
          </div>
          {selectedStation.state && (
            <div className="text-slate-500 text-xs mt-1">
              {selectedStation.state}, {selectedStation.country}
            </div>
          )}
        </div>
      )}

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">About our stations:</strong>
        <p className="mt-1">
          Data from NOAA CO-OPS tide stations. Each station has unique harmonic
          constituents calibrated from years of observations.
        </p>
      </div>
    </div>
  );
}
