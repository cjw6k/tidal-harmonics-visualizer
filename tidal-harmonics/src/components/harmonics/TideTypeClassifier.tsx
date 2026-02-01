import { useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { CONSTITUENTS } from '@/data/constituents';

interface Props {
  onClose: () => void;
}

type TideType = 'semidiurnal' | 'mixed-semidiurnal' | 'mixed-diurnal' | 'diurnal';

interface ConstituentAmplitude {
  symbol: string;
  amplitude: number;
  type: 'diurnal' | 'semidiurnal' | 'long-period';
}

export function TideTypeClassifier({ onClose }: Props) {
  const station = useHarmonicsStore((s) => s.selectedStation);

  const analysis = useMemo(() => {
    if (!station) return null;

    // Categorize constituents by period
    const constituentData: ConstituentAmplitude[] = [];
    let diurnalSum = 0;
    let semidiurnalSum = 0;

    // Key constituents for form factor calculation
    let K1_amp = 0;  // Lunisolar diurnal
    let O1_amp = 0;  // Principal lunar diurnal
    let M2_amp = 0;  // Principal lunar semidiurnal
    let S2_amp = 0;  // Principal solar semidiurnal

    for (const c of station.constituents) {
      const constituent = CONSTITUENTS[c.symbol];
      if (!constituent) continue;

      // Classify by angular speed (degrees per hour)
      // Diurnal: ~13-16°/h (period ~22-28h)
      // Semidiurnal: ~28-31°/h (period ~11-13h)
      // Long-period: <10°/h
      let type: 'diurnal' | 'semidiurnal' | 'long-period';
      const speed = constituent.speed;

      if (speed < 10) {
        type = 'long-period';
      } else if (speed < 20) {
        type = 'diurnal';
        diurnalSum += c.amplitude;
      } else {
        type = 'semidiurnal';
        semidiurnalSum += c.amplitude;
      }

      constituentData.push({
        symbol: c.symbol,
        amplitude: c.amplitude,
        type,
      });

      // Track key constituents
      if (c.symbol === 'K1') K1_amp = c.amplitude;
      if (c.symbol === 'O1') O1_amp = c.amplitude;
      if (c.symbol === 'M2') M2_amp = c.amplitude;
      if (c.symbol === 'S2') S2_amp = c.amplitude;
    }

    // Calculate Form Factor (F) - standard measure of tidal type
    // F = (K1 + O1) / (M2 + S2)
    // F < 0.25: Semidiurnal
    // 0.25 <= F < 1.5: Mixed (predominantly semidiurnal)
    // 1.5 <= F < 3.0: Mixed (predominantly diurnal)
    // F >= 3.0: Diurnal
    const formFactor = (M2_amp + S2_amp) > 0.001
      ? (K1_amp + O1_amp) / (M2_amp + S2_amp)
      : Infinity;

    let tideType: TideType;
    let description: string;
    let characteristics: string[];

    if (formFactor < 0.25) {
      tideType = 'semidiurnal';
      description = 'Two roughly equal high and low tides each day';
      characteristics = [
        'Two high tides and two low tides daily',
        'Consecutive highs/lows are similar height',
        'Tidal period ~12h 25m',
        'Common on Atlantic coasts',
      ];
    } else if (formFactor < 1.5) {
      tideType = 'mixed-semidiurnal';
      description = 'Two unequal high and low tides each day';
      characteristics = [
        'Two high tides and two low tides daily',
        'Significant diurnal inequality (HHWL vs LHWL)',
        'Higher-high and lower-high waters differ',
        'Common on Pacific coasts of Americas',
      ];
    } else if (formFactor < 3.0) {
      tideType = 'mixed-diurnal';
      description = 'Usually one tide per day, sometimes two';
      characteristics = [
        'May have 1 or 2 high/low tides per day',
        'Strong diurnal signal dominates',
        'Highly irregular pattern',
        'Found in some parts of SE Asia',
      ];
    } else {
      tideType = 'diurnal';
      description = 'One high and one low tide each day';
      characteristics = [
        'Single high and low tide per day',
        'Tidal period ~24h 50m',
        'Simpler, more predictable pattern',
        'Found in Gulf of Mexico, some Asian seas',
      ];
    }

    // Find dominant constituents
    const sortedByAmplitude = [...constituentData]
      .filter(c => c.type !== 'long-period')
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5);

    return {
      tideType,
      formFactor,
      description,
      characteristics,
      diurnalSum,
      semidiurnalSum,
      K1_amp,
      O1_amp,
      M2_amp,
      S2_amp,
      dominantConstituents: sortedByAmplitude,
      totalConstituents: constituentData.length,
    };
  }, [station]);

  const getTypeColor = (type: TideType) => {
    switch (type) {
      case 'semidiurnal': return 'text-cyan-400';
      case 'mixed-semidiurnal': return 'text-purple-400';
      case 'mixed-diurnal': return 'text-amber-400';
      case 'diurnal': return 'text-emerald-400';
    }
  };

  const getTypeBgColor = (type: TideType) => {
    switch (type) {
      case 'semidiurnal': return 'bg-cyan-900/30 border-cyan-700';
      case 'mixed-semidiurnal': return 'bg-purple-900/30 border-purple-700';
      case 'mixed-diurnal': return 'bg-amber-900/30 border-amber-700';
      case 'diurnal': return 'bg-emerald-900/30 border-emerald-700';
    }
  };

  const formatTypeName = (type: TideType) => {
    switch (type) {
      case 'semidiurnal': return 'Semidiurnal';
      case 'mixed-semidiurnal': return 'Mixed (Semidiurnal)';
      case 'mixed-diurnal': return 'Mixed (Diurnal)';
      case 'diurnal': return 'Diurnal';
    }
  };

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Tide Type</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Select a station to classify tide type</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm">Tide Type</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <p className="text-slate-400 text-xs">Unable to classify</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">Tide Type Classification</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Classification Result */}
      <div className={`rounded p-3 mb-3 border ${getTypeBgColor(analysis.tideType)}`}>
        <div className={`text-lg font-bold mb-1 ${getTypeColor(analysis.tideType)}`}>
          {formatTypeName(analysis.tideType)}
        </div>
        <div className="text-slate-300 text-sm">
          {analysis.description}
        </div>
      </div>

      {/* Form Factor */}
      <div className="bg-slate-800 rounded p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-xs">Form Factor (F)</span>
          <span className="text-white font-mono text-sm">
            {analysis.formFactor === Infinity ? '∞' : analysis.formFactor.toFixed(2)}
          </span>
        </div>

        {/* Visual Scale */}
        <div className="relative h-6 bg-slate-700 rounded overflow-hidden mb-2">
          <div className="absolute inset-y-0 left-0 w-[10%] bg-cyan-600" title="Semidiurnal"></div>
          <div className="absolute inset-y-0 left-[10%] w-[35%] bg-purple-600" title="Mixed (Semi)"></div>
          <div className="absolute inset-y-0 left-[45%] w-[25%] bg-amber-600" title="Mixed (Diurnal)"></div>
          <div className="absolute inset-y-0 left-[70%] w-[30%] bg-emerald-600" title="Diurnal"></div>

          {/* Marker */}
          {analysis.formFactor !== Infinity && (
            <div
              className="absolute top-0 w-0.5 h-full bg-white shadow-lg"
              style={{
                left: `${Math.min(95, Math.max(2, (analysis.formFactor / 4) * 100))}%`,
              }}
            />
          )}
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>0</span>
          <span>0.25</span>
          <span>1.5</span>
          <span>3.0+</span>
        </div>

        <div className="mt-2 text-slate-500 text-xs">
          F = (K₁ + O₁) / (M₂ + S₂)
        </div>
      </div>

      {/* Key Constituents */}
      <div className="bg-slate-800 rounded p-3 mb-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Key Constituents</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-cyan-400 font-medium">Diurnal</div>
            <div className="text-slate-300">K₁: {(analysis.K1_amp * 100).toFixed(1)} cm</div>
            <div className="text-slate-300">O₁: {(analysis.O1_amp * 100).toFixed(1)} cm</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-purple-400 font-medium">Semidiurnal</div>
            <div className="text-slate-300">M₂: {(analysis.M2_amp * 100).toFixed(1)} cm</div>
            <div className="text-slate-300">S₂: {(analysis.S2_amp * 100).toFixed(1)} cm</div>
          </div>
        </div>
      </div>

      {/* Characteristics */}
      <div className="mb-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Characteristics</div>
        <ul className="space-y-1">
          {analysis.characteristics.map((char, i) => (
            <li key={i} className="flex gap-2 text-xs">
              <span className={getTypeColor(analysis.tideType)}>•</span>
              <span className="text-slate-300">{char}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dominant Constituents Bar */}
      <div className="bg-slate-800 rounded p-3">
        <div className="text-slate-400 text-xs font-medium mb-2">Dominant Constituents</div>
        <div className="space-y-1">
          {analysis.dominantConstituents.map((c, i) => {
            const maxAmp = analysis.dominantConstituents[0]?.amplitude || 1;
            const widthPercent = (c.amplitude / maxAmp) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-400 text-xs w-8">{c.symbol}</span>
                <div className="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                  <div
                    className={`h-full ${
                      c.type === 'diurnal' ? 'bg-cyan-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs w-16 text-right">
                  {(c.amplitude * 100).toFixed(1)} cm
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-cyan-500 rounded"></span>
            <span className="text-slate-500">Diurnal</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-500 rounded"></span>
            <span className="text-slate-500">Semidiurnal</span>
          </span>
        </div>
      </div>
    </div>
  );
}
