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
}

export function ForceField() {
  const { moonRaw } = useCelestialPositions();
  const { scale } = useScene();
  const tutorialActive = useTutorialStore((s) => s.isActive);
  const getCurrentStep = useTutorialStore((s) => s.getCurrentStep);

  // Show explanation panel only at step ch1-differential, or when not in tutorial
  const currentStep = getCurrentStep();
  const showExplanation = !tutorialActive || currentStep?.step.id === 'ch1-differential';

  const arrows = useMemo(() => {
    const earthR = scale.EARTH_RADIUS;
    const arrowLength = earthR * 1.2;

    // Direction to Moon (normalized)
    const toMoon = new Vector3(moonRaw.x, moonRaw.y, moonRaw.z).normalize();

    // Perpendicular directions (for compression zones)
    const up = new Vector3(0, 1, 0);
    const perp1 = new Vector3().crossVectors(toMoon, up).normalize();
    if (perp1.length() < 0.1) {
      perp1.crossVectors(toMoon, new Vector3(1, 0, 0)).normalize();
    }
    const perp2 = new Vector3().crossVectors(toMoon, perp1).normalize();

    const result: ForceArrow[] = [];

    // === NEAR SIDE (facing Moon) - STRETCH OUTWARD ===
    const nearPos = toMoon.clone().multiplyScalar(earthR);
    const nearEnd = toMoon.clone().multiplyScalar(earthR + arrowLength);
    result.push({
      start: [nearPos.x, nearPos.y, nearPos.z],
      end: [nearEnd.x, nearEnd.y, nearEnd.z],
      label: 'Pulled toward Moon',
      color: '#ef4444', // red
      type: 'stretch',
    });

    // === FAR SIDE (opposite Moon) - STRETCH OUTWARD (away from Moon) ===
    const farPos = toMoon.clone().multiplyScalar(-earthR);
    const farEnd = toMoon.clone().multiplyScalar(-earthR - arrowLength);
    result.push({
      start: [farPos.x, farPos.y, farPos.z],
      end: [farEnd.x, farEnd.y, farEnd.z],
      label: 'Pulled less, bulges out',
      color: '#ef4444', // red
      type: 'stretch',
    });

    // === PERPENDICULAR ZONES - COMPRESSION (arrows point toward center) ===
    // Only label one arrow - the visual pattern is self-explanatory
    const compressLength = earthR * 0.8;

    // Top (labeled)
    const topPos = perp2.clone().multiplyScalar(earthR);
    const topEnd = perp2.clone().multiplyScalar(earthR - compressLength);
    result.push({
      start: [topPos.x, topPos.y, topPos.z],
      end: [topEnd.x, topEnd.y, topEnd.z],
      label: 'Compressed',
      color: '#3b82f6', // blue
      type: 'compress',
    });

    // Bottom (no label - arrow speaks for itself)
    const botPos = perp2.clone().multiplyScalar(-earthR);
    const botEnd = perp2.clone().multiplyScalar(-earthR + compressLength);
    result.push({
      start: [botPos.x, botPos.y, botPos.z],
      end: [botEnd.x, botEnd.y, botEnd.z],
      label: '',
      color: '#3b82f6', // blue
      type: 'compress',
    });

    // Side 1 (no label)
    const side1Pos = perp1.clone().multiplyScalar(earthR);
    const side1End = perp1.clone().multiplyScalar(earthR - compressLength);
    result.push({
      start: [side1Pos.x, side1Pos.y, side1Pos.z],
      end: [side1End.x, side1End.y, side1End.z],
      label: '',
      color: '#3b82f6', // blue
      type: 'compress',
    });

    // Side 2 (no label)
    const side2Pos = perp1.clone().multiplyScalar(-earthR);
    const side2End = perp1.clone().multiplyScalar(-earthR + compressLength);
    result.push({
      start: [side2Pos.x, side2Pos.y, side2Pos.z],
      end: [side2End.x, side2End.y, side2End.z],
      label: '',
      color: '#3b82f6', // blue
      type: 'compress',
    });

    return result;
  }, [moonRaw, scale]);

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

      {/* Force arrows */}
      {arrows.map((arrow, i) => {
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
