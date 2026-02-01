import { useState } from 'react';
import { useExport } from '@/hooks/useExport';

export function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { exportScreenshot, exportTidePredictions, exportHarmonicConstants } = useExport();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
      >
        <span>📥</span>
        <span>Export</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden min-w-[180px]">
            <button
              onClick={() => {
                exportScreenshot();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <span>📷</span>
              <span>Screenshot (PNG)</span>
            </button>
            <button
              onClick={() => {
                exportTidePredictions(7);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <span>📊</span>
              <span>Tide Predictions (CSV)</span>
            </button>
            <button
              onClick={() => {
                exportHarmonicConstants();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <span>📈</span>
              <span>Harmonic Constants (CSV)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
