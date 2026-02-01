import { useState } from 'react';
import { CONSTITUENTS } from '@/data/constituents';
import { getConstituentDetail, CONSTITUENT_GROUPS } from '@/data/constituentEncyclopedia';

interface ConstituentInfoPanelProps {
  symbol: string | null;
  onClose: () => void;
}

export function ConstituentInfoPanel({ symbol, onClose }: ConstituentInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'physics' | 'math'>('overview');

  if (!symbol) return null;

  const constituent = CONSTITUENTS[symbol];
  const detail = getConstituentDetail(symbol);

  if (!constituent) return null;

  // Find which group this constituent belongs to
  const group = Object.entries(CONSTITUENT_GROUPS).find(([, g]) =>
    g.constituents.includes(symbol)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white">{symbol}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                constituent.family === 'semidiurnal' ? 'bg-blue-500/20 text-blue-400' :
                constituent.family === 'diurnal' ? 'bg-green-500/20 text-green-400' :
                constituent.family === 'long-period' ? 'bg-purple-500/20 text-purple-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {constituent.family}
              </span>
            </div>
            <p className="text-slate-400 mt-1">{constituent.name}</p>
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

        {/* Stats bar */}
        <div className="px-6 py-3 bg-slate-800/50 flex gap-6 text-sm border-b border-slate-700">
          <div>
            <span className="text-slate-500">Period:</span>
            <span className="text-white ml-2">{formatPeriod(constituent.period)}</span>
          </div>
          <div>
            <span className="text-slate-500">Speed:</span>
            <span className="text-white ml-2">{constituent.speed.toFixed(4)}°/hr</span>
          </div>
          {detail?.typicalAmplitudePercent !== undefined && (
            <div>
              <span className="text-slate-500">Typical size:</span>
              <span className="text-white ml-2">{detail.typicalAmplitudePercent}% of M2</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-700">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'physics'} onClick={() => setActiveTab('physics')}>
            Physical Cause
          </TabButton>
          <TabButton active={activeTab === 'math'} onClick={() => setActiveTab('math')}>
            Mathematics
          </TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">{constituent.description}</p>

              {group && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Group: {group[1].name}</h4>
                  <p className="text-slate-500 text-sm">{group[1].explanation}</p>
                </div>
              )}

              {detail?.relatedConstituents && detail.relatedConstituents.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Related Constituents</h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.relatedConstituents.map(rel => (
                      <span key={rel} className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300">
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail?.practicalSignificance && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-400 mb-1">Practical Significance</h4>
                  <p className="text-slate-300 text-sm">{detail.practicalSignificance}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-4">
              {detail ? (
                <>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Physical Cause</h4>
                    <p className="text-white">{detail.physicalCause}</p>
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                      {detail.explanation}
                    </p>
                  </div>

                  {detail.historicalNotes && (
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <h4 className="text-sm font-medium text-amber-400 mb-1">Historical Note</h4>
                      <p className="text-slate-300 text-sm">{detail.historicalNotes}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500">Detailed physical explanation not yet available for this constituent.</p>
              )}
            </div>
          )}

          {activeTab === 'math' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Doodson Numbers</h4>
                <div className="font-mono text-white text-lg">
                  [{constituent.doodson.join(', ')}]
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  [T, s, h, p, N', p'] - coefficients for mean lunar time, lunar longitude,
                  solar longitude, lunar perigee, lunar node, solar perigee
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Angular Speed</h4>
                <div className="font-mono text-white">
                  ω = {constituent.speed.toFixed(6)}°/hour
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  = {(constituent.speed / 15).toFixed(6)} cycles per hour
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Period</h4>
                <div className="font-mono text-white">
                  T = {constituent.period.toFixed(4)} hours
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  = {formatPeriod(constituent.period)}
                </div>
              </div>

              {detail?.mathematicalNotes && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <h4 className="text-sm font-medium text-cyan-400 mb-1">Mathematical Notes</h4>
                  <p className="text-slate-300 text-sm font-mono">{detail.mathematicalNotes}</p>
                </div>
              )}

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Tide Height Contribution</h4>
                <p className="text-slate-300 text-sm font-mono">
                  h(t) = A × f × cos(ωt + V₀ + u - κ)
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Where A = amplitude, f = nodal factor, ω = speed, V₀ = equilibrium argument,
                  u = nodal phase correction, κ = Greenwich phase lag
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors relative ${
        active ? 'text-white' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}
    </button>
  );
}

function formatPeriod(hours: number): string {
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  } else if (hours < 24 * 30) {
    const days = hours / 24;
    return `${days.toFixed(2)} days`;
  } else if (hours < 24 * 365) {
    const months = hours / (24 * 30.44);
    return `${months.toFixed(1)} months`;
  } else {
    const years = hours / (24 * 365.25);
    return `${years.toFixed(2)} years`;
  }
}
