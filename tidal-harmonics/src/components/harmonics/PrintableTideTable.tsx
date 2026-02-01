import { useMemo, useState, useRef } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';

interface TideExtreme {
  time: Date;
  height: number;
  type: 'high' | 'low';
}

interface DayData {
  date: Date;
  extremes: TideExtreme[];
  sunrise?: string;
  sunset?: string;
}

interface Props {
  onClose: () => void;
}

export function PrintableTideTable({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0] ?? today.toISOString().slice(0, 10);
  });
  const printRef = useRef<HTMLDivElement>(null);

  const useMetric = unitSystem === 'metric';

  // Calculate tide extremes for selected period
  const tableData = useMemo((): DayData[] => {
    if (!station) return [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const result: DayData[] = [];

    for (let d = 0; d < days; d++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Generate tide series for the day at 6-minute intervals
      const series = predictTideSeries(station, dayStart, dayEnd, 6);
      const extremes = findExtremes(series);

      result.push({
        date: dayStart,
        extremes: extremes.map(e => ({
          time: e.time,
          height: e.height,
          type: e.type
        }))
      });
    }

    return result;
  }, [station, startDate, days]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatHeight = (meters: number) => {
    if (useMetric) {
      return `${meters.toFixed(2)} m`;
    }
    return `${(meters * 3.28084).toFixed(2)} ft`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!station) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header - hidden in print */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Printable Tide Table</h2>
            <p className="text-sm text-gray-500">{station.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Controls - hidden in print */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 print:hidden">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value={7}>1 Week</option>
                <option value={14}>2 Weeks</option>
                <option value={30}>1 Month</option>
              </select>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="p-4 print:p-0">
          {/* Print header */}
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold text-center">{station.name}</h1>
            <p className="text-center text-gray-600">
              Tide Predictions • {formatDate(new Date(startDate))} - {formatDate(tableData[tableData.length - 1]?.date || new Date())}
            </p>
            <p className="text-center text-sm text-gray-500 mt-1">
              Heights in {useMetric ? 'meters' : 'feet'} relative to MLLW
            </p>
          </div>

          {/* Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-gray-300 px-3 py-2 text-left text-gray-900 font-semibold">
                  Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-gray-900 font-semibold" colSpan={2}>
                  Tide 1
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-gray-900 font-semibold" colSpan={2}>
                  Tide 2
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-gray-900 font-semibold" colSpan={2}>
                  Tide 3
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-gray-900 font-semibold" colSpan={2}>
                  Tide 4
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-1"></th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Time</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Height</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Time</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Height</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Time</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Height</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Time</th>
                <th className="border border-gray-300 px-2 py-1 text-xs text-gray-600">Height</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((day, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    {formatDate(day.date)}
                  </td>
                  {[0, 1, 2, 3].map((i) => {
                    const extreme = day.extremes[i];
                    if (!extreme) {
                      return (
                        <td key={`${idx}-${i}-empty`} colSpan={2} className="border border-gray-300 px-2 py-2 text-center text-gray-400">
                          —
                        </td>
                      );
                    }
                    return [
                      <td
                        key={`${idx}-${i}-time`}
                        className={`border border-gray-300 px-2 py-2 text-center text-sm ${
                          extreme.type === 'high' ? 'text-blue-700 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {formatTime(extreme.time)}
                        <span className="text-xs ml-1">{extreme.type === 'high' ? 'H' : 'L'}</span>
                      </td>,
                      <td
                        key={`${idx}-${i}-height`}
                        className={`border border-gray-300 px-2 py-2 text-center text-sm ${
                          extreme.type === 'high' ? 'text-blue-700 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {formatHeight(extreme.height)}
                      </td>
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="mt-4 text-xs text-gray-500 print:text-gray-700">
            <p className="font-medium mb-1">Notes:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>H = High tide, L = Low tide</li>
              <li>Times are in local timezone</li>
              <li>Heights are relative to Mean Lower Low Water (MLLW)</li>
              <li>Predictions may vary from actual conditions due to weather</li>
            </ul>
          </div>

          {/* Print footer */}
          <div className="hidden print:block mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>Generated by Tidal Harmonics Visualizer • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .fixed {
              position: static !important;
            }
            .bg-black\\/50 {
              background: none !important;
            }
            .bg-white {
              box-shadow: none !important;
            }
            .max-h-\\[90vh\\] {
              max-height: none !important;
            }
            .overflow-auto {
              overflow: visible !important;
            }
            ${printRef.current ? `
              [data-print-area], [data-print-area] * {
                visibility: visible;
              }
            ` : ''}
          }
        `}</style>
      </div>
    </div>
  );
}
