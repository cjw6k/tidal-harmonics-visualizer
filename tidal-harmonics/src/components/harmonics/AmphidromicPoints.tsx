import { useState } from 'react';

interface AmphidromicPoint {
  id: string;
  name: string;
  location: string;
  ocean: string;
  rotation: 'counterclockwise' | 'clockwise';
  x: number; // percentage position on map
  y: number;
  description: string;
}

const AMPHIDROMIC_POINTS: AmphidromicPoint[] = [
  {
    id: 'north-atlantic-1',
    name: 'North Atlantic Point',
    location: '50°N, 40°W',
    ocean: 'North Atlantic',
    rotation: 'counterclockwise',
    x: 35,
    y: 28,
    description: 'Located between Iceland and Newfoundland, this point influences tides along the eastern US and western European coasts.'
  },
  {
    id: 'north-atlantic-2',
    name: 'Caribbean Point',
    location: '25°N, 65°W',
    ocean: 'North Atlantic',
    rotation: 'counterclockwise',
    x: 28,
    y: 40,
    description: 'Affects tides in the Caribbean Sea and Gulf of Mexico, creating complex tidal patterns in the region.'
  },
  {
    id: 'north-pacific-1',
    name: 'North Pacific Point',
    location: '45°N, 170°W',
    ocean: 'North Pacific',
    rotation: 'counterclockwise',
    x: 8,
    y: 32,
    description: 'One of the largest amphidromic systems, influencing tides across Hawaii, Alaska, and the US West Coast.'
  },
  {
    id: 'south-pacific-1',
    name: 'South Pacific Point',
    location: '30°S, 130°W',
    ocean: 'South Pacific',
    rotation: 'clockwise',
    x: 18,
    y: 62,
    description: 'Governs tidal patterns across French Polynesia and the eastern Pacific islands.'
  },
  {
    id: 'indian-1',
    name: 'Arabian Sea Point',
    location: '15°N, 65°E',
    ocean: 'Indian Ocean',
    rotation: 'counterclockwise',
    x: 62,
    y: 45,
    description: 'Controls tides in the Arabian Sea, affecting India\'s west coast and the Persian Gulf.'
  },
  {
    id: 'indian-2',
    name: 'South Indian Point',
    location: '30°S, 80°E',
    ocean: 'Indian Ocean',
    rotation: 'clockwise',
    x: 68,
    y: 62,
    description: 'Influences tides in the southern Indian Ocean, affecting Australia\'s west coast and Madagascar.'
  },
  {
    id: 'southern-1',
    name: 'Southern Ocean Point',
    location: '60°S, 30°W',
    ocean: 'Southern Ocean',
    rotation: 'clockwise',
    x: 40,
    y: 82,
    description: 'Part of the circumpolar tidal system around Antarctica.'
  },
  {
    id: 'north-sea',
    name: 'North Sea Point',
    location: '55°N, 5°E',
    ocean: 'North Sea',
    rotation: 'counterclockwise',
    x: 48,
    y: 26,
    description: 'Creates the famous rotary tidal patterns of the North Sea, affecting UK, Netherlands, and Scandinavian coasts.'
  },
];

interface Props {
  onClose?: () => void;
}

