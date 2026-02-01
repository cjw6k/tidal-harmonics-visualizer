import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { getTidalType, type TidalType } from '@/data/stations';

// Tidal type colors
const TIDAL_TYPE_COLORS: Record<TidalType, { fill: string; stroke: string; label: string }> = {
  'semidiurnal': { fill: '#3b82f6', stroke: '#60a5fa', label: 'Semidiurnal' },
  'mixed-semidiurnal': { fill: '#06b6d4', stroke: '#22d3ee', label: 'Mixed (semi)' },
  'mixed-diurnal': { fill: '#22c55e', stroke: '#4ade80', label: 'Mixed (diurnal)' },
  'diurnal': { fill: '#f59e0b', stroke: '#fbbf24', label: 'Diurnal' },
};

// Simplified world map paths (major continents)
const CONTINENT_PATHS = {
  northAmerica: "M 5,25 L 10,20 L 20,18 L 35,20 L 40,25 L 38,35 L 35,45 L 30,50 L 25,55 L 20,52 L 15,45 L 10,40 L 5,35 Z",
  southAmerica: "M 25,55 L 30,52 L 35,55 L 38,65 L 35,80 L 30,85 L 25,80 L 22,70 L 23,60 Z",
  europe: "M 45,20 L 55,18 L 60,22 L 58,28 L 52,32 L 45,30 L 42,25 Z",
  africa: "M 45,32 L 55,30 L 62,35 L 60,50 L 55,65 L 48,68 L 42,60 L 40,45 L 42,38 Z",
  asia: "M 55,18 L 70,15 L 85,18 L 95,25 L 92,35 L 85,45 L 75,40 L 65,35 L 58,28 Z",
  australia: "M 80,55 L 92,52 L 98,58 L 95,68 L 85,70 L 78,65 L 78,58 Z",
};

/**
 * StationMap - World map showing tide stations by tidal type
 */
