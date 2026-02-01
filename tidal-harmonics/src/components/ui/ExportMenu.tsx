import { useState } from 'react';
import { useExport } from '@/hooks/useExport';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { PrintReport } from './PrintReport';

export function ExportMenu() {
  const [showDaysDialog, setShowDaysDialog] = useState(false);
  const [exportDays, setExportDays] = useState(7);
  const station = useHarmonicsStore((s) => s.selectedStation);
  const { exportScreenshot, exportTidePredictions, exportHarmonicConstants } = useExport();

  const handleExportPredictions = () => {
    setShowDaysDialog(true);
  };

  const confirmExport = () => {
    exportTidePredictions(exportDays);
    setShowDaysDialog(false);
  };

  return (
    <>
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400">Export Data</span>
          {station && (
            <span className="text-xs text-slate-500">{station.name}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportScreenshot}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center gap-1"
            title="Save current view as image"
          >
            📷 Screenshot
          </button>

          <button
            onClick={handleExportPredictions}
            disabled={!station}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export tide predictions as CSV"
          >
            📊 Predictions
          </button>

          <button
            onClick={() => {
              exportHarmonicConstants();
            }}
            disabled={!station}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export harmonic constants as CSV"
          >
            📈 Constants
          </button>

          <button
            onClick={() => window.print()}
            disabled={!station}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed print-button"
            title="Print 7-day tide report"
          >
            🖨️ Print
          </button>
        </div>

        <PrintReport />

        {!station && (
          <div className="mt-2 text-xs text-slate-500">
            Select a station to enable CSV export
          </div>
        )}
      </div>

      {/* Days selection dialog */}
      {showDaysDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-700 p-4 max-w-xs w-full mx-4">
            <h3 className="text-white font-medium mb-3">Export Tide Predictions</h3>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                Number of days to export:
              </label>
              <select
                value={exportDays}
                onChange={(e) => setExportDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
              >
                <option value={1}>1 day (24 predictions)</option>
                <option value={7}>7 days (168 predictions)</option>
                <option value={14}>14 days (336 predictions)</option>
                <option value={30}>30 days (720 predictions)</option>
                <option value={90}>90 days (2160 predictions)</option>
                <option value={365}>1 year (8760 predictions)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 mb-4">
              Predictions at hourly intervals in CSV format.
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDaysDialog(false)}
                className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
