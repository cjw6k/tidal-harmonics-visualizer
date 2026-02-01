import { useState, useMemo } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';
import { predictTideSeries } from '@/lib/harmonics';
import { addHours } from 'date-fns';

interface MooringLineCalculatorProps {
  onClose: () => void;
}

interface VesselConfig {
  displacement: number; // tonnes
  beam: number; // meters
  length: number; // meters
  windageArea: number; // m²
  draftLoaded: number; // meters
}

interface MooringConfig {
  lineLength: number; // meters
  lineDiameter: number; // mm
  lineType: 'nylon' | 'polyester' | 'polypropylene' | 'chain';
  bollardHeight: number; // meters above deck
  fairleadHeight: number; // meters above waterline
  numLines: number;
}

const LINE_PROPERTIES = {
  nylon: {
    elasticity: 0.30, // stretch at break
    breakingStrength: 25, // kN per cm²
    name: 'Nylon (3-strand)',
    safetyFactor: 6
  },
  polyester: {
    elasticity: 0.15,
    breakingStrength: 30,
    name: 'Polyester (double braid)',
    safetyFactor: 5
  },
  polypropylene: {
    elasticity: 0.20,
    breakingStrength: 15,
    name: 'Polypropylene',
    safetyFactor: 6
  },
  chain: {
    elasticity: 0.01,
    breakingStrength: 80,
    name: 'Chain (Grade 43)',
    safetyFactor: 4
  },
};

