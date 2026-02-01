import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';
import type { TideStation } from '@/types/harmonics';

interface Props {
  onClose?: () => void;
}

// Group stations by geographic region based on country/state
function groupStationsByRegion(stations: TideStation[]): Record<string, TideStation[]> {
  const regions: Record<string, TideStation[]> = {};

  for (const station of stations) {
    let region: string;
    if (station.country === 'US') {
      const westCoastStates = ['CA', 'OR', 'WA', 'AK', 'HI'];
      const gulfStates = ['TX', 'LA', 'MS', 'AL', 'FL'];
      if (westCoastStates.includes(station.state || '')) {
        region = 'US West Coast';
      } else if (gulfStates.includes(station.state || '')) {
        region = 'US Gulf Coast';
      } else {
        region = 'US East Coast';
      }
    } else if (station.country === 'UK' || station.country === 'IE') {
      region = 'UK & Ireland';
    } else if (['FR', 'DE', 'NL', 'BE', 'ES', 'PT'].includes(station.country || '')) {
      region = 'Europe';
    } else if (['JP', 'CN', 'HK', 'SG', 'AU', 'NZ'].includes(station.country || '')) {
      region = 'Asia Pacific';
    } else {
      region = 'Other';
    }

    if (!regions[region]) regions[region] = [];
    regions[region]!.push(station);
  }

  return regions;
}

interface StationTideInfo {
  station: TideStation;
  height: number;
  nextHighTime: Date;
  nextLowTime: Date;
  phase: 'rising' | 'falling';
  rate: number;
}

