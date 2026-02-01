import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

interface CoriolisEffectPanelProps {
  onClose: () => void;
}

// Calculate Coriolis parameter at a given latitude
function coriolisParameter(latitudeDeg: number): number {
  const OMEGA = 7.2921e-5; // Earth's rotation rate (rad/s)
  const latRad = (latitudeDeg * Math.PI) / 180;
  return 2 * OMEGA * Math.sin(latRad);
}

// Calculate Rossby radius of deformation
function rossbyRadius(latitudeDeg: number, depth: number = 100): number {
  const f = Math.abs(coriolisParameter(latitudeDeg));
  if (f === 0) return Infinity;
  const g = 9.81;
  const c = Math.sqrt(g * depth); // shallow water wave speed
  return c / f / 1000; // convert to km
}

export function CoriolisEffectPanel({ onClose }: CoriolisEffectPanelProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  const stationData = useMemo(() => {
    if (!selectedStation) return null;

    const lat = selectedStation.lat;
    const f = coriolisParameter(lat);
    const rossby = rossbyRadius(lat, 50); // assume 50m shelf depth
    const hemisphere = lat >= 0 ? 'northern' : 'southern';
    const rotationDir = hemisphere === 'northern' ? 'counterclockwise' : 'clockwise';

    // Inertial period (time for Coriolis to deflect current 360°)
    const inertialPeriod = Math.abs(lat) > 0 ? (2 * Math.PI) / Math.abs(f) / 3600 : Infinity;

    return {
      latitude: lat,
      f,
      rossby,
      hemisphere,
      rotationDir,
      inertialPeriod,
    };
  }, [selectedStation]);

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-purple-400">Coriolis Effect & Tides</h3>
            <p className="text-slate-400 text-sm">
              How Earth's rotation influences tidal patterns
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

        {/* Station-specific data */}
        {stationData && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">{stationName}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Latitude</p>
                <p className="text-lg font-mono text-purple-400">
                  {Math.abs(stationData.latitude).toFixed(1)}°{stationData.latitude >= 0 ? 'N' : 'S'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Hemisphere</p>
                <p className="text-lg text-slate-200 capitalize">
                  {stationData.hemisphere}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Coriolis Parameter (f)</p>
                <p className="text-sm font-mono text-slate-200">
                  {(stationData.f * 1e4).toFixed(3)} × 10⁻⁴ s⁻¹
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Inertial Period</p>
                <p className="text-sm font-mono text-slate-200">
                  {stationData.inertialPeriod === Infinity
                    ? '∞ (at equator)'
                    : `${stationData.inertialPeriod.toFixed(1)} hrs`}
                </p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-purple-900/30 rounded">
              <p className="text-sm text-purple-200">
                Tidal currents at this location tend to rotate{' '}
                <strong>{stationData.rotationDir}</strong> over each tidal cycle.
              </p>
            </div>
          </div>
        )}

        {/* How Coriolis Affects Tides */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Coriolis Effects on Tides</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-purple-400">🌀</span>
              <div>
                <p className="text-slate-300 font-medium">Rotating Tidal Currents</p>
                <p>
                  Rather than simply flowing in and out, tidal currents rotate through 360°
                  over each tidal cycle. The rotation direction depends on hemisphere.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-400">🎯</span>
              <div>
                <p className="text-slate-300 font-medium">Amphidromic Points</p>
                <p>
                  Coriolis causes tides to rotate around fixed points (amphidromic points)
                  where tidal range is zero. The tide wave propagates around these points.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-cyan-400">↔️</span>
              <div>
                <p className="text-slate-300 font-medium">Right-Hand Deflection (NH)</p>
                <p>
                  In the Northern Hemisphere, moving water is deflected to the right.
                  This causes higher tides on the right side of channels (looking seaward).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-green-400">⟳</span>
              <div>
                <p className="text-slate-300 font-medium">Kelvin Waves</p>
                <p>
                  Tides propagate as Kelvin waves along coasts, with higher amplitude
                  on the coast to their right (NH) or left (SH).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hemisphere Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-900/30 rounded-lg p-3">
            <p className="text-blue-300 font-medium mb-1">Northern Hemisphere</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Currents deflect right</li>
              <li>• Tides rotate counterclockwise</li>
              <li>• Higher tides on right shore</li>
              <li>• Amphidromic rotation: CCW</li>
            </ul>
          </div>
          <div className="bg-orange-900/30 rounded-lg p-3">
            <p className="text-orange-300 font-medium mb-1">Southern Hemisphere</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Currents deflect left</li>
              <li>• Tides rotate clockwise</li>
              <li>• Higher tides on left shore</li>
              <li>• Amphidromic rotation: CW</li>
            </ul>
          </div>
        </div>

        {/* Visual Diagram */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Tidal Current Rotation</h4>
          <div className="relative h-32 flex items-center justify-center">
            <svg viewBox="0 0 200 100" className="w-full h-full max-w-xs">
              {/* Rotation arrows for NH */}
              <g transform="translate(50, 50)">
                <circle cx="0" cy="0" r="30" fill="none" stroke="currentColor"
                  strokeWidth="1" className="text-slate-600" strokeDasharray="4,4" />
                {/* Arrow indicating CCW rotation */}
                <path d="M 25 -15 A 30 30 0 0 0 -15 -25"
                  fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400" />
                <polygon points="-15,-25 -10,-18 -20,-20" className="fill-blue-400" />
                <text x="0" y="45" textAnchor="middle" className="fill-slate-400 text-xs">
                  Northern
                </text>
              </g>

              {/* Rotation arrows for SH */}
              <g transform="translate(150, 50)">
                <circle cx="0" cy="0" r="30" fill="none" stroke="currentColor"
                  strokeWidth="1" className="text-slate-600" strokeDasharray="4,4" />
                {/* Arrow indicating CW rotation */}
                <path d="M 15 -25 A 30 30 0 0 1 25 15"
                  fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400" />
                <polygon points="25,15 18,10 20,20" className="fill-orange-400" />
                <text x="0" y="45" textAnchor="middle" className="fill-slate-400 text-xs">
                  Southern
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Equatorial Note */}
        <div className="bg-amber-900/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <span>🌍</span>
            <div className="text-amber-200">
              <p className="font-medium">At the Equator</p>
              <p className="text-xs mt-1 text-amber-100/80">
                Coriolis effect is zero at the equator (f = 0). Tidal currents flow
                more directly in and out rather than rotating. This creates different
                tidal dynamics in equatorial regions.
              </p>
            </div>
          </div>
        </div>

        {/* Educational Footer */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">The Physics</h4>
          <div className="text-sm text-slate-400 space-y-2">
            <p>
              The <strong className="text-slate-300">Coriolis effect</strong> is an apparent
              deflection of moving objects (including water) caused by Earth's rotation.
              It's not a real force, but rather a result of observing motion from a rotating
              reference frame.
            </p>
            <p>
              The effect increases with latitude (maximum at poles, zero at equator) and
              with the speed of the moving object. For tidal currents, this creates the
              characteristic rotary motion observed at most locations.
            </p>
            <p className="text-xs text-slate-500">
              Named after French mathematician Gaspard-Gustave de Coriolis (1792-1843).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
