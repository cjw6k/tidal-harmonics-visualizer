import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { formatHeight } from '@/lib/units';
import { format, addHours } from 'date-fns';

interface TidalStreamAtlasProps {
  onClose: () => void;
}

interface StreamHour {
  hoursFromHW: number;
  label: string;
  ratePercent: number;
  direction: 'flood' | 'ebb' | 'slack';
  description: string;
}

export function TidalStreamAtlas({ onClose }: TidalStreamAtlasProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const [maxStreamRate, setMaxStreamRate] = useState(2.0); // knots at springs
  const [springNeapFactor, setSpringNeapFactor] = useState(1.0); // 1.0 = springs, 0.5 = neaps

  // Standard tidal stream pattern based on hours from high water
  // Rate percentages follow the rule of twelfths and typical stream patterns
  const standardStreamPattern: StreamHour[] = [
    { hoursFromHW: -6, label: 'HW-6', ratePercent: 10, direction: 'flood', description: 'Beginning of flood stream' },
    { hoursFromHW: -5, label: 'HW-5', ratePercent: 40, direction: 'flood', description: 'Flood increasing' },
    { hoursFromHW: -4, label: 'HW-4', ratePercent: 70, direction: 'flood', description: 'Strong flood' },
    { hoursFromHW: -3, label: 'HW-3', ratePercent: 100, direction: 'flood', description: 'Maximum flood' },
    { hoursFromHW: -2, label: 'HW-2', ratePercent: 80, direction: 'flood', description: 'Flood decreasing' },
    { hoursFromHW: -1, label: 'HW-1', ratePercent: 40, direction: 'flood', description: 'Weak flood' },
    { hoursFromHW: 0, label: 'HW', ratePercent: 0, direction: 'slack', description: 'High water slack' },
    { hoursFromHW: 1, label: 'HW+1', ratePercent: 40, direction: 'ebb', description: 'Beginning of ebb' },
    { hoursFromHW: 2, label: 'HW+2', ratePercent: 80, direction: 'ebb', description: 'Ebb increasing' },
    { hoursFromHW: 3, label: 'HW+3', ratePercent: 100, direction: 'ebb', description: 'Maximum ebb' },
    { hoursFromHW: 4, label: 'HW+4', ratePercent: 70, direction: 'ebb', description: 'Strong ebb' },
    { hoursFromHW: 5, label: 'HW+5', ratePercent: 40, direction: 'ebb', description: 'Ebb decreasing' },
    { hoursFromHW: 6, label: 'HW+6 / LW', ratePercent: 0, direction: 'slack', description: 'Low water slack' },
  ];

  // Find next high water for reference
  const tideData = useMemo(() => {
    if (!selectedStation) return null;

    const now = new Date();
    const end = addHours(now, 24);
    const series = predictTideSeries(selectedStation, now, end, 10);
    const extremes = findExtremes(series);

    // Find next high tide
    const nextHW = extremes.find((e) => e.type === 'high' && e.time > now);
    const prevHW = [...extremes].reverse().find((e) => e.type === 'high' && e.time <= now);

    // Current tide
    const currentTide = series[0]?.height || 0;

    // Calculate hours from HW
    let hoursFromHW = 0;
    let referenceHW: Date | null = null;

    if (prevHW && nextHW) {
      // Between two high waters
      const timeToPrevHW = (now.getTime() - prevHW.time.getTime()) / 3600000;
      const timeToNextHW = (nextHW.time.getTime() - now.getTime()) / 3600000;

      if (timeToPrevHW <= 6) {
        hoursFromHW = timeToPrevHW;
        referenceHW = prevHW.time;
      } else {
        hoursFromHW = -timeToNextHW;
        referenceHW = nextHW.time;
      }
    } else if (nextHW) {
      hoursFromHW = -(nextHW.time.getTime() - now.getTime()) / 3600000;
      referenceHW = nextHW.time;
    } else if (prevHW) {
      hoursFromHW = (now.getTime() - prevHW.time.getTime()) / 3600000;
      referenceHW = prevHW.time;
    }

    return {
      currentTide,
      hoursFromHW: Math.round(hoursFromHW * 10) / 10,
      referenceHW,
      nextHW,
      prevHW,
    };
  }, [selectedStation]);

  // Get current stream info
  const currentStream = useMemo((): (StreamHour & { actualRate: number }) | null => {
    if (!tideData) return null;

    const hours = tideData.hoursFromHW;
    const nearestHour = Math.round(hours);
    let pattern = standardStreamPattern.find((p) => p.hoursFromHW === nearestHour);

    if (!pattern) {
      // Interpolate or return nearest
      const clamped = Math.max(-6, Math.min(6, nearestHour));
      pattern = standardStreamPattern.find((p) => p.hoursFromHW === clamped);
    }

    // Fallback to high water slack if nothing found
    if (!pattern) {
      pattern = standardStreamPattern[6]!;
    }

    const actualRate = (pattern.ratePercent / 100) * maxStreamRate * springNeapFactor;

    return {
      hoursFromHW: pattern.hoursFromHW,
      label: pattern.label,
      ratePercent: pattern.ratePercent,
      direction: pattern.direction,
      description: pattern.description,
      actualRate,
    };
  }, [tideData, maxStreamRate, springNeapFactor]);

  // Calculate arrow properties for visualization
  const getArrowProps = (ratePercent: number, direction: 'flood' | 'ebb' | 'slack') => {
    const length = (ratePercent / 100) * 40 + 10;
    const angle = direction === 'flood' ? -90 : direction === 'ebb' ? 90 : 0;
    const color = direction === 'flood' ? '#22c55e' : direction === 'ebb' ? '#f59e0b' : '#94a3b8';
    return { length, angle, color };
  };

  if (!selectedStation || !tideData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🌀 Tidal Stream Atlas
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Status */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-medium text-slate-300">Current Stream</h3>
                <p className="text-xs text-slate-500">{selectedStation.name}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Hours from HW</div>
                <div className="text-lg font-bold text-white">
                  {tideData.hoursFromHW >= 0 ? '+' : ''}{tideData.hoursFromHW.toFixed(1)}
                </div>
              </div>
            </div>

            {currentStream && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">Direction</div>
                  <div className={`text-lg font-bold capitalize ${
                    currentStream.direction === 'flood' ? 'text-green-400' :
                    currentStream.direction === 'ebb' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {currentStream.direction}
                  </div>
                </div>
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">Rate</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {currentStream.actualRate.toFixed(1)} kts
                  </div>
                </div>
                <div className="bg-slate-800 rounded p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">Strength</div>
                  <div className="text-lg font-bold text-purple-400">
                    {currentStream.ratePercent}%
                  </div>
                </div>
              </div>
            )}

            {currentStream && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                {currentStream.description}
              </p>
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Maximum Stream Rate (at springs)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.1"
                  value={maxStreamRate}
                  onChange={(e) => setMaxStreamRate(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white w-20 text-right">{maxStreamRate.toFixed(1)} kts</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Spring/Neap Factor
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Neaps</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={springNeapFactor}
                  onChange={(e) => setSpringNeapFactor(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500">Springs</span>
                <span className="text-white w-16 text-right">{(springNeapFactor * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Stream Atlas Grid */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Tidal Stream Pattern</h3>

            <div className="grid grid-cols-7 gap-1">
              {standardStreamPattern.slice(0, 7).map((hour, idx) => {
                const { length, color } = getArrowProps(hour.ratePercent, hour.direction);
                const isNow = Math.round(tideData.hoursFromHW) === hour.hoursFromHW;
                const actualRate = (hour.ratePercent / 100) * maxStreamRate * springNeapFactor;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded text-center ${
                      isNow ? 'bg-blue-900/50 border border-blue-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-300 mb-1">{hour.label}</div>
                    <svg viewBox="0 0 40 50" className="w-10 h-12 mx-auto">
                      {hour.direction === 'slack' ? (
                        <circle cx="20" cy="25" r="4" fill={color} />
                      ) : (
                        <>
                          <line
                            x1="20"
                            y1={25 + length / 2}
                            x2="20"
                            y2={25 - length / 2}
                            stroke={color}
                            strokeWidth="3"
                          />
                          <polygon
                            points={hour.direction === 'flood'
                              ? `20,${25 - length / 2} 15,${25 - length / 2 + 8} 25,${25 - length / 2 + 8}`
                              : `20,${25 + length / 2} 15,${25 + length / 2 - 8} 25,${25 + length / 2 - 8}`
                            }
                            fill={color}
                          />
                        </>
                      )}
                    </svg>
                    <div className="text-xs text-slate-400">{actualRate.toFixed(1)} kts</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-6 gap-1 mt-1">
              {standardStreamPattern.slice(7).map((hour, idx) => {
                const { length, color } = getArrowProps(hour.ratePercent, hour.direction);
                const isNow = Math.round(tideData.hoursFromHW) === hour.hoursFromHW;
                const actualRate = (hour.ratePercent / 100) * maxStreamRate * springNeapFactor;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded text-center ${
                      isNow ? 'bg-blue-900/50 border border-blue-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-300 mb-1">{hour.label}</div>
                    <svg viewBox="0 0 40 50" className="w-10 h-12 mx-auto">
                      {hour.direction === 'slack' ? (
                        <circle cx="20" cy="25" r="4" fill={color} />
                      ) : (
                        <>
                          <line
                            x1="20"
                            y1={25 + length / 2}
                            x2="20"
                            y2={25 - length / 2}
                            stroke={color}
                            strokeWidth="3"
                          />
                          <polygon
                            points={hour.direction === 'ebb'
                              ? `20,${25 + length / 2} 15,${25 + length / 2 - 8} 25,${25 + length / 2 - 8}`
                              : `20,${25 - length / 2} 15,${25 - length / 2 + 8} 25,${25 - length / 2 + 8}`
                            }
                            fill={color}
                          />
                        </>
                      )}
                    </svg>
                    <div className="text-xs text-slate-400">{actualRate.toFixed(1)} kts</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-slate-400">Flood (incoming)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded" />
              <span className="text-slate-400">Ebb (outgoing)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-500 rounded-full" />
              <span className="text-slate-400">Slack</span>
            </div>
          </div>

          {/* Reference Times */}
          {tideData.referenceHW && (
            <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference High Water:</span>
                <span className="text-white">{format(tideData.referenceHW, 'EEE, MMM d HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Tide Height:</span>
                <span className="text-cyan-400">{formatHeight(tideData.currentTide, unitSystem)}</span>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Stream times are referenced to local High Water (HW)</p>
            <p>• Maximum stream typically occurs 3 hours before/after HW</p>
            <p>• Slack water (minimal current) occurs near high and low tide</p>
            <p>• Rates shown are typical; local geography can vary significantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