export function StationMap() {
  const stations = useHarmonicsStore((s) => s.stations);
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const selectStation = useHarmonicsStore((s) => s.selectStation);

  // Equirectangular projection: lon/lat to SVG coordinates
  const projectCoords = (lat: number, lon: number) => {
    // Map longitude -180 to 180 -> 0 to 100
    // Map latitude 90 to -90 -> 0 to 100
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  // Count stations by tidal type
  const typeCounts = useMemo(() => {
    const counts: Record<TidalType, number> = {
      'semidiurnal': 0,
      'mixed-semidiurnal': 0,
      'mixed-diurnal': 0,
      'diurnal': 0,
    };
    stations.forEach(s => {
      counts[getTidalType(s)]++;
    });
    return counts;
  }, [stations]);

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>🗺️</span>
        World Tide Stations
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        {stations.length} stations colored by tidal type
      </p>

      {/* World map */}
      <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800" style={{ height: '200px' }}>
        <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {/* Ocean background */}
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0c1929" />
              <stop offset="100%" stopColor="#0a1628" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="60" fill="url(#oceanGrad)" />

          {/* Latitude lines */}
          {[15, 25, 35, 45].map((y) => (
            <line key={`lat-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#1e3a5f" strokeWidth="0.15" strokeDasharray="1,1" />
          ))}

          {/* Longitude lines */}
          {[20, 40, 60, 80].map((x) => (
            <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="60" stroke="#1e3a5f" strokeWidth="0.15" strokeDasharray="1,1" />
          ))}

          {/* Continents */}
          {Object.values(CONTINENT_PATHS).map((path, i) => (
            <path
              key={i}
              d={path}
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.3"
              transform="scale(1, 0.6)"
            />
          ))}

          {/* Equator label */}
          <text x="2" y="31" className="fill-slate-600 text-[2.5px]">Equator</text>
          <line x1="0" y1="30" x2="100" y2="30" stroke="#334155" strokeWidth="0.2" />

          {/* Station markers */}
          {stations.map((station) => {
            const { x, y } = projectCoords(station.lat, station.lon);
            // Clamp to visible area
            const clampedY = Math.max(5, Math.min(55, y * 0.6));
            const isSelected = selectedStation?.id === station.id;
            const tidalType = getTidalType(station);
            const colors = TIDAL_TYPE_COLORS[tidalType];

            return (
              <g
                key={station.id}
                onClick={() => selectStation(station.id)}
                className="cursor-pointer"
                role="button"
                aria-label={`Select ${station.name}`}
              >
                {/* Selection highlight */}
                {isSelected && (
                  <>
                    <circle
                      cx={x}
                      cy={clampedY}
                      r="4"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.4"
                      opacity="0.8"
                    />
                    <circle
                      cx={x}
                      cy={clampedY}
                      r="6"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.2"
                      opacity="0.4"
                    />
                  </>
                )}

                {/* Marker */}
                <circle
                  cx={x}
                  cy={clampedY}
                  r={isSelected ? 2.5 : 1.8}
                  fill={colors.fill}
                  stroke={isSelected ? '#ffffff' : colors.stroke}
                  strokeWidth={isSelected ? 0.5 : 0.3}
                  className="transition-all hover:r-[2.5]"
                />

                {/* Tooltip */}
                <title>{station.name} ({TIDAL_TYPE_COLORS[tidalType].label})</title>
              </g>
            );
          })}

          {/* Selected station label */}
          {selectedStation && (() => {
            const { x, y } = projectCoords(selectedStation.lat, selectedStation.lon);
            const clampedY = Math.max(5, Math.min(55, y * 0.6));
            const labelX = x > 70 ? x - 1 : x + 1;
            const anchor = x > 70 ? 'end' : 'start';
            return (
              <g>
                <rect
                  x={x > 70 ? labelX - 18 : labelX - 0.5}
                  y={clampedY - 5.5}
                  width="19"
                  height="4"
                  fill="rgba(0,0,0,0.8)"
                  rx="0.5"
                />
                <text
                  x={labelX}
                  y={clampedY - 2.5}
                  textAnchor={anchor}
                  className="fill-white text-[2.5px] font-medium pointer-events-none"
                >
                  {selectedStation.name}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Tidal type legend */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.entries(TIDAL_TYPE_COLORS) as [TidalType, typeof TIDAL_TYPE_COLORS[TidalType]][]).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.fill, border: `1px solid ${colors.stroke}` }}
            />
            <span className="text-slate-400">{colors.label}</span>
            <span className="text-slate-600">({typeCounts[type]})</span>
          </div>
        ))}
      </div>

      {/* Selected station info */}
      {selectedStation && (() => {
        const tidalType = getTidalType(selectedStation);
        const colors = TIDAL_TYPE_COLORS[tidalType];
        return (
          <div className="mt-3 p-2 rounded border" style={{ backgroundColor: `${colors.fill}15`, borderColor: `${colors.fill}40` }}>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">{selectedStation.name}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${colors.fill}30`, color: colors.stroke }}
              >
                {colors.label}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-1 flex items-center gap-2">
              <span>
                {selectedStation.lat >= 0 ? selectedStation.lat.toFixed(2) + '°N' : Math.abs(selectedStation.lat).toFixed(2) + '°S'}
                {', '}
                {selectedStation.lon >= 0 ? selectedStation.lon.toFixed(2) + '°E' : Math.abs(selectedStation.lon).toFixed(2) + '°W'}
              </span>
              {selectedStation.state && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>{selectedStation.state}, {selectedStation.country}</span>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Tidal type explanation */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Tidal Types:</strong>
        <p className="mt-1">
          <span style={{ color: TIDAL_TYPE_COLORS.semidiurnal.stroke }}>Semidiurnal</span> = 2 equal highs/day.{' '}
          <span style={{ color: TIDAL_TYPE_COLORS.diurnal.stroke }}>Diurnal</span> = 1 high/day.{' '}
          <span style={{ color: TIDAL_TYPE_COLORS['mixed-semidiurnal'].stroke }}>Mixed</span> = unequal highs.
        </p>
      </div>
    </div>
  );
}
