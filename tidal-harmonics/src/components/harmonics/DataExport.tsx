import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';
import { predictTideSeries, findExtremes, getConstituentContributions } from '@/lib/harmonics';

/**
 * Data Export Panel
 *
 * Allows users to export tide data in various formats:
 * - Tide predictions (CSV with timestamps and heights)
 * - High/low extremes (CSV)
 * - Constituent data for the station (CSV)
 * - Full state as JSON (for developers/researchers)
 */

type ExportFormat = 'predictions' | 'extremes' | 'calendar' | 'constituents' | 'json';
type DateRange = '24h' | '48h' | '7d' | '30d' | 'custom';

// Generate ICS-formatted date (UTC)
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Generate a unique ID for ICS events
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@tidal-harmonics`;
}

interface DataExportProps {
  onClose?: () => void;
}

export function DataExport({ onClose }: DataExportProps) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('predictions');
  const [dateRange, setDateRange] = useState<DateRange>('48h');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [interval, setInterval] = useState(10); // minutes
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = now;
    let end = now;

    switch (dateRange) {
      case '24h':
        end = new Date(now.getTime() + 24 * 3600000);
        break;
      case '48h':
        end = new Date(now.getTime() + 48 * 3600000);
        break;
      case '7d':
        end = new Date(now.getTime() + 7 * 24 * 3600000);
        break;
      case '30d':
        end = new Date(now.getTime() + 30 * 24 * 3600000);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          end = new Date(customEnd);
        }
        break;
    }

    return { startDate: start, endDate: end };
  }, [dateRange, customStart, customEnd]);

  // Preview row count
  const previewRowCount = useMemo(() => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const intervalMs = interval * 60 * 1000;
    return Math.ceil(durationMs / intervalMs);
  }, [startDate, endDate, interval]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!station) return;
    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const stationId = station.id.replace(/[^a-zA-Z0-9]/g, '_');

      switch (exportFormat) {
        case 'predictions': {
          const series = predictTideSeries(station, startDate, endDate, interval);
          const csv = [
            'datetime_utc,datetime_local,height_meters,height_feet',
            ...series.map((p) => {
              const utc = p.time.toISOString();
              const local = p.time.toLocaleString();
              const heightM = p.height.toFixed(3);
              const heightFt = (p.height * 3.28084).toFixed(3);
              return `${utc},"${local}",${heightM},${heightFt}`;
            }),
          ].join('\n');

          downloadFile(
            csv,
            `tide_predictions_${stationId}_${timestamp}.csv`,
            'text/csv'
          );
          break;
        }

        case 'extremes': {
          const series = predictTideSeries(station, startDate, endDate, 6); // 6-minute interval for better extremes
          const extremes = findExtremes(series);
          const csv = [
            'datetime_utc,datetime_local,type,height_meters,height_feet',
            ...extremes.map((e) => {
              const utc = e.time.toISOString();
              const local = e.time.toLocaleString();
              const heightM = e.height.toFixed(3);
              const heightFt = (e.height * 3.28084).toFixed(3);
              return `${utc},"${local}",${e.type},${heightM},${heightFt}`;
            }),
          ].join('\n');

          downloadFile(
            csv,
            `tide_extremes_${stationId}_${timestamp}.csv`,
            'text/csv'
          );
          break;
        }

        case 'calendar': {
          const series = predictTideSeries(station, startDate, endDate, 6);
          const extremes = findExtremes(series);

          const icsEvents = extremes.map((e) => {
            const eventStart = formatICSDate(e.time);
            // Events last 30 minutes for visibility
            const eventEnd = formatICSDate(new Date(e.time.getTime() + 30 * 60000));
            const heightM = e.height.toFixed(2);
            const heightFt = (e.height * 3.28084).toFixed(2);
            const typeLabel = e.type === 'high' ? 'High Tide' : 'Low Tide';
            const emoji = e.type === 'high' ? '🌊' : '🏖️';

            return [
              'BEGIN:VEVENT',
              `UID:${generateUID()}`,
              `DTSTAMP:${formatICSDate(new Date())}`,
              `DTSTART:${eventStart}`,
              `DTEND:${eventEnd}`,
              `SUMMARY:${emoji} ${typeLabel} - ${station.name}`,
              `DESCRIPTION:${typeLabel} at ${station.name}\\nHeight: ${heightM}m (${heightFt}ft)\\nDatum: ${station.datum}`,
              `LOCATION:${station.name}, ${station.state || station.country}`,
              `CATEGORIES:TIDES,${e.type.toUpperCase()}`,
              'END:VEVENT',
            ].join('\r\n');
          });

          const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Tidal Harmonics//Tide Predictions//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:Tides - ${station.name}`,
            'X-WR-TIMEZONE:UTC',
            ...icsEvents,
            'END:VCALENDAR',
          ].join('\r\n');

          downloadFile(
            icsContent,
            `tides_${stationId}_${timestamp}.ics`,
            'text/calendar'
          );
          break;
        }

        case 'constituents': {
          const contributions = getConstituentContributions(station, new Date());
          const csv = [
            'symbol,name,family,amplitude_m,phase_deg,speed_deg_hr,period_hours,current_contribution_m',
            ...station.constituents.map((c) => {
              const constituent = CONSTITUENTS[c.symbol];
              const contribution = contributions.find((cc) => cc.symbol === c.symbol);
              return [
                c.symbol,
                `"${constituent?.name || 'Unknown'}"`,
                constituent?.family || 'unknown',
                c.amplitude.toFixed(4),
                c.phase.toFixed(2),
                constituent?.speed.toFixed(6) || '',
                constituent?.period.toFixed(4) || '',
                contribution?.contribution.toFixed(4) || '',
              ].join(',');
            }),
          ].join('\n');

          downloadFile(
            csv,
            `constituents_${stationId}_${timestamp}.csv`,
            'text/csv'
          );
          break;
        }

        case 'json': {
          const data = {
            exportDate: new Date().toISOString(),
            station: {
              id: station.id,
              name: station.name,
              state: station.state,
              country: station.country,
              coordinates: { lat: station.lat, lon: station.lon },
              timezone: station.timezone,
              datum: station.datum,
              harmonicEpoch: station.harmonicEpoch,
            },
            constituents: station.constituents.map((c) => {
              const constituent = CONSTITUENTS[c.symbol];
              return {
                symbol: c.symbol,
                name: constituent?.name,
                family: constituent?.family,
                amplitude: c.amplitude,
                phase: c.phase,
                speed: constituent?.speed,
                period: constituent?.period,
                doodson: constituent?.doodson,
              };
            }),
            visibleConstituents,
            predictions: {
              timeRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                intervalMinutes: interval,
              },
              series: predictTideSeries(station, startDate, endDate, interval).map((p) => ({
                time: p.time.toISOString(),
                height: p.height,
              })),
            },
          };

          downloadFile(
            JSON.stringify(data, null, 2),
            `tide_data_${stationId}_${timestamp}.json`,
            'application/json'
          );
          break;
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 text-center text-slate-500">
        Select a station to export data
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Export Data</h2>
            <p className="text-slate-400 text-sm">
              {station.name}, {station.state || station.country}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'predictions', label: 'Predictions', desc: 'Time series of heights' },
                { value: 'extremes', label: 'High/Low CSV', desc: 'High and low tides only' },
                { value: 'calendar', label: 'Calendar', desc: 'ICS for calendar apps' },
                { value: 'constituents', label: 'Constituents', desc: 'Harmonic constants' },
                { value: 'json', label: 'Full JSON', desc: 'Complete data package' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExportFormat(opt.value as ExportFormat)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    exportFormat === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className={`text-xs ${exportFormat === opt.value ? 'text-blue-200' : 'text-slate-500'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Range (for predictions, extremes, and calendar) */}
          {(exportFormat === 'predictions' || exportFormat === 'extremes' || exportFormat === 'calendar' || exportFormat === 'json') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time Range
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { value: '24h', label: '24 hours' },
                  { value: '48h', label: '48 hours' },
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: 'custom', label: 'Custom' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value as DateRange)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      dateRange === opt.value
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Start</label>
                    <input
                      type="datetime-local"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End</label>
                    <input
                      type="datetime-local"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interval (for predictions) */}
          {exportFormat === 'predictions' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interval: {interval} minutes
              </label>
              <input
                type="range"
                min={1}
                max={60}
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 min</span>
                <span>15 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Preview</h4>
            <div className="text-xs text-slate-400 space-y-1">
              {exportFormat === 'predictions' && (
                <>
                  <p>Rows: ~{previewRowCount.toLocaleString()}</p>
                  <p>From: {startDate.toLocaleString()}</p>
                  <p>To: {endDate.toLocaleString()}</p>
                  <p>Format: CSV (datetime, height in m and ft)</p>
                </>
              )}
              {exportFormat === 'extremes' && (
                <>
                  <p>Estimated high/lows: ~{Math.ceil((endDate.getTime() - startDate.getTime()) / (6 * 3600000))}</p>
                  <p>From: {startDate.toLocaleString()}</p>
                  <p>To: {endDate.toLocaleString()}</p>
                  <p>Format: CSV (datetime, type, height)</p>
                </>
              )}
              {exportFormat === 'calendar' && (
                <>
                  <p>Events: ~{Math.ceil((endDate.getTime() - startDate.getTime()) / (6 * 3600000))} high/low tides</p>
                  <p>From: {startDate.toLocaleString()}</p>
                  <p>To: {endDate.toLocaleString()}</p>
                  <p>Format: ICS (Apple Calendar, Google Calendar, Outlook)</p>
                </>
              )}
              {exportFormat === 'constituents' && (
                <>
                  <p>Constituents: {station.constituents.length}</p>
                  <p>Includes: symbol, name, amplitude, phase, speed, period</p>
                  <p>Format: CSV</p>
                </>
              )}
              {exportFormat === 'json' && (
                <>
                  <p>Complete station data + predictions</p>
                  <p>Predictions: ~{previewRowCount.toLocaleString()} points</p>
                  <p>Format: JSON (human-readable)</p>
                </>
              )}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isExporting
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isExporting ? 'Generating...' : 'Download'}
          </button>

          {/* Attribution */}
          <p className="text-xs text-slate-500 text-center">
            Predictions generated using harmonic analysis. Data is for educational
            purposes only. For navigation, use official NOAA predictions.
          </p>
        </div>
      </div>
    </div>
  );
}
