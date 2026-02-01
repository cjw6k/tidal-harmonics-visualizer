import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

interface MeanSeaLevelTrackerProps {
  onClose: () => void;
}

// Historical MSL rise rates by region (mm/year)
interface RegionalMSLData {
  rate: number;
  name: string;
  trend: string;
}

const GLOBAL_MSL_DATA: RegionalMSLData = { rate: 3.4, name: 'Global Average', trend: 'accelerating' };

const REGIONAL_MSL_RATES: Record<string, RegionalMSLData> = {
  'atlantic': { rate: 3.4, name: 'North Atlantic', trend: 'accelerating' },
  'pacific': { rate: 3.1, name: 'North Pacific', trend: 'steady' },
  'gulf': { rate: 4.2, name: 'Gulf of Mexico', trend: 'accelerating' },
  'arctic': { rate: 2.8, name: 'Arctic', trend: 'accelerating' },
  'southern': { rate: 3.3, name: 'Southern Ocean', trend: 'steady' },
  'global': GLOBAL_MSL_DATA,
};

// Get region from longitude/latitude
function getRegion(lat: number, lon: number): string {
  if (lat > 66) return 'arctic';
  if (lat < -40) return 'southern';
  if (lon > -100 && lon < -80 && lat > 18 && lat < 31) return 'gulf';
  if (lon < -100 || lon > 100) return 'pacific';
  return 'atlantic';
}

// Calculate projected MSL change
function projectMSL(rate: number, years: number): number {
  // Acceleration factor (observed ~0.1mm/yr² acceleration)
  const acceleration = 0.1;
  return rate * years + 0.5 * acceleration * years * years;
}

