import { useState, useMemo, useRef } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format, addHours } from 'date-fns';

interface VoyageLogGeneratorProps {
  onClose: () => void;
}

interface VoyageEntry {
  time: Date;
  event: string;
  tideHeight: number;
  tideState: 'rising' | 'falling' | 'high' | 'low';
  notes: string;
}

export function VoyageLogGenerator({ onClose }: VoyageLogGeneratorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const printRef = useRef<HTMLDivElement>(null);

  // Voyage parameters
  const [vesselName, setVesselName] = useState('');
  const [voyageFrom, setVoyageFrom] = useState('');
  const [voyageTo, setVoyageTo] = useState('');
  const [departureDate, setDepartureDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [voyageDuration, setVoyageDuration] = useState(24); // hours
  const [masterName, setMasterName] = useState('');
  const [vesselDraft, setVesselDraft] = useState(2.0);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Generate voyage log data
  const voyageData = useMemo(() => {
    if (!selectedStation) return null;

    const start = new Date(departureDate);
    const end = addHours(start, voyageDuration);

    // Get tide series (use finer resolution for better extreme detection)
    const series = predictTideSeries(selectedStation, start, end, 10);

    // Get high/low extremes from the series
    const extremes = findExtremes(series);

    // Build voyage entries
    const entries: VoyageEntry[] = [];

    // Add departure
    const departureHeight = series[0]?.height ?? 0;
    const secondPoint = series[1];
    const departureTideState = secondPoint && departureHeight < secondPoint.height ? 'rising' : 'falling';

    entries.push({
      time: start,
      event: 'Departure',
      tideHeight: departureHeight,
      tideState: departureTideState,
      notes: `From ${voyageFrom || 'origin'}`,
    });

    // Add tide extremes during voyage
    for (const extreme of extremes) {
      entries.push({
        time: extreme.time,
        event: extreme.type === 'high' ? 'High Water' : 'Low Water',
        tideHeight: extreme.height,
        tideState: extreme.type,
        notes: '',
      });
    }

    // Add arrival
    const arrivalHeight = series[series.length - 1]?.height ?? 0;
    const priorPoint = series[series.length - 2];
    const arrivalTideState = priorPoint && arrivalHeight > priorPoint.height ? 'rising' : 'falling';

    entries.push({
      time: end,
      event: 'Arrival',
      tideHeight: arrivalHeight,
      tideState: arrivalTideState,
      notes: `At ${voyageTo || 'destination'}`,
    });

    // Sort by time
    entries.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Calculate summary stats
    const heights = series.map(s => s.height);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

    return {
      entries,
      series,
      stats: {
        minHeight,
        maxHeight,
        avgHeight,
        range: maxHeight - minHeight,
      },
    };
  }, [selectedStation, departureDate, voyageDuration, voyageFrom, voyageTo, vesselDraft]);

  const formatHeight = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(2)} m`;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Voyage Tidal Log - ${vesselName || 'Vessel'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            color: #1a1a1a;
          }
          h1 { font-size: 24px; margin-bottom: 4px; }
          h2 { font-size: 18px; color: #666; margin-top: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
          .meta-item { font-size: 14px; }
          .meta-label { color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .stats { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .stat-value { font-size: 20px; font-weight: bold; color: #0066cc; }
          .stat-label { font-size: 12px; color: #666; }
          .notes { margin-top: 20px; padding: 15px; border: 1px solid #ccc; min-height: 100px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <div class="footer">
          Generated on ${format(new Date(), 'PPpp')} | Tidal predictions for ${selectedStation?.name || 'station'}
          <br>
          <em>Predictions are based on harmonic analysis and may not account for meteorological effects.</em>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Voyage Log Generator</h3>
            <p className="text-slate-400 text-sm">
              Generate a printable tidal conditions log for your passage
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

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Voyage Details</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Vessel Name</label>
                <input
                  type="text"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                  placeholder="M/V Example"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">From</label>
                  <input
                    type="text"
                    value={voyageFrom}
                    onChange={(e) => setVoyageFrom(e.target.value)}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    placeholder="Departure port"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">To</label>
                  <input
                    type="text"
                    value={voyageTo}
                    onChange={(e) => setVoyageTo(e.target.value)}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    placeholder="Destination"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Master/Skipper</label>
                <input
                  type="text"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                  placeholder="Name"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Timing & Parameters</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Departure Date/Time</label>
                <input
                  type="datetime-local"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Duration (hours)</label>
                  <input
                    type="number"
                    value={voyageDuration}
                    onChange={(e) => setVoyageDuration(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="1"
                    max="168"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Draft (m)</label>
                  <input
                    type="number"
                    value={vesselDraft}
                    onChange={(e) => setVesselDraft(Number(e.target.value))}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0.5"
                    step="0.1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Reference Station</label>
                <p className="text-sm text-cyan-400">{stationName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-3 mb-4">
          <label className="text-xs text-slate-400">Additional Notes</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full bg-slate-700 rounded px-2 py-1 text-sm h-16 resize-none"
            placeholder="Weather forecast, waypoints, special considerations..."
          />
        </div>

        {/* Print Preview */}
        {voyageData && (
          <>
            <div ref={printRef} className="bg-white text-slate-900 rounded-lg p-4 mb-4">
              <div className="border-b-2 border-slate-300 pb-3 mb-4">
                <h1 className="text-xl font-bold">Voyage Tidal Log</h1>
                <p className="text-slate-600">{vesselName || 'Vessel'}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm">
                <div><span className="text-slate-500">From:</span> {voyageFrom || '-'}</div>
                <div><span className="text-slate-500">To:</span> {voyageTo || '-'}</div>
                <div><span className="text-slate-500">Departure:</span> {format(new Date(departureDate), 'PPp')}</div>
                <div><span className="text-slate-500">Duration:</span> {voyageDuration} hours</div>
                <div><span className="text-slate-500">Master:</span> {masterName || '-'}</div>
                <div><span className="text-slate-500">Draft:</span> {formatHeight(vesselDraft)}</div>
                <div className="col-span-2"><span className="text-slate-500">Reference Station:</span> {stationName}</div>
              </div>

              {/* Tidal Summary */}
              <div className="bg-slate-100 rounded p-3 mb-4">
                <h2 className="text-sm font-semibold mb-2">Tidal Summary</h2>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatHeight(voyageData.stats.minHeight)}</div>
                    <div className="text-xs text-slate-500">Min Height</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatHeight(voyageData.stats.maxHeight)}</div>
                    <div className="text-xs text-slate-500">Max Height</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatHeight(voyageData.stats.range)}</div>
                    <div className="text-xs text-slate-500">Tidal Range</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatHeight(voyageData.stats.avgHeight)}</div>
                    <div className="text-xs text-slate-500">Avg Height</div>
                  </div>
                </div>
              </div>

              {/* Event Log */}
              <h2 className="text-sm font-semibold mb-2">Tidal Events</h2>
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-2 py-1 text-left">Time</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Event</th>
                    <th className="border border-slate-300 px-2 py-1 text-right">Height</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Tide</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {voyageData.entries.map((entry, i) => (
                    <tr key={i} className={entry.event.includes('Water') ? 'bg-blue-50' : ''}>
                      <td className="border border-slate-300 px-2 py-1">
                        {format(entry.time, 'MMM d HH:mm')}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 font-medium">
                        {entry.event}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-right font-mono">
                        {formatHeight(entry.tideHeight)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1">
                        {entry.tideState === 'high' ? '▲ High' :
                         entry.tideState === 'low' ? '▼ Low' :
                         entry.tideState === 'rising' ? '↗ Rising' : '↘ Falling'}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-slate-600">
                        {entry.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Additional Notes */}
              {additionalNotes && (
                <div className="border border-slate-300 rounded p-3">
                  <h2 className="text-sm font-semibold mb-1">Notes</h2>
                  <p className="text-sm whitespace-pre-wrap">{additionalNotes}</p>
                </div>
              )}

              {/* Signature Line */}
              <div className="mt-6 pt-4 border-t border-slate-300">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p className="text-xs text-slate-500">Master's Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-8 mb-1"></div>
                    <p className="text-xs text-slate-500">Date</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>🖨️</span> Print / Save PDF
              </button>
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="mt-4 text-xs text-slate-500">
          <p>
            <strong>Usage:</strong> Fill in voyage details, then click "Print / Save PDF" to generate
            a printable log. In the print dialog, select "Save as PDF" to create a digital copy.
          </p>
          <p className="mt-1">
            <strong>Note:</strong> Tidal predictions may not account for meteorological effects
            (wind, pressure). Always verify with official tide tables and marine weather forecasts.
          </p>
        </div>
      </div>
    </div>
  );
}
