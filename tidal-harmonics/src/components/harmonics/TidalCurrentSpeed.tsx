import { useMemo, useState } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CurrentData {
  time: string;
  hour: number;
  speed: number;
  direction: 'flood' | 'ebb' | 'slack';
}

interface Props {
  onClose: () => void;
}

export function TidalCurrentSpeed({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const [channelFactor, setChannelFactor] = useState(1.0); // Multiplier for narrow channels

  // Calculate current speed throughout the day
  const currentData = useMemo((): CurrentData[] => {
    if (!station) return [];

    const data: CurrentData[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const deltaMs = 5 * 60 * 1000; // 5 minute delta for rate calculation

    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 10) {
        const time = new Date(now.getTime() + hour * 3600000 + min * 60000);
        const before = predictTide(station, new Date(time.getTime() - deltaMs));
        const after = predictTide(station, new Date(time.getTime() + deltaMs));

        // Rate of change in m/hr
        const rate = ((after - before) / (2 * deltaMs)) * 3600000;

        // Convert to current speed estimate
        // This is a rough approximation - actual current depends on local geography
        // Typical ratio is ~50-100 of tide rate to current speed
        const speedFactor = 60 * channelFactor; // knots per m/hr tide change
        const speed = Math.abs(rate) * speedFactor;

        let direction: 'flood' | 'ebb' | 'slack';
        if (Math.abs(speed) < 0.2) {
          direction = 'slack';
        } else if (rate > 0) {
          direction = 'flood';
        } else {
          direction = 'ebb';
        }

        data.push({
          time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
          hour: hour + min / 60,
          speed: speed,
          direction,
        });
      }
    }

    return data;
  }, [station, channelFactor]);

  // Current conditions
  const currentNow = useMemo(() => {
    if (!station) return null;

    const now = new Date();
    const deltaMs = 5 * 60 * 1000;
    const before = predictTide(station, new Date(now.getTime() - deltaMs));
    const after = predictTide(station, new Date(now.getTime() + deltaMs));

    const rate = ((after - before) / (2 * deltaMs)) * 3600000;
    const speedFactor = 60 * channelFactor;
    const speed = Math.abs(rate) * speedFactor;

    let direction: 'flood' | 'ebb' | 'slack';
    if (Math.abs(speed) < 0.2) {
      direction = 'slack';
    } else if (rate > 0) {
      direction = 'flood';
    } else {
      direction = 'ebb';
    }

    // Find next slack
    const searchIntervalMs = 10 * 60 * 1000;
    let nextSlack: Date | null = null;
    let prevRate = rate;

    for (let offset = searchIntervalMs; offset < 12 * 3600000; offset += searchIntervalMs) {
      const futureTime = new Date(now.getTime() + offset);
      const futureBefore = predictTide(station, new Date(futureTime.getTime() - deltaMs));
      const futureAfter = predictTide(station, new Date(futureTime.getTime() + deltaMs));
      const futureRate = ((futureAfter - futureBefore) / (2 * deltaMs)) * 3600000;

      if ((prevRate > 0 && futureRate < 0) || (prevRate < 0 && futureRate > 0)) {
        nextSlack = futureTime;
        break;
      }
      prevRate = futureRate;
    }

    return {
      speed,
      direction,
      nextSlack,
    };
  }, [station, channelFactor]);

  // Find max speed
  const maxSpeed = useMemo(() => {
    return Math.max(...currentData.map((d) => d.speed), 1);
  }, [currentData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const getDirectionLabel = (dir: string) => {
    switch (dir) {
      case 'flood':
        return 'Flooding';
      case 'ebb':
        return 'Ebbing';
      default:
        return 'Slack';
    }
  };

  const getDirectionColor = (dir: string) => {
    switch (dir) {
      case 'flood':
        return 'text-blue-400';
      case 'ebb':
        return 'text-orange-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (!station) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Tidal Current Speed</h2>
            <p className="text-sm text-slate-400">Estimated current velocity</p>
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
          {currentNow && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">Current Status</div>
                  <div className={`text-2xl font-bold ${getDirectionColor(currentNow.direction)}`}>
                    {currentNow.speed.toFixed(1)} knots
                  </div>
                  <div className={`text-sm ${getDirectionColor(currentNow.direction)}`}>
                    {getDirectionLabel(currentNow.direction)}
                  </div>
                </div>
                {currentNow.nextSlack && (
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Next Slack</div>
                    <div className="text-white font-medium">
                      {formatTime(currentNow.nextSlack)}
                    </div>
                    <div className="text-xs text-slate-500">
                      in {formatTimeUntil(currentNow.nextSlack)}
                    </div>
                  </div>
                )}
              </div>

              {/* Speed bar */}
              <div className="mt-4">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentNow.direction === 'flood'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                        : currentNow.direction === 'ebb'
                        ? 'bg-gradient-to-r from-orange-600 to-orange-400'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min((currentNow.speed / maxSpeed) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>{maxSpeed.toFixed(1)} kn (max today)</span>
                </div>
              </div>
            </div>
          )}

          {/* Channel Factor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">Channel Factor</label>
              <span className="text-white font-mono">{channelFactor.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={channelFactor}
              onChange={(e) => setChannelFactor(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Open water</span>
              <span>Narrow channel</span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-3">Today's Current Forecast</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => value.split(':')[0] + ':00'}
                  interval={5}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => `${value.toFixed(1)}`}
                  label={{
                    value: 'knots',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => {
                    if (value === undefined || value === null) return ['—', 'Speed'];
                    return [`${Number(value).toFixed(1)} knots`, 'Speed'];
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="#3b82f6"
                  fill="url(#speedGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-slate-300">Flood (incoming)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-slate-300">Ebb (outgoing)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-slate-300">Slack</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-400 mb-1">Estimation Only</p>
            <p className="text-slate-300">
              These are rough estimates based on tide height changes. Actual currents depend
              heavily on local geography, channel width, and depth. For navigation, always
              consult official current tables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
