import { useCallback } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries, findExtremes } from '@/lib/harmonics';
import { format } from 'date-fns';

export function useExport() {
  const station = useHarmonicsStore((s) => s.selectedStation);

  const exportScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.warn('No canvas found');
      return;
    }

    const link = document.createElement('a');
    link.download = `tidal-harmonics-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const exportTidePredictions = useCallback(
    (daysAhead: number = 7) => {
      if (!station) {
        console.warn('No station selected');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + daysAhead * 24 * 3600000);
      const predictions = predictTideSeries(station, startDate, endDate, 60); // Hourly
      const extremes = findExtremes(predictions);

      // Build CSV
      const rows: string[] = [
        'DateTime,Height (m),Type',
        ...predictions.map((p) => {
          const extreme = extremes.find(
            (e) => Math.abs(e.time.getTime() - p.time.getTime()) < 30 * 60000
          );
          const type = extreme?.type || '';
          return `${format(p.time, 'yyyy-MM-dd HH:mm')},${p.height.toFixed(3)},${type}`;
        }),
      ];

      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `tide-predictions-${station.name.replace(/[^a-z0-9]/gi, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    },
    [station]
  );

  const exportHarmonicConstants = useCallback(() => {
    if (!station) {
      console.warn('No station selected');
      return;
    }

    const rows: string[] = [
      'Constituent,Amplitude (m),Phase (deg)',
      ...station.constituents.map(
        (c) => `${c.symbol},${c.amplitude.toFixed(4)},${c.phase.toFixed(1)}`
      ),
    ];

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `harmonic-constants-${station.name.replace(/[^a-z0-9]/gi, '-')}.csv`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }, [station]);

  return {
    exportScreenshot,
    exportTidePredictions,
    exportHarmonicConstants,
  };
}
