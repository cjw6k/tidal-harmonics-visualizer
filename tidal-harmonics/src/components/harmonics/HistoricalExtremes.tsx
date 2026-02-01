import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { formatHeight } from '@/lib/units';

/**
 * Known historical extreme tides for select stations
 * Data from NOAA verified highest/lowest water levels
 * Heights in meters above MLLW
 */
const HISTORICAL_EXTREMES: Record<string, {
  highestObserved: { height: number; date: string; event?: string };
  lowestObserved: { height: number; date: string; event?: string };
}> = {
  '9414290': { // San Francisco
    highestObserved: { height: 2.61, date: 'Dec 3, 1983', event: 'El Nino + Storm Surge' },
    lowestObserved: { height: -0.63, date: 'Dec 17, 1933', event: 'Strong offshore winds' },
  },
  '8518750': { // The Battery, NY
    highestObserved: { height: 4.28, date: 'Oct 29, 2012', event: 'Hurricane Sandy' },
    lowestObserved: { height: -0.82, date: 'Jan 25, 1976', event: 'Strong NW winds' },
  },
  '8443970': { // Boston
    highestObserved: { height: 4.89, date: 'Feb 7, 1978', event: 'Blizzard of 1978' },
    lowestObserved: { height: -0.80, date: 'Dec 28, 1959', event: 'Strong offshore winds' },
  },
  '8545240': { // Philadelphia
    highestObserved: { height: 3.60, date: 'Oct 29, 2012', event: 'Hurricane Sandy' },
    lowestObserved: { height: -0.55, date: 'Dec 31, 1962', event: 'Low river flow + wind' },
  },
  '9410660': { // Los Angeles
    highestObserved: { height: 2.39, date: 'Jan 27, 1983', event: 'El Nino storm' },
    lowestObserved: { height: -0.66, date: 'Dec 17, 1933', event: 'Strong offshore winds' },
  },
  '9447130': { // Seattle
    highestObserved: { height: 4.69, date: 'Dec 17, 2012', event: 'Winter storm' },
    lowestObserved: { height: -1.04, date: 'Jun 1, 2005', event: 'Strong high pressure' },
  },
  '8771450': { // Galveston
    highestObserved: { height: 4.04, date: 'Sep 13, 2008', event: 'Hurricane Ike' },
    lowestObserved: { height: -1.07, date: 'Feb 16, 2021', event: 'Winter storm' },
  },
  '8658120': { // Wilmington, NC
    highestObserved: { height: 2.38, date: 'Sep 16, 2018', event: 'Hurricane Florence' },
    lowestObserved: { height: -0.58, date: 'Dec 19, 2000', event: 'Cold front passage' },
  },
  '8724580': { // Key West
    highestObserved: { height: 1.52, date: 'Sep 10, 2017', event: 'Hurricane Irma' },
    lowestObserved: { height: -0.49, date: 'Oct 17, 1978', event: 'Strong north winds' },
  },
  '1612340': { // Honolulu
    highestObserved: { height: 0.94, date: 'Mar 3, 2017', event: 'King tide + swell' },
    lowestObserved: { height: -0.24, date: 'Sep 7, 1992', event: 'Low pressure event' },
  },
};

/**
 * Calculate theoretical maximum and minimum tides
 * by summing all constituent amplitudes
 */
function calculateTheoreticalExtremes(constituents: { amplitude: number }[]) {
  const totalAmplitude = constituents.reduce((sum, c) => sum + c.amplitude, 0);
  return {
    max: totalAmplitude, // All constituents in phase
    min: -totalAmplitude, // All constituents 180° out of phase
  };
}

/**
 * Calculate typical high/low by considering only major constituents
 * more realistically aligned
 */
function calculateTypicalExtremes(constituents: { symbol: string; amplitude: number }[]) {
  const M2 = constituents.find(c => c.symbol === 'M2')?.amplitude ?? 0;
  const S2 = constituents.find(c => c.symbol === 'S2')?.amplitude ?? 0;
  const N2 = constituents.find(c => c.symbol === 'N2')?.amplitude ?? 0;
  const K1 = constituents.find(c => c.symbol === 'K1')?.amplitude ?? 0;
  const O1 = constituents.find(c => c.symbol === 'O1')?.amplitude ?? 0;

  // Spring tide: M2 + S2 aligned
  const springTide = M2 + S2;
  // Neap tide: M2 - S2
  const neapTide = M2 - S2;
  // Perigean spring: M2 + S2 + N2 + diurnals
  const kingTide = M2 + S2 + N2 + K1 + O1;

  return {
    springHigh: springTide + K1,
    springLow: -(springTide - O1),
    neapHigh: neapTide + K1,
    neapLow: -(neapTide - O1),
    kingTide: kingTide,
  };
}

/**
 * HistoricalExtremes
 *
 * Shows historical highest/lowest recorded tides and theoretical extremes
 * based on harmonic analysis.
 */