export function MeanSeaLevelTracker({ onClose }: MeanSeaLevelTrackerProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);

  const mslData = useMemo(() => {
    if (!selectedStation) return null;

    const region = getRegion(selectedStation.lat, selectedStation.lon);
    const regionalData: RegionalMSLData = REGIONAL_MSL_RATES[region] ?? GLOBAL_MSL_DATA;

    // Projections
    const proj10yr = projectMSL(regionalData.rate, 10);
    const proj30yr = projectMSL(regionalData.rate, 30);
    const proj50yr = projectMSL(regionalData.rate, 50);

    // Impact on tidal datums
    const mhhwChange10yr = proj10yr / 1000; // convert mm to m
    const mhhwChange30yr = proj30yr / 1000;

    return {
      region,
      regionalData,
      proj10yr,
      proj30yr,
      proj50yr,
      mhhwChange10yr,
      mhhwChange30yr,
    };
  }, [selectedStation]);

  const stationName = selectedStation?.name ?? 'Selected Station';

  // Generate historical trend data for visualization
  const trendData = useMemo(() => {
    const rate = mslData?.regionalData?.rate ?? 3.4;
    const years = Array.from({ length: 31 }, (_, i) => 1993 + i);
    return years.map((year) => ({
      year,
      msl: (year - 1993) * rate,
    }));
  }, [mslData]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-teal-400">Mean Sea Level Tracker</h3>
            <p className="text-slate-400 text-sm">
              Understanding long-term changes in sea level
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
        {mslData && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">{stationName}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Region</p>
                <p className="text-lg text-teal-400">{mslData.regionalData.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Rise Rate</p>
                <p className="text-lg font-mono text-slate-200">
                  {mslData.regionalData.rate.toFixed(1)} mm/yr
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Trend</p>
                <p className={`text-sm capitalize ${
                  mslData.regionalData.trend === 'accelerating'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}>
                  {mslData.regionalData.trend}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Since 1993</p>
                <p className="text-sm font-mono text-slate-200">
                  +{(mslData.regionalData.rate * 31).toFixed(0)} mm
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MSL Trend Chart */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Historical Trend (1993-2024)</h4>
          <div className="relative h-32">
            <svg viewBox="0 0 300 100" className="w-full h-full">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="40"
                  y1={y}
                  x2="290"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-slate-700"
                />
              ))}

              {/* Trend line */}
              <path
                d={`M 40 95 ${trendData
                  .map((d, i) => `L ${40 + i * 8} ${95 - d.msl * 0.8}`)
                  .join(' ')}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-teal-400"
              />

              {/* Fill under curve */}
              <path
                d={`M 40 95 ${trendData
                  .map((d, i) => `L ${40 + i * 8} ${95 - d.msl * 0.8}`)
                  .join(' ')} L 280 95 Z`}
                fill="currentColor"
                className="text-teal-400/20"
              />

              {/* Y-axis labels */}
              <text x="35" y="98" textAnchor="end" className="fill-slate-500 text-[8px]">0</text>
              <text x="35" y="58" textAnchor="end" className="fill-slate-500 text-[8px]">50</text>
              <text x="35" y="18" textAnchor="end" className="fill-slate-500 text-[8px]">100mm</text>

              {/* X-axis labels */}
              <text x="40" y="108" textAnchor="middle" className="fill-slate-500 text-[8px]">1993</text>
              <text x="160" y="108" textAnchor="middle" className="fill-slate-500 text-[8px]">2008</text>
              <text x="280" y="108" textAnchor="middle" className="fill-slate-500 text-[8px]">2024</text>
            </svg>
          </div>
        </div>

        {/* Projections */}
        {mslData && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Projected Rise</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-teal-900/30 rounded-lg">
                <p className="text-xs text-slate-400">By 2034</p>
                <p className="text-xl font-mono text-teal-400">
                  +{mslData.proj10yr.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">mm</p>
              </div>
              <div className="text-center p-3 bg-amber-900/30 rounded-lg">
                <p className="text-xs text-slate-400">By 2054</p>
                <p className="text-xl font-mono text-amber-400">
                  +{mslData.proj30yr.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">mm</p>
              </div>
              <div className="text-center p-3 bg-red-900/30 rounded-lg">
                <p className="text-xs text-slate-400">By 2074</p>
                <p className="text-xl font-mono text-red-400">
                  +{mslData.proj50yr.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">mm</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Based on current rate with observed acceleration
            </p>
          </div>
        )}

        {/* Impact on Tidal Datums */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Impact on Navigation</h4>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-teal-400">📊</span>
              <div>
                <p className="text-slate-300 font-medium">Datum Shifts</p>
                <p>
                  As MSL rises, all tidal datums (MLLW, MHW, MHHW) shift upward. Charts
                  based on older epochs become increasingly outdated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-amber-400">⚓</span>
              <div>
                <p className="text-slate-300 font-medium">Charted Depths</p>
                <p>
                  Charted depths referenced to MLLW may be slightly deeper than shown
                  due to MSL rise since the survey.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-400">🌊</span>
              <div>
                <p className="text-slate-300 font-medium">Flood Frequency</p>
                <p>
                  Minor (nuisance) flooding events become more frequent as baseline
                  water levels rise closer to infrastructure thresholds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Datum Epochs */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">National Tidal Datum Epochs</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
              <span className="text-slate-300">Current Epoch</span>
              <span className="font-mono text-teal-400">1983-2001</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-700/50 rounded">
              <span className="text-slate-300">Next Update</span>
              <span className="font-mono text-amber-400">2002-2020 (pending)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              NOAA updates tidal datums approximately every 20-25 years to account
              for long-term sea level changes.
            </p>
          </div>
        </div>

        {/* Components of Sea Level Change */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Why Sea Level Changes</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🧊</span>
                <span className="text-sm text-slate-300">Glacial/Ice Sheet Melt</span>
              </div>
              <span className="text-xs text-slate-400">~50%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <div className="flex items-center gap-2">
                <span className="text-red-400">🌡️</span>
                <span className="text-sm text-slate-300">Thermal Expansion</span>
              </div>
              <span className="text-xs text-slate-400">~40%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">💧</span>
                <span className="text-sm text-slate-300">Land Water Storage</span>
              </div>
              <span className="text-xs text-slate-400">~10%</span>
            </div>
          </div>
        </div>

        {/* Local vs Global Note */}
        <div className="bg-amber-900/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <span>⚠️</span>
            <div className="text-amber-200">
              <p className="font-medium">Local vs Global</p>
              <p className="text-xs mt-1 text-amber-100/80">
                Local sea level change can differ significantly from global average due to
                land subsidence, ocean currents, and gravitational effects from ice sheet loss.
                Some areas experience rates 2-3x the global average.
              </p>
            </div>
          </div>
        </div>

        {/* Educational Footer */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Understanding MSL</h4>
          <div className="text-sm text-slate-400 space-y-2">
            <p>
              <strong className="text-slate-300">Mean Sea Level (MSL)</strong> is the average
              ocean surface height, calculated over a 19-year tidal epoch to average out
              all tidal variations.
            </p>
            <p>
              Global MSL has risen approximately 8-9 inches (21-24 cm) since 1880, with
              the rate accelerating significantly since the 1990s. Satellite measurements
              since 1993 show a rate of about 3.4 mm/year.
            </p>
            <p className="text-xs text-slate-500">
              Data sources: NOAA, NASA, IPCC AR6
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
