import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { findExtremes, predictTideSeries } from '@/lib/harmonics';
import { addHours, format, differenceInHours } from 'date-fns';
import { formatHeight } from '@/lib/units';

/**
 * TideTimeline
 *
 * A horizontal timeline showing the next 24 hours of tide levels.
 * Shows current position, high/low markers, and visual wave representation.
 */
export function TideTimeline() {
  const epoch = useTimeStore((s) => s.epoch);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  const timelineData = useMemo(() => {
    if (!station) return null;

    const now = new Date(epoch);
    const start = now;
    const end = addHours(now, 24);

    // Get predictions at 30-minute intervals for smooth curve
    const series = predictTideSeries(station, start, end, 30);
    const extremes = findExtremes(series);

    // Find min/max for scaling
    const heights = series.map((p) => p.height);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    const range = maxHeight - minHeight || 1;

    // Normalize heights to 0-1 range
    const normalizedSeries = series.map((p) => ({
      ...p,
      normalized: (p.height - minHeight) / range,
    }));

    // Filter extremes to only those in our window
    const windowExtremes = extremes.filter(
      (e) => e.time >= start && e.time <= end
    );

    return {
      series: normalizedSeries,
      extremes: windowExtremes,
      minHeight,
      maxHeight,
      range,
      start,
      end,
    };
  }, [epoch, station]);

  if (!station || !timelineData) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view tide timeline
      </div>
    );
  }

  const { series, extremes, minHeight, maxHeight, start, end } = timelineData;

  // Create SVG path from series
  const pathPoints = series
    .map((point, i) => {
      const x = (i / (series.length - 1)) * 100;
      const y = 100 - point.normalized * 80 - 10; // Leave margin
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Fill path (closed at bottom)
  const fillPath = `${pathPoints} L 100 100 L 0 100 Z`;

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>📈</span>
        24-Hour Tide Timeline
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        Tide levels at {station.name} for the next 24 hours
      </p>

      {/* Timeline visualization */}
      <div className="relative bg-slate-800/50 rounded-lg overflow-hidden" style={{ height: '120px' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Water gradient fill */}
          <defs>
            <linearGradient id="timelineWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#164e63" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Fill area under curve */}
          <path d={fillPath} fill="url(#timelineWaterGrad)" />

          {/* Tide curve line */}
          <path
            d={pathPoints}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Current time marker */}
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="100"
            stroke="#f59e0b"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2,2"
          />

          {/* Hour grid lines */}
          {[6, 12, 18].map((hour) => {
            const x = (hour / 24) * 100;
            return (
              <line
                key={hour}
                x1={x}
                y1="0"
                x2={x}
                y2="100"
                stroke="#334155"
                strokeWidth="0.3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* High/Low markers */}
          {extremes.map((extreme, i) => {
            const hoursFromStart = differenceInHours(extreme.time, start);
            const x = (hoursFromStart / 24) * 100;
            const normalizedHeight = (extreme.height - minHeight) / (maxHeight - minHeight || 1);
            const y = 100 - normalizedHeight * 80 - 10;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  className={extreme.type === 'high' ? 'fill-blue-400' : 'fill-amber-400'}
                />
                {/* Vertical line to bottom */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2="100"
                  stroke={extreme.type === 'high' ? '#60a5fa' : '#fbbf24'}
                  strokeWidth="0.3"
                  strokeDasharray="1,1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-1 top-1 text-[10px] text-blue-400">
          {formatHeight(maxHeight, unitSystem)}
        </div>
        <div className="absolute left-1 bottom-1 text-[10px] text-amber-400">
          {formatHeight(minHeight, unitSystem)}
        </div>

        {/* "Now" label */}
        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[8px] text-amber-400 font-medium">
          NOW
        </div>
      </div>

      {/* Time axis labels */}
      <div className="flex justify-between mt-1 text-[10px] text-slate-500">
        <span>{format(start, 'h a')}</span>
        <span>{format(addHours(start, 6), 'h a')}</span>
        <span>{format(addHours(start, 12), 'h a')}</span>
        <span>{format(addHours(start, 18), 'h a')}</span>
        <span>{format(end, 'h a')}</span>
      </div>

      {/* Extreme events list */}
      <div className="mt-3 space-y-1">
        {extremes.slice(0, 4).map((extreme, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs bg-slate-800/30 rounded px-2 py-1"
          >
            <div className="flex items-center gap-2">
              <span className={extreme.type === 'high' ? 'text-blue-400' : 'text-amber-400'}>
                {extreme.type === 'high' ? '▲' : '▼'}
              </span>
              <span className="text-slate-300">
                {extreme.type === 'high' ? 'High' : 'Low'} Tide
              </span>
            </div>
            <span className="text-slate-400">{format(extreme.time, 'h:mm a')}</span>
            <span className="text-white font-mono w-16 text-right">
              {formatHeight(extreme.height, unitSystem)}
            </span>
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">Tip:</strong>
        {' '}The timeline shows predicted tide levels based on harmonic constituents.
        Actual levels may vary due to weather and atmospheric pressure.
      </div>
    </div>
  );
}