export function HistoricalExtremes() {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const extremes = useMemo(() => {
    if (!station) return null;

    const theoretical = calculateTheoreticalExtremes(station.constituents);
    const typical = calculateTypicalExtremes(station.constituents);
    const historical = HISTORICAL_EXTREMES[station.id];

    return {
      theoretical,
      typical,
      historical,
    };
  }, [station]);

  if (!station || !extremes) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view extreme tide records
      </div>
    );
  }

  const { theoretical, typical, historical } = extremes;

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>📊</span>
        Tide Extremes at {station.name}
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        Historical records and theoretical limits
      </p>

      {/* Historical Observed Records */}
      {historical && (
        <div className="mb-4">
          <h4 className="text-slate-300 text-sm font-medium mb-2">Observed Records</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-red-400 text-xs mb-1">Highest Observed</div>
              <div className="text-white text-lg font-mono">
                {formatHeight(historical.highestObserved.height, unitSystem)}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                {historical.highestObserved.date}
              </div>
              {historical.highestObserved.event && (
                <div className="text-red-300/70 text-xs mt-1">
                  {historical.highestObserved.event}
                </div>
              )}
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="text-blue-400 text-xs mb-1">Lowest Observed</div>
              <div className="text-white text-lg font-mono">
                {formatHeight(historical.lowestObserved.height, unitSystem)}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                {historical.lowestObserved.date}
              </div>
              {historical.lowestObserved.event && (
                <div className="text-blue-300/70 text-xs mt-1">
                  {historical.lowestObserved.event}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Typical Ranges */}
      <div className="mb-4">
        <h4 className="text-slate-300 text-sm font-medium mb-2">Typical Tide Ranges</h4>
        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 text-xs text-slate-500 p-2 border-b border-slate-700">
            <span>Condition</span>
            <span className="text-center">High</span>
            <span className="text-center">Low</span>
          </div>
          <div className="grid grid-cols-3 text-xs p-2 border-b border-slate-700/50">
            <span className="text-amber-400">King Tide</span>
            <span className="text-white text-center font-mono">
              {formatHeight(typical.kingTide, unitSystem)}
            </span>
            <span className="text-slate-500 text-center">—</span>
          </div>
          <div className="grid grid-cols-3 text-xs p-2 border-b border-slate-700/50">
            <span className="text-cyan-400">Spring Tide</span>
            <span className="text-white text-center font-mono">
              {formatHeight(typical.springHigh, unitSystem)}
            </span>
            <span className="text-white text-center font-mono">
              {formatHeight(typical.springLow, unitSystem)}
            </span>
          </div>
          <div className="grid grid-cols-3 text-xs p-2">
            <span className="text-slate-400">Neap Tide</span>
            <span className="text-white text-center font-mono">
              {formatHeight(typical.neapHigh, unitSystem)}
            </span>
            <span className="text-white text-center font-mono">
              {formatHeight(typical.neapLow, unitSystem)}
            </span>
          </div>
        </div>
      </div>

      {/* Theoretical Limits */}
      <div className="mb-3">
        <h4 className="text-slate-300 text-sm font-medium mb-2">Theoretical Limits</h4>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs">Maximum possible (all constituents aligned)</span>
            <span className="text-orange-400 font-mono text-sm">
              ±{formatHeight(theoretical.max, unitSystem)}
            </span>
          </div>
          <div className="relative h-4 bg-slate-700 rounded overflow-hidden">
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-500"
              title="Mean sea level"
            />
            {/* Typical range */}
            <div
              className="absolute top-1 bottom-1 bg-cyan-500/40 rounded"
              style={{
                left: `${50 - (typical.springHigh / theoretical.max) * 45}%`,
                right: `${50 - (typical.springHigh / theoretical.max) * 45}%`,
              }}
            />
            {/* Observed range (if available) */}
            {historical && (
              <div
                className="absolute top-0 bottom-0 bg-red-500/30"
                style={{
                  left: `${50 - (historical.highestObserved.height / theoretical.max) * 45}%`,
                  right: `${50 + (historical.lowestObserved.height / theoretical.max) * 45}%`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Low</span>
            <span>MSL</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Storm surge note */}
      {historical && (
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-200/80 mb-3">
          <strong>Note:</strong> Observed extremes often include storm surge, which can add
          1-3+ meters above predicted astronomical tides. The
          {' '}{formatHeight(historical.highestObserved.height, unitSystem)} record was caused by
          {' '}{historical.highestObserved.event?.toLowerCase() || 'extreme weather'}.
        </div>
      )}

      {/* Educational note */}
      <div className="p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Understanding extremes:</strong>
        <p className="mt-1">
          Theoretical limits show the maximum possible tide if all {station.constituents.length} harmonic
          constituents perfectly aligned—an event so rare it essentially never occurs. Actual extremes
          are dominated by M2 (principal lunar) and S2 (principal solar) constituents.
        </p>
      </div>
    </div>
  );
}
