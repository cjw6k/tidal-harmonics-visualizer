import { useMemo, useState, useRef } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTide } from '@/lib/harmonics';

interface DiveSlateGeneratorProps {
  onClose: () => void;
}

interface DiveWindow {
  time: Date;
  tide: number;
  visibility: 'best' | 'good' | 'fair' | 'poor';
  current: 'slack' | 'light' | 'moderate' | 'strong';
  currentDirection: 'ebb' | 'flood' | 'slack';
  notes: string[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}


export function DiveSlateGenerator({ onClose }: DiveSlateGeneratorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);
  const slateRef = useRef<HTMLDivElement>(null);

  const [diveDate, setDiveDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [siteName, setSiteName] = useState('');
  const [maxDepth, setMaxDepth] = useState(18);
  const [bottomTime, setBottomTime] = useState(45);
  const [diverName, setDiverName] = useState('');
  const [buddyName, setBuddyName] = useState('');

  const slateData = useMemo(() => {
    if (!selectedStation || !diveDate) return null;

    const date = new Date(diveDate);
    date.setHours(0, 0, 0, 0);
    const diveWindows: DiveWindow[] = [];

    // Generate tide data for every 30 minutes from 5am to 8pm
    for (let hour = 5; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = new Date(date);
        time.setHours(hour, min, 0, 0);

        const tide = predictTide(selectedStation, time);

        // Calculate current rate
        const before = predictTide(selectedStation, new Date(time.getTime() - 30 * 60000));
        const after = predictTide(selectedStation, new Date(time.getTime() + 30 * 60000));
        const rate = Math.abs(after - before); // m per hour (approximately)

        let currentStrength: 'slack' | 'light' | 'moderate' | 'strong';
        if (rate < 0.05) currentStrength = 'slack';
        else if (rate < 0.15) currentStrength = 'light';
        else if (rate < 0.3) currentStrength = 'moderate';
        else currentStrength = 'strong';

        const currentDirection: 'ebb' | 'flood' | 'slack' =
          rate < 0.03 ? 'slack' : (after > before ? 'flood' : 'ebb');

        // Visibility generally better at slack water and high tide
        let visibility: 'best' | 'good' | 'fair' | 'poor';
        if (currentStrength === 'slack' && tide > 2) visibility = 'best';
        else if (currentStrength === 'light' && tide > 1.5) visibility = 'good';
        else if (currentStrength === 'moderate' || tide > 1) visibility = 'fair';
        else visibility = 'poor';

        const notes: string[] = [];
        if (currentStrength === 'slack') notes.push('Optimal dive window');
        if (currentStrength === 'strong') notes.push('Strong current - advanced divers only');
        if (tide < 0.5) notes.push('Shallow - check clearance');

        diveWindows.push({
          time,
          tide,
          visibility,
          current: currentStrength,
          currentDirection,
          notes,
        });
      }
    }

    // Find high and low tides
    let highTide = diveWindows[0];
    let lowTide = diveWindows[0];
    for (const w of diveWindows) {
      if (w.tide > highTide!.tide) highTide = w;
      if (w.tide < lowTide!.tide) lowTide = w;
    }

    // Find best dive windows (slack water)
    const slackWindows = diveWindows.filter(w => w.current === 'slack');

    return {
      diveWindows,
      highTide,
      lowTide,
      slackWindows,
    };
  }, [selectedStation, diveDate]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && slateRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Dive Slate - ${siteName || selectedStation?.name}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { font-size: 24px; margin-bottom: 5px; }
              h2 { font-size: 18px; margin: 15px 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
              th { background: #f0f0f0; }
              .highlight { background: #e6f3ff; font-weight: bold; }
              .warning { color: #c00; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
              .info-box { border: 1px solid #ccc; padding: 10px; }
              .label { font-weight: bold; font-size: 12px; color: #666; }
              .value { font-size: 14px; margin-top: 2px; }
              .safety { background: #fff3cd; padding: 10px; margin: 15px 0; border-left: 4px solid #ffc107; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            ${slateRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatHeight = (m: number) => {
    if (unitSystem === 'metric') return `${m.toFixed(2)} m`;
    return `${(m * 3.28084).toFixed(1)} ft`;
  };

  if (!selectedStation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-lg p-6 text-center">
          <p className="text-slate-400">Select a station to generate dive slate</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-400">🤿 Dive Slate Generator</h3>
            <p className="text-slate-400 text-sm">{selectedStation.name}</p>
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
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Dive Date</label>
            <input
              type="date"
              value={diveDate}
              onChange={(e) => setDiveDate(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder={selectedStation.name}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max Depth ({unitSystem === 'metric' ? 'm' : 'ft'})</label>
            <input
              type="number"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Bottom Time (min)</label>
            <input
              type="number"
              value={bottomTime}
              onChange={(e) => setBottomTime(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Diver Name</label>
            <input
              type="text"
              value={diverName}
              onChange={(e) => setDiverName(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Buddy Name</label>
            <input
              type="text"
              value={buddyName}
              onChange={(e) => setBuddyName(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🖨️ Print Dive Slate
        </button>

        {/* Slate Preview */}
        <div className="flex-1 overflow-y-auto bg-white text-black rounded-lg p-4" ref={slateRef}>
          <h1 style={{ margin: '0 0 5px 0' }}>Dive Slate</h1>
          <p style={{ margin: 0, color: '#666' }}>
            {diveDate ? formatDate(new Date(diveDate)) : 'Select a date'}
          </p>

          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '15px 0' }}>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Site</div>
              <div style={{ fontSize: '14px' }}>{siteName || selectedStation.name}</div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Station</div>
              <div style={{ fontSize: '14px' }}>{selectedStation.name}</div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Diver</div>
              <div style={{ fontSize: '14px' }}>{diverName || '_______________'}</div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Buddy</div>
              <div style={{ fontSize: '14px' }}>{buddyName || '_______________'}</div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Max Depth</div>
              <div style={{ fontSize: '14px' }}>{maxDepth} {unitSystem === 'metric' ? 'm' : 'ft'}</div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Bottom Time</div>
              <div style={{ fontSize: '14px' }}>{bottomTime} min</div>
            </div>
          </div>

          <h2 style={{ fontSize: '16px', borderBottom: '2px solid #333', paddingBottom: '5px', marginTop: '20px' }}>
            Key Tidal Events
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', margin: '10px 0' }}>
            <div style={{ border: '1px solid #ccc', padding: '10px', background: '#e6f3ff' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>High Tide</div>
              <div style={{ fontSize: '14px' }}>
                {slateData?.highTide && formatTime(slateData.highTide.time)}<br/>
                {slateData?.highTide && formatHeight(slateData.highTide.tide)}
              </div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px', background: '#fff3cd' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Low Tide</div>
              <div style={{ fontSize: '14px' }}>
                {slateData?.lowTide && formatTime(slateData.lowTide.time)}<br/>
                {slateData?.lowTide && formatHeight(slateData.lowTide.tide)}
              </div>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px', background: '#d4edda' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Best Visibility</div>
              <div style={{ fontSize: '14px' }}>
                {slateData?.slackWindows && slateData.slackWindows.length > 0
                  ? slateData.slackWindows.map(w => formatTime(w.time)).join(', ')
                  : 'Check table'}
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '16px', borderBottom: '2px solid #333', paddingBottom: '5px', marginTop: '20px' }}>
            Hourly Conditions
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '4px', background: '#f0f0f0' }}>Time</th>
                <th style={{ border: '1px solid #ccc', padding: '4px', background: '#f0f0f0' }}>Tide</th>
                <th style={{ border: '1px solid #ccc', padding: '4px', background: '#f0f0f0' }}>Current</th>
                <th style={{ border: '1px solid #ccc', padding: '4px', background: '#f0f0f0' }}>Direction</th>
                <th style={{ border: '1px solid #ccc', padding: '4px', background: '#f0f0f0' }}>Visibility</th>
              </tr>
            </thead>
            <tbody>
              {slateData?.diveWindows.filter((_, i) => i % 2 === 0).map((w, i) => (
                <tr key={i} style={w.current === 'slack' ? { background: '#e6f3ff', fontWeight: 'bold' } : {}}>
                  <td style={{ border: '1px solid #ccc', padding: '4px' }}>{formatTime(w.time)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px' }}>{formatHeight(w.tide)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px' }}>{w.current}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px' }}>{w.currentDirection}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px' }}>{w.visibility}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: '#fff3cd', padding: '10px', margin: '15px 0', borderLeft: '4px solid #ffc107' }}>
            <strong>⚠️ Safety Reminders:</strong>
            <ul style={{ margin: '5px 0 0 20px', fontSize: '12px' }}>
              <li>Plan dive during slack water for best visibility</li>
              <li>Strong currents can rapidly exceed swimming ability</li>
              <li>Always have surface support aware of tidal conditions</li>
              <li>Check conditions match predictions before entry</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px', fontSize: '11px', color: '#666' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>Entry Time: _______</div>
              <div>Exit Time: _______</div>
              <div>Actual BT: _______</div>
              <div>Start PSI: _______</div>
              <div>End PSI: _______</div>
              <div>Max Depth: _______</div>
            </div>
          </div>

          <p style={{ fontSize: '10px', color: '#999', marginTop: '15px', textAlign: 'center' }}>
            Generated by Tidal Harmonics • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