export function AmphidromicPoints({ onClose }: Props) {
  const [selectedPoint, setSelectedPoint] = useState<AmphidromicPoint | null>(null);
  const [showCoTidalLines, setShowCoTidalLines] = useState(true);

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 border border-slate-700 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Amphidromic Points</h3>
          <p className="text-slate-400 text-xs mt-1">
            Where tidal amplitude is zero and tides rotate around
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* Visual explanation */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4">
        <h4 className="text-cyan-400 font-medium text-sm mb-2">What are Amphidromic Points?</h4>
        <p className="text-slate-300 text-xs leading-relaxed mb-3">
          Amphidromic points are locations in the ocean where the tidal range is essentially zero.
          The tidal wave rotates around these points like water swirling around a drain.
          <strong className="text-cyan-300"> Co-tidal lines</strong> radiate outward like spokes on a wheel,
          connecting places where high tide occurs simultaneously.
        </p>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-slate-400">Northern Hemisphere: Counterclockwise</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-slate-400">Southern Hemisphere: Clockwise</span>
          </div>
        </div>
      </div>

      {/* Toggle for co-tidal lines */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={showCoTidalLines}
          onChange={(e) => setShowCoTidalLines(e.target.checked)}
          className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
        />
        <span className="text-slate-300 text-xs">Show co-tidal lines</span>
      </label>

      {/* Simplified world map with amphidromic points */}
      <div className="relative bg-slate-800 rounded-lg overflow-hidden" style={{ height: 280 }}>
        {/* Simple ocean background */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Ocean background */}
          <rect fill="#1e3a5f" width="100" height="100" />

          {/* Very simplified continents */}
          <path
            d="M25 15 L30 20 L28 35 L20 45 L22 55 L28 70 L25 80 L18 75 L15 60 L18 40 L22 25 Z"
            fill="#4a5568"
            opacity="0.6"
          /> {/* Americas */}
          <path
            d="M45 10 L55 15 L50 30 L55 45 L48 55 L52 75 L45 70 L42 50 L45 35 Z"
            fill="#4a5568"
            opacity="0.6"
          /> {/* Europe/Africa */}
          <path
            d="M60 20 L85 25 L90 35 L82 45 L88 60 L75 65 L70 55 L62 40 L65 30 Z"
            fill="#4a5568"
            opacity="0.6"
          /> {/* Asia/Australia */}

          {/* Antarctica */}
          <path
            d="M15 90 L85 90 L80 95 L20 95 Z"
            fill="#4a5568"
            opacity="0.6"
          />

          {/* Co-tidal lines (radiating from each point) */}
          {showCoTidalLines && AMPHIDROMIC_POINTS.map((point) => (
            <g key={`cotidal-${point.id}`} opacity="0.3">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
                const radians = (angle * Math.PI) / 180;
                const length = 12;
                const x2 = point.x + Math.cos(radians) * length;
                const y2 = point.y + Math.sin(radians) * length;
                return (
                  <line
                    key={angle}
                    x1={point.x}
                    y1={point.y}
                    x2={x2}
                    y2={y2}
                    stroke={point.rotation === 'counterclockwise' ? '#60a5fa' : '#fb923c'}
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                  />
                );
              })}
            </g>
          ))}

          {/* Amphidromic points */}
          {AMPHIDROMIC_POINTS.map((point) => (
            <g key={point.id}>
              {/* Rotation indicator ring */}
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="none"
                stroke={point.rotation === 'counterclockwise' ? '#3b82f6' : '#f97316'}
                strokeWidth="0.5"
                strokeDasharray="2,1"
                className="animate-spin"
                style={{
                  transformOrigin: `${point.x}px ${point.y}px`,
                  animationDuration: '8s',
                  animationDirection: point.rotation === 'clockwise' ? 'reverse' : 'normal'
                }}
              />
              {/* Center point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={point.rotation === 'counterclockwise' ? '#3b82f6' : '#f97316'}
                className="cursor-pointer hover:r-2 transition-all"
                onClick={() => setSelectedPoint(point)}
              />
            </g>
          ))}
        </svg>

        {/* Click hint */}
        <div className="absolute bottom-2 left-2 text-slate-500 text-xs">
          Click a point for details
        </div>
      </div>

      {/* Selected point info */}
      {selectedPoint && (
        <div className="mt-4 bg-slate-800 rounded-lg p-3 border-l-4 border-cyan-500">
          <div className="flex justify-between items-start">
            <h4 className="text-white font-medium">{selectedPoint.name}</h4>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-slate-400">
              <span className="text-slate-500">Location:</span> {selectedPoint.location}
            </p>
            <p className="text-slate-400">
              <span className="text-slate-500">Ocean:</span> {selectedPoint.ocean}
            </p>
            <p className={selectedPoint.rotation === 'counterclockwise' ? 'text-blue-400' : 'text-orange-400'}>
              <span className="text-slate-500">Rotation:</span>{' '}
              {selectedPoint.rotation === 'counterclockwise' ? '↺ Counterclockwise' : '↻ Clockwise'}
            </p>
            <p className="text-slate-300 mt-2 leading-relaxed">
              {selectedPoint.description}
            </p>
          </div>
        </div>
      )}

      {/* Educational content */}
      <div className="mt-4 space-y-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <h4 className="text-amber-400 font-medium text-sm mb-2">Why Do They Exist?</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            Amphidromic points form due to the interaction of the tidal wave with continental
            boundaries and the Coriolis effect. As the tidal bulge moves around the Earth,
            it reflects off coastlines and interferes with itself, creating nodes (zero amplitude)
            and antinodes (maximum amplitude).
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <h4 className="text-emerald-400 font-medium text-sm mb-2">Co-Tidal Lines</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            Co-tidal lines connect points that experience high tide at the same time. They radiate
            outward from amphidromic points like spokes on a wheel. The tide rotates around the
            amphidromic point, with high tide propagating along these lines in sequence—one full
            rotation takes about 12.42 hours (the M2 tidal period).
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-3">
          <h4 className="text-rose-400 font-medium text-sm mb-2">Tidal Range Near Points</h4>
          <p className="text-slate-300 text-xs leading-relaxed">
            Tidal range increases with distance from an amphidromic point. This is why some
            coastal areas have very small tidal ranges (near an amphidromic point) while others
            have enormous tides (far from any amphidromic point, like the Bay of Fundy).
          </p>
        </div>
      </div>

      {/* Fun fact */}
      <div className="mt-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg p-3 border border-cyan-800/30">
        <p className="text-cyan-200 text-xs leading-relaxed">
          <span className="font-semibold">🌊 Did you know?</span> The M2 (principal lunar) tide has
          about 12-15 amphidromic points in the world's oceans. Each major tidal constituent has its
          own pattern of amphidromic points, creating a complex interference pattern that determines
          local tidal characteristics.
        </p>
      </div>
    </div>
  );
}