export function PortTimingComparison({ onClose }: Props) {
  const stations = useHarmonicsStore((s) => s.stations);
  const [referenceStationId, setReferenceStationId] = useState<string | null>(null);

  const regions = useMemo(() => groupStationsByRegion(stations), [stations]);
  const regionNames = Object.keys(regions).filter(r => (regions[r]?.length ?? 0) > 1);
  const [selectedRegion, setSelectedRegion] = useState<string>(regionNames[0] || '');

  // Calculate tide info for all stations in selected region
  const stationData = useMemo(() => {
    const regionStations = regions[selectedRegion] || [];
    const now = new Date();
    const nowTime = now.getTime();
    const results: StationTideInfo[] = [];

    for (const station of regionStations) {
      // Current height
      const height = predictTide(station, now);

      // Height 5 minutes ago for rate calculation
      const prevHeight = predictTide(station, new Date(nowTime - 5 * 60 * 1000));
      const rate = (height - prevHeight) / 5; // meters per minute
      const phase = rate > 0 ? 'rising' : 'falling';

      // Find next high and low (simple search)
      let nextHighTime = now;
      let nextLowTime = now;
      let maxHeight = height;
      let minHeight = height;

      for (let t = 0; t < 13 * 60; t += 10) { // Search next 13 hours in 10-min increments
        const checkTime = new Date(nowTime + t * 60 * 1000);
        const h = predictTide(station, checkTime);
        if (h > maxHeight) {
          maxHeight = h;
          nextHighTime = checkTime;
        }
        if (h < minHeight) {
          minHeight = h;
          nextLowTime = checkTime;
        }
      }

      results.push({
        station,
        height,
        nextHighTime,
        nextLowTime,
        phase,
        rate: Math.abs(rate * 60), // m/hr
      });
    }

    // Sort by next high tide time
    return results.sort((a, b) => a.nextHighTime.getTime() - b.nextHighTime.getTime());
  }, [regions, selectedRegion]);

  // Calculate time differences relative to reference station
  const timeDiffs = useMemo(() => {
    if (!referenceStationId) return {};
    const refStation = stationData.find(s => s.station.id === referenceStationId);
    if (!refStation) return {};

    const diffs: Record<string, number> = {};
    for (const data of stationData) {
      diffs[data.station.id] = (data.nextHighTime.getTime() - refStation.nextHighTime.getTime()) / (1000 * 60);
    }
    return diffs;
  }, [stationData, referenceStationId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeDiff = (minutes: number) => {
    const sign = minutes >= 0 ? '+' : '';
    const hrs = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.round(Math.abs(minutes) % 60);
    if (hrs > 0) {
      return `${sign}${minutes >= 0 ? '' : '-'}${hrs}h ${mins}m`;
    }
    return `${sign}${Math.round(minutes)}m`;
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 border border-slate-700 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Port Timing Comparison</h3>
          <p className="text-slate-400 text-xs mt-1">
            See how tide timing varies between nearby ports
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

      {/* Region selector */}
      <div className="flex flex-wrap gap-1 mb-4">
        {regionNames.map((region) => (
          <button
            key={region}
            onClick={() => {
              setSelectedRegion(region);
              setReferenceStationId(null);
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              selectedRegion === region
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {region} ({regions[region]?.length || 0})
          </button>
        ))}
      </div>

      {/* Info about co-tidal relationships */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4">
        <p className="text-slate-300 text-xs leading-relaxed">
          <span className="text-cyan-400 font-medium">Co-tidal relationships</span> show how the
          tide wave progresses along a coastline. Click a station to set it as reference and see
          time differences. Positive times mean high tide arrives later at that port.
        </p>
      </div>

      {/* Station comparison list */}
      <div className="space-y-2">
        {stationData.map((data) => {
          const isReference = data.station.id === referenceStationId;
          const diff = timeDiffs[data.station.id];

          return (
            <div
              key={data.station.id}
              onClick={() => setReferenceStationId(isReference ? null : data.station.id)}
              className={`bg-slate-800 rounded-lg p-3 cursor-pointer transition-all ${
                isReference ? 'ring-2 ring-cyan-500 bg-slate-700' : 'hover:bg-slate-750'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white text-sm font-medium">
                    {data.station.name}{data.station.state ? `, ${data.station.state}` : ''}
                  </h4>
                  {isReference && (
                    <span className="text-cyan-400 text-xs">⬤ Reference station</span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono ${data.phase === 'rising' ? 'text-green-400' : 'text-red-400'}`}>
                    {data.height.toFixed(2)}m {data.phase === 'rising' ? '↑' : '↓'}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {data.rate.toFixed(2)} m/hr
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-slate-500">Next high: </span>
                  <span className="text-green-400">{formatTime(data.nextHighTime)}</span>
                  {referenceStationId && diff !== undefined && !isReference && (
                    <span className={`ml-2 ${diff > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                      ({formatTimeDiff(diff)})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500">Next low: </span>
                  <span className="text-red-400">{formatTime(data.nextLowTime)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual timeline */}
      {stationData.length > 1 && (
        <div className="mt-4 bg-slate-800 rounded-lg p-3">
          <h4 className="text-slate-300 text-xs font-medium mb-2">High Tide Progression</h4>
          <div className="relative h-24">
            {/* Time axis */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-600"></div>

            {/* Station markers */}
            {stationData.map((data) => {
              const firstTime = stationData[0]?.nextHighTime.getTime() ?? 0;
              const lastTime = stationData[stationData.length - 1]?.nextHighTime.getTime() ?? 0;
              const range = Math.max(lastTime - firstTime, 60000); // At least 1 minute range
              const position = ((data.nextHighTime.getTime() - firstTime) / range) * 100;

              return (
                <div
                  key={data.station.id}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${Math.min(92, Math.max(8, position))}%`, top: '50%' }}
                >
                  <div
                    className={`w-3 h-3 rounded-full -mt-1.5 ${
                      data.station.id === referenceStationId ? 'bg-cyan-500' : 'bg-blue-500'
                    }`}
                    title={`${data.station.name}: ${formatTime(data.nextHighTime)}`}
                  ></div>
                  <div
                    className="text-xs text-slate-400 mt-1 whitespace-nowrap"
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      maxHeight: '3rem'
                    }}
                  >
                    {data.station.name.slice(0, 12)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-6">
            <span>{formatTime(stationData[0]?.nextHighTime ?? new Date())}</span>
            <span>→ Tide progression →</span>
            <span>{formatTime(stationData[stationData.length - 1]?.nextHighTime ?? new Date())}</span>
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="mt-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg p-3 border border-cyan-800/30">
        <p className="text-cyan-200 text-xs leading-relaxed">
          <span className="font-semibold">⏱️ Why timing differs:</span> The tide wave travels at
          roughly 200-250 m/s in open ocean, but slows dramatically in shallow coastal waters.
          Geographic features like bays, channels, and headlands can delay or advance the tide
          by hours compared to nearby ports.
        </p>
      </div>
    </div>
  );
}
