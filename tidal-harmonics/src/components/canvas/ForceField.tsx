import { useMemo } from 'react';
import { Vector3 } from 'three';
import { Line, Html } from '@react-three/drei';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { useScene } from '@/hooks/useScene';
import { useTutorialStore } from '@/stores/tutorialStore';

interface ForceArrow {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  color: string;
  type: 'stretch' | 'compress';
  source: 'moon' | 'sun';
}

export function ForceField() {
  const { moonRaw, sunRaw } = useCelestialPositions();
  const { scale } = useScene();
  const tutorialActive = useTutorialStore((s) => s.isActive);
  const getCurrentStep = useTutorialStore((s) => s.getCurrentStep);

  // Show explanation panel only at step ch1-differential, or when not in tutorial
  const currentStep = getCurrentStep();
  const showExplanation = !tutorialActive || currentStep?.step.id === 'ch1-differential';

  // Show Sun forces in chapter 2 (spring/neap), ch3-complex, or outside tutorial
  const showSunForces = !tutorialActive || currentStep?.chapter.id === 'ch2-sun' || currentStep?.step.id === 'ch3-complex';

  const { moonArrows, sunArrows, sunMoonAngle } = useMemo(() => {
    const earthR = scale.EARTH_RADIUS;
    const moonArrowLength = earthR * 1.2;
    const sunArrowLength = moonArrowLength * 0.46; // Sun's tidal force is 46% of Moon's

    // Direction to Moon (normalized)
    const toMoon = new Vector3(moonRaw.x, moonRaw.y, moonRaw.z).normalize();
    // Direction to Sun (normalized)
    const toSun = new Vector3(sunRaw.x, sunRaw.y, sunRaw.z).normalize();

    // Calculate angle between Sun and Moon directions
    const angle = Math.acos(Math.abs(toMoon.dot(toSun))) * (180 / Math.PI);

    // Perpendicular directions for Moon (for compression zones)
    const up = new Vector3(0, 1, 0);
    const moonPerp1 = new Vector3().crossVectors(toMoon, up).normalize();
    if (moonPerp1.length() < 0.1) {
      moonPerp1.crossVectors(toMoon, new Vector3(1, 0, 0)).normalize();
    }
    const moonPerp2 = new Vector3().crossVectors(toMoon, moonPerp1).normalize();

    // Perpendicular directions for Sun
    const sunPerp1 = new Vector3().crossVectors(toSun, up).normalize();
    if (sunPerp1.length() < 0.1) {
      sunPerp1.crossVectors(toSun, new Vector3(1, 0, 0)).normalize();
    }
    const sunPerp2 = new Vector3().crossVectors(toSun, sunPerp1).normalize();

    const moonResult: ForceArrow[] = [];
    const sunResult: ForceArrow[] = [];

    // === MOON FORCES (red/blue) ===
    // Near side stretch
    const moonNearPos = toMoon.clone().multiplyScalar(earthR);
    const moonNearEnd = toMoon.clone().multiplyScalar(earthR + moonArrowLength);
    moonResult.push({
      start: [moonNearPos.x, moonNearPos.y, moonNearPos.z],
      end: [moonNearEnd.x, moonNearEnd.y, moonNearEnd.z],
      label: 'Moon pull',
      color: '#ef4444',
      type: 'stretch',
      source: 'moon',
    });

    // Far side stretch
    const moonFarPos = toMoon.clone().multiplyScalar(-earthR);
    const moonFarEnd = toMoon.clone().multiplyScalar(-earthR - moonArrowLength);
    moonResult.push({
      start: [moonFarPos.x, moonFarPos.y, moonFarPos.z],
      end: [moonFarEnd.x, moonFarEnd.y, moonFarEnd.z],
      label: '',
      color: '#ef4444',
      type: 'stretch',
      source: 'moon',
    });

    // Moon compression (simplified - just top/bottom)
    const moonCompressLength = earthR * 0.8;
    const moonTopPos = moonPerp2.clone().multiplyScalar(earthR);
    const moonTopEnd = moonPerp2.clone().multiplyScalar(earthR - moonCompressLength);
    moonResult.push({
      start: [moonTopPos.x, moonTopPos.y, moonTopPos.z],
      end: [moonTopEnd.x, moonTopEnd.y, moonTopEnd.z],
      label: '',
      color: '#3b82f6',
      type: 'compress',
      source: 'moon',
    });

    const moonBotPos = moonPerp2.clone().multiplyScalar(-earthR);
    const moonBotEnd = moonPerp2.clone().multiplyScalar(-earthR + moonCompressLength);
    moonResult.push({
      start: [moonBotPos.x, moonBotPos.y, moonBotPos.z],
      end: [moonBotEnd.x, moonBotEnd.y, moonBotEnd.z],
      label: '',
      color: '#3b82f6',
      type: 'compress',
      source: 'moon',
    });

    // === SUN FORCES (orange/yellow, 46% size) ===
    // Near side stretch
    const sunNearPos = toSun.clone().multiplyScalar(earthR);
    const sunNearEnd = toSun.clone().multiplyScalar(earthR + sunArrowLength);
    sunResult.push({
      start: [sunNearPos.x, sunNearPos.y, sunNearPos.z],
      end: [sunNearEnd.x, sunNearEnd.y, sunNearEnd.z],
      label: 'Sun pull',
      color: '#f97316',
      type: 'stretch',
      source: 'sun',
    });

    // Far side stretch
    const sunFarPos = toSun.clone().multiplyScalar(-earthR);
    const sunFarEnd = toSun.clone().multiplyScalar(-earthR - sunArrowLength);
    sunResult.push({
      start: [sunFarPos.x, sunFarPos.y, sunFarPos.z],
      end: [sunFarEnd.x, sunFarEnd.y, sunFarEnd.z],
      label: '',
      color: '#f97316',
      type: 'stretch',
      source: 'sun',
    });

    // Sun compression
    const sunCompressLength = moonCompressLength * 0.46;
    const sunTopPos = sunPerp2.clone().multiplyScalar(earthR);
    const sunTopEnd = sunPerp2.clone().multiplyScalar(earthR - sunCompressLength);
    sunResult.push({
      start: [sunTopPos.x, sunTopPos.y, sunTopPos.z],
      end: [sunTopEnd.x, sunTopEnd.y, sunTopEnd.z],
      label: '',
      color: '#fbbf24',
      type: 'compress',
      source: 'sun',
    });

    const sunBotPos = sunPerp2.clone().multiplyScalar(-earthR);
    const sunBotEnd = sunPerp2.clone().multiplyScalar(-earthR + sunCompressLength);
    sunResult.push({
      start: [sunBotPos.x, sunBotPos.y, sunBotPos.z],
      end: [sunBotEnd.x, sunBotEnd.y, sunBotEnd.z],
      label: '',
      color: '#fbbf24',
      type: 'compress',
      source: 'sun',
    });

    return { moonArrows: moonResult, sunArrows: sunResult, sunMoonAngle: angle };
  }, [moonRaw, sunRaw, scale]);

  const allArrows = showSunForces ? [...moonArrows, ...sunArrows] : moonArrows;

  return (
    <group>
      {/* Explanation panel - only shown at ch1-differential step or outside tutorial */}
      {showExplanation && (
        <Html
          position={[scale.EARTH_RADIUS * 5.5, scale.EARTH_RADIUS * 3, 0]}
          center
          zIndexRange={[1, 10]}
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '320px',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
            Tidal Forces
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>→</span>
              <span>Stretched (bulge)</span>
            </div>
            <div style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>←</span>
              <span>Compressed</span>
            </div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
            The Moon pulls the near side more than Earth's center, and the center more than the far side. This creates TWO bulges.
          </div>
        </Html>
      )}

      {/* Alignment indicator - shows Sun-Earth-Moon angle (top-right corner) */}
      {showSunForces && (
        <Html
          position={[0, 0, 0]}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
          zIndexRange={[1, 10]}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              width: '120px',
            }}
          >
            <div style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
              Top View
            </div>
            <svg viewBox="0 0 100 100" width="96" height="96">
              {/* Earth at center */}
              <circle cx="50" cy="50" r="12" fill="#3b82f6" />
              <text x="50" y="54" textAnchor="middle" fill="white" fontSize="8">E</text>

              {/* Moon direction (from moonRaw, projected to 2D) */}
              <line
                x1="50"
                y1="50"
                x2={50 + (moonRaw.x / Math.sqrt(moonRaw.x * moonRaw.x + moonRaw.z * moonRaw.z || 1)) * 35}
                y2={50 - (moonRaw.z / Math.sqrt(moonRaw.x * moonRaw.x + moonRaw.z * moonRaw.z || 1)) * 35}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <circle
                cx={50 + (moonRaw.x / Math.sqrt(moonRaw.x * moonRaw.x + moonRaw.z * moonRaw.z || 1)) * 35}
                cy={50 - (moonRaw.z / Math.sqrt(moonRaw.x * moonRaw.x + moonRaw.z * moonRaw.z || 1)) * 35}
                r="6"
                fill="#94a3b8"
              />
              <text
                x={50 + (moonRaw.x / Math.sqrt(moonRaw.x * moonRaw.x + moonRaw.z * moonRaw.z || 1)) * 35}
                y={54 - (moonRaw.z / Math.sqrt(moonRaw.x * moonRaw.x + moonRaw.z * moonRaw.z || 1)) * 35}
                textAnchor="middle"
                fill="white"
                fontSize="6"
              >
                M
              </text>

              {/* Sun direction */}
              <line
                x1="50"
                y1="50"
                x2={50 + (sunRaw.x / Math.sqrt(sunRaw.x * sunRaw.x + sunRaw.z * sunRaw.z || 1)) * 40}
                y2={50 - (sunRaw.z / Math.sqrt(sunRaw.x * sunRaw.x + sunRaw.z * sunRaw.z || 1)) * 40}
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="3,2"
              />
              <circle
                cx={50 + (sunRaw.x / Math.sqrt(sunRaw.x * sunRaw.x + sunRaw.z * sunRaw.z || 1)) * 40}
                cy={50 - (sunRaw.z / Math.sqrt(sunRaw.x * sunRaw.x + sunRaw.z * sunRaw.z || 1)) * 40}
                r="5"
                fill="#f97316"
              />
            </svg>
            <div style={{ color: '#94a3b8', fontSize: '9px', textAlign: 'center', marginTop: '4px' }}>
              Angle: {sunMoonAngle.toFixed(0)}°
              <br />
              <span style={{ color: sunMoonAngle < 30 || sunMoonAngle > 150 ? '#22c55e' : sunMoonAngle > 60 && sunMoonAngle < 120 ? '#f97316' : '#94a3b8' }}>
                {sunMoonAngle < 30 || sunMoonAngle > 150 ? 'SPRING' : sunMoonAngle > 60 && sunMoonAngle < 120 ? 'NEAP' : ''}
              </span>
            </div>
          </div>
        </Html>
      )}

      {/* Force arrows */}
      {allArrows.map((arrow, i) => {
        const dir = new Vector3(
          arrow.end[0] - arrow.start[0],
          arrow.end[1] - arrow.start[1],
          arrow.end[2] - arrow.start[2]
        );
        const len = dir.length();
        const headSize = len * 0.15;

        // Arrowhead position (slightly back from end)
        const headPos = new Vector3(...arrow.end);
        const headDir = dir.clone().normalize();
        const headBase = headPos.clone().sub(headDir.clone().multiplyScalar(headSize));

        // Perpendicular vectors for arrowhead
        const up = new Vector3(0, 1, 0);
        let perp = new Vector3().crossVectors(headDir, up);
        if (perp.length() < 0.1) perp.crossVectors(headDir, new Vector3(1, 0, 0));
        perp.normalize().multiplyScalar(headSize * 0.4);

        const headLeft = headBase.clone().add(perp);
        const headRight = headBase.clone().sub(perp);

        return (
          <group key={i}>
            {/* Arrow shaft */}
            <Line
              points={[arrow.start, arrow.end]}
              color={arrow.color}
              lineWidth={4}
            />
            {/* Arrowhead */}
            <Line
              points={[headLeft.toArray(), arrow.end, headRight.toArray()]}
              color={arrow.color}
              lineWidth={4}
            />
            {/* Label (only if non-empty) */}
            {arrow.label && (
              <Html
                position={arrow.end}
                center
                zIndexRange={[1, 10]}
                style={{
                  color: arrow.color,
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px black, 0 0 4px black',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  transform: 'translateY(-12px)',
                }}
              >
                {arrow.label}
              </Html>
            )}
          </group>
        );
      })}

      {/* Tidal bulge outline (ellipse) */}
      <TidalBulgeOutline moonDirection={new Vector3(moonRaw.x, moonRaw.y, moonRaw.z).normalize()} earthRadius={scale.EARTH_RADIUS} />
    </group>
  );
}

// Dotted ellipse showing the tidal bulge shape
function TidalBulgeOutline({ moonDirection, earthRadius }: { moonDirection: Vector3; earthRadius: number }) {
  const points = useMemo(() => {
    const result: [number, number, number][] = [];
    const segments = 64;

    // Semi-major axis (stretched toward/away from Moon)
    const a = earthRadius * 1.15;
    // Semi-minor axis (compressed)
    const b = earthRadius * 0.92;

    // Get perpendicular vectors
    const up = new Vector3(0, 1, 0);
    let perp = new Vector3().crossVectors(moonDirection, up);
    if (perp.length() < 0.1) perp.crossVectors(moonDirection, new Vector3(1, 0, 0));
    perp.normalize();

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // Ellipse in the plane of Moon-Earth
      const point = moonDirection.clone().multiplyScalar(Math.cos(angle) * a)
        .add(perp.clone().multiplyScalar(Math.sin(angle) * b));
      result.push([point.x, point.y, point.z]);
    }

    return result;
  }, [moonDirection, earthRadius]);

  return (
    <Line
      points={points}
      color="#fbbf24"
      lineWidth={2}
      dashed
      dashSize={0.3}
      gapSize={0.2}
      transparent
      opacity={0.6}
    />
  );
}