export function MooringLineCalculator({ onClose }: MooringLineCalculatorProps) {
  const selectedStation = useHarmonicsStore((s) => s.selectedStation);
  const unitSystem = useHarmonicsStore((s) => s.unitSystem);

  // Vessel configuration
  const [vessel, setVessel] = useState<VesselConfig>({
    displacement: 50,
    beam: 5,
    length: 15,
    windageArea: 30,
    draftLoaded: 2,
  });

  // Mooring configuration
  const [mooring, setMooring] = useState<MooringConfig>({
    lineLength: 20,
    lineDiameter: 20,
    lineType: 'nylon',
    bollardHeight: 3,
    fairleadHeight: 1,
    numLines: 4,
  });

  // Environmental conditions
  const [windSpeed, setWindSpeed] = useState(20); // knots
  const [currentSpeed, setCurrentSpeed] = useState(1); // knots

  // Calculate tidal range and extremes for next 24 hours
  const tidalAnalysis = useMemo(() => {
    if (!selectedStation) {
      return { min: 0, max: 2, range: 2, currentHeight: 1, avgRange: 2 };
    }

    const now = new Date();
    const end = addHours(now, 24);
    const series = predictTideSeries(selectedStation, now, end, 10);

    let min = Infinity;
    let max = -Infinity;

    for (const point of series) {
      if (point.height < min) min = point.height;
      if (point.height > max) max = point.height;
    }

    const currentHeight = series[0]?.height ?? 1;
    const range = max - min;

    return { min, max, range, currentHeight, avgRange: range };
  }, [selectedStation]);

  // Calculate line loads
  const lineCalculations = useMemo(() => {
    const lineProps = LINE_PROPERTIES[mooring.lineType];

    // Line cross-sectional area (mm² to cm²)
    const lineArea = Math.PI * Math.pow(mooring.lineDiameter / 2, 2) / 100;

    // Breaking strength of one line
    const breakingStrength = lineArea * lineProps.breakingStrength;

    // Safe working load
    const safeWorkingLoad = breakingStrength / lineProps.safetyFactor;

    // Calculate vertical movement from tidal range
    const verticalMovement = tidalAnalysis.range;

    // Effective line angle change due to tide
    // Line goes from fairlead (on vessel) to bollard (on dock)
    const horizontalDistance = Math.sqrt(
      Math.pow(mooring.lineLength, 2) -
      Math.pow(mooring.bollardHeight - mooring.fairleadHeight, 2)
    ) || mooring.lineLength * 0.9;

    // At high tide
    const heightAtHigh = mooring.bollardHeight - mooring.fairleadHeight + verticalMovement / 2;
    const lineAngleHigh = Math.atan2(heightAtHigh, horizontalDistance);

    // At low tide
    const heightAtLow = mooring.bollardHeight - mooring.fairleadHeight - verticalMovement / 2;
    const lineAngleLow = Math.atan2(heightAtLow, horizontalDistance);

    // Line length needed at extremes (simplified catenary)
    const lineLengthAtHigh = Math.sqrt(
      Math.pow(horizontalDistance, 2) + Math.pow(heightAtHigh, 2)
    );
    const lineLengthAtLow = Math.sqrt(
      Math.pow(horizontalDistance, 2) + Math.pow(heightAtLow, 2)
    );

    // Strain in line at extremes
    const strainHigh = Math.max(0, (lineLengthAtHigh - mooring.lineLength) / mooring.lineLength);
    const strainLow = Math.max(0, (lineLengthAtLow - mooring.lineLength) / mooring.lineLength);
    const maxStrain = Math.max(strainHigh, strainLow);

    // Load from stretch (Hooke's law approximation)
    // F = E * A * strain, but we simplify using breaking strength ratio
    const stretchLoad = (maxStrain / lineProps.elasticity) * breakingStrength;

    // Wind load on vessel (simplified)
    const airDensity = 1.225; // kg/m³
    const windVelocity = windSpeed * 0.514444; // knots to m/s
    const dragCoeff = 1.2;
    const windForce = 0.5 * airDensity * dragCoeff * vessel.windageArea * Math.pow(windVelocity, 2) / 1000; // kN

    // Current load on hull (simplified)
    const waterDensity = 1025; // kg/m³
    const currentVelocity = currentSpeed * 0.514444;
    const hullArea = vessel.length * vessel.draftLoaded * 0.7; // Approximate underwater frontal area
    const currentForce = 0.5 * waterDensity * 1.0 * hullArea * Math.pow(currentVelocity, 2) / 1000; // kN

    // Total environmental load
    const environmentalLoad = windForce + currentForce;

    // Load per line (assuming equal distribution, which is conservative)
    const loadPerLine = environmentalLoad / mooring.numLines + stretchLoad;

    // Safety margin
    const safetyMargin = safeWorkingLoad / loadPerLine;

    // Surge load factor (dynamic effects)
    const surgeLoadFactor = 1.5;
    const peakLoad = loadPerLine * surgeLoadFactor;

    // Minimum line length to maintain slack
    const minLineLength = Math.max(lineLengthAtHigh, lineLengthAtLow) * 1.1;

    // Check if line is too short
    const lineTooShort = mooring.lineLength < minLineLength;

    return {
      breakingStrength,
      safeWorkingLoad,
      windForce,
      currentForce,
      environmentalLoad,
      stretchLoad,
      loadPerLine,
      peakLoad,
      safetyMargin,
      lineAngleHigh: lineAngleHigh * 180 / Math.PI,
      lineAngleLow: lineAngleLow * 180 / Math.PI,
      lineLengthAtHigh,
      lineLengthAtLow,
      minLineLength,
      lineTooShort,
      maxStrain: maxStrain * 100, // percentage
    };
  }, [vessel, mooring, windSpeed, currentSpeed, tidalAnalysis]);

  // Get safety status
  const getSafetyStatus = () => {
    if (lineCalculations.lineTooShort) {
      return { status: 'critical', message: 'Line too short for tidal range', color: 'text-red-400' };
    }
    if (lineCalculations.safetyMargin < 1) {
      return { status: 'danger', message: 'Exceeds safe working load', color: 'text-red-400' };
    }
    if (lineCalculations.safetyMargin < 2) {
      return { status: 'warning', message: 'Low safety margin', color: 'text-amber-400' };
    }
    if (lineCalculations.safetyMargin < 3) {
      return { status: 'caution', message: 'Adequate but monitor', color: 'text-yellow-400' };
    }
    return { status: 'safe', message: 'Good safety margin', color: 'text-green-400' };
  };

  const safety = getSafetyStatus();

  const formatForce = (kn: number) => {
    if (unitSystem === 'imperial') {
      return `${(kn * 224.809).toFixed(0)} lbf`;
    }
    return `${kn.toFixed(1)} kN`;
  };

  const formatLength = (m: number) => {
    if (unitSystem === 'imperial') {
      return `${(m * 3.28084).toFixed(1)} ft`;
    }
    return `${m.toFixed(1)} m`;
  };

  const stationName = selectedStation?.name ?? 'Selected Station';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">Mooring Line Load Calculator</h3>
            <p className="text-slate-400 text-sm">
              Estimate loads on mooring lines accounting for tidal range
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

        {/* Safety Status Banner */}
        <div className={`bg-slate-800 rounded-lg p-3 mb-4 border-l-4 ${
          safety.status === 'safe' ? 'border-green-500' :
          safety.status === 'caution' ? 'border-yellow-500' :
          safety.status === 'warning' ? 'border-amber-500' :
          'border-red-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {safety.status === 'safe' ? '✓' :
               safety.status === 'caution' ? '⚠' :
               safety.status === 'warning' ? '⚠' : '⛔'}
            </span>
            <div>
              <p className={`font-medium ${safety.color}`}>{safety.message}</p>
              <p className="text-slate-400 text-sm">
                Safety margin: {lineCalculations.safetyMargin.toFixed(1)}x
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vessel Configuration */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Vessel Configuration</h4>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Displacement (tonnes)</label>
                <input
                  type="number"
                  value={vessel.displacement}
                  onChange={(e) => setVessel({ ...vessel, displacement: Number(e.target.value) })}
                  className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Length (m)</label>
                  <input
                    type="number"
                    value={vessel.length}
                    onChange={(e) => setVessel({ ...vessel, length: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Beam (m)</label>
                  <input
                    type="number"
                    value={vessel.beam}
                    onChange={(e) => setVessel({ ...vessel, beam: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Draft (m)</label>
                  <input
                    type="number"
                    value={vessel.draftLoaded}
                    onChange={(e) => setVessel({ ...vessel, draftLoaded: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0.5"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Windage (m²)</label>
                  <input
                    type="number"
                    value={vessel.windageArea}
                    onChange={(e) => setVessel({ ...vessel, windageArea: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mooring Configuration */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Mooring Configuration</h4>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Line Type</label>
                <select
                  value={mooring.lineType}
                  onChange={(e) => setMooring({ ...mooring, lineType: e.target.value as MooringConfig['lineType'] })}
                  className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                >
                  {Object.entries(LINE_PROPERTIES).map(([key, props]) => (
                    <option key={key} value={key}>{props.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Line Length (m)</label>
                  <input
                    type="number"
                    value={mooring.lineLength}
                    onChange={(e) => setMooring({ ...mooring, lineLength: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Diameter (mm)</label>
                  <input
                    type="number"
                    value={mooring.lineDiameter}
                    onChange={(e) => setMooring({ ...mooring, lineDiameter: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Number of Lines</label>
                  <input
                    type="number"
                    value={mooring.numLines}
                    onChange={(e) => setMooring({ ...mooring, numLines: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Bollard Height (m)</label>
                  <input
                    type="number"
                    value={mooring.bollardHeight}
                    onChange={(e) => setMooring({ ...mooring, bollardHeight: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-sm"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Environmental Conditions</h4>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400">Wind Speed (knots)</label>
                <input
                  type="range"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="60"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Calm</span>
                  <span className="text-cyan-400">{windSpeed} kts</span>
                  <span>Storm</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Current Speed (knots)</label>
                <input
                  type="range"
                  value={currentSpeed}
                  onChange={(e) => setCurrentSpeed(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="5"
                  step="0.1"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Slack</span>
                  <span className="text-cyan-400">{currentSpeed.toFixed(1)} kts</span>
                  <span>Strong</span>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded p-2 mt-2">
                <p className="text-xs text-slate-400 mb-1">24-Hour Tidal Range at {stationName}:</p>
                <p className="text-lg font-mono text-cyan-400">
                  {formatLength(tidalAnalysis.range)}
                </p>
                <p className="text-xs text-slate-500">
                  Low: {formatLength(tidalAnalysis.min)} / High: {formatLength(tidalAnalysis.max)}
                </p>
              </div>
            </div>
          </div>

          {/* Load Analysis Results */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Load Analysis</h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Breaking Strength (per line):</span>
                <span className="text-slate-200">{formatForce(lineCalculations.breakingStrength)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Safe Working Load:</span>
                <span className="text-slate-200">{formatForce(lineCalculations.safeWorkingLoad)}</span>
              </div>

              <div className="border-t border-slate-700 my-2" />

              <div className="flex justify-between">
                <span className="text-slate-400">Wind Load:</span>
                <span className="text-slate-200">{formatForce(lineCalculations.windForce)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Load:</span>
                <span className="text-slate-200">{formatForce(lineCalculations.currentForce)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tidal Stretch Load:</span>
                <span className={lineCalculations.stretchLoad > 0.5 ? 'text-amber-400' : 'text-slate-200'}>
                  {formatForce(lineCalculations.stretchLoad)}
                </span>
              </div>

              <div className="border-t border-slate-700 my-2" />

              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Static Load (per line):</span>
                <span className="text-cyan-400">{formatForce(lineCalculations.loadPerLine)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Peak Load (with surge):</span>
                <span className={lineCalculations.peakLoad > lineCalculations.safeWorkingLoad ? 'text-red-400' : 'text-amber-400'}>
                  {formatForce(lineCalculations.peakLoad)}
                </span>
              </div>

              {/* Line geometry */}
              <div className="border-t border-slate-700 my-2" />

              <div className="text-xs text-slate-400">
                <p>Line angle range: {lineCalculations.lineAngleLow.toFixed(0)}° to {lineCalculations.lineAngleHigh.toFixed(0)}°</p>
                <p>Max line strain: {lineCalculations.maxStrain.toFixed(1)}%</p>
                {lineCalculations.lineTooShort && (
                  <p className="text-red-400 mt-1">
                    ⚠ Minimum line length needed: {formatLength(lineCalculations.minLineLength)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 bg-slate-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendations</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            {lineCalculations.lineTooShort && (
              <li className="text-red-400">
                • Increase line length to at least {formatLength(lineCalculations.minLineLength)} to accommodate tidal range
              </li>
            )}
            {lineCalculations.safetyMargin < 2 && (
              <li className="text-amber-400">
                • Consider using larger diameter lines or adding additional lines
              </li>
            )}
            {tidalAnalysis.range > 3 && mooring.lineType === 'chain' && (
              <li className="text-amber-400">
                • Chain has low elasticity - consider using nylon snubbers in high tidal ranges
              </li>
            )}
            {windSpeed > 30 && (
              <li className="text-amber-400">
                • In strong winds, double-up breast lines and add spring lines
              </li>
            )}
            <li>• Re-check line tension when tide changes by more than {formatLength(tidalAnalysis.range / 2)}</li>
            <li>• Ensure chafe protection at fairleads and bollards</li>
            <li>• Monitor lines during spring tides when ranges are greatest</li>
          </ul>
        </div>

        {/* Educational Note */}
        <div className="mt-4 text-xs text-slate-500">
          <p>
            <strong>Note:</strong> This calculator provides estimates based on simplified physics.
            Actual loads depend on many factors including dock configuration, vessel trim, wave action,
            and line condition. Always follow harbor master guidelines and use appropriate safety factors.
          </p>
        </div>
      </div>
    </div>
  );
}
