import { useMemo } from 'react';
import { Vector3 } from 'three';
import { Line, Html, Cone } from '@react-three/drei';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { useScene } from '@/hooks/useScene';
import { useSceneStore } from '@/stores/sceneStore';
import { generateFibonacciSphere } from '@/lib/fibonacciSphere';

// Moon and Sun masses in kg
const MOON_MASS = 7.342e22;
const SUN_MASS = 1.989e30;

// Gravitational constant
const G = 6.674e-11;

// Calculate tidal force from a single body
function calculateSingleBodyTidalForce(
  surfacePoint: Vector3,
  bodyPosition: Vector3,
  bodyMass: number
): Vector3 {
  const earthCenter = new Vector3(0, 0, 0);

  // Vector from body to surface point
  const toSurface = surfacePoint.clone().sub(bodyPosition);
  const distSurface = toSurface.length() * 1000; // Convert km to m

  // Vector from body to Earth center
  const toCenter = earthCenter.clone().sub(bodyPosition);
  const distCenter = toCenter.length() * 1000; // Convert km to m

  // Gravitational acceleration at surface point
  const accSurface = toSurface.clone().normalize().multiplyScalar(
    G * bodyMass / (distSurface * distSurface)
  );

  // Gravitational acceleration at Earth center
  const accCenter = toCenter.clone().normalize().multiplyScalar(
    G * bodyMass / (distCenter * distCenter)
  );

  // Tidal force = difference
  return accSurface.sub(accCenter);
}

export function ForceField() {
  const { moonRaw, sunRaw } = useCelestialPositions();
  const { scale } = useScene();
  const forceVectorCount = useSceneStore((s) => s.forceVectorCount);

  const { moonVectors, sunVectors, combinedVectors } = useMemo(() => {
    // Use fewer points for clearer visualization
    const numPoints = Math.min(forceVectorCount, 24);
    const earthRadiusKm = scale.EARTH_RADIUS * 10000;
    const samplePoints = generateFibonacciSphere(numPoints, earthRadiusKm);

    const moonVec = new Vector3(moonRaw.x, moonRaw.y, moonRaw.z);
    const sunVec = new Vector3(sunRaw.x, sunRaw.y, sunRaw.z);

    // Max arrow length in scene units (relative to Earth radius)
    const maxArrowLength = scale.EARTH_RADIUS * 1.5;

    // Scale factor to convert tiny accelerations to visible arrows
    // Tidal acceleration is ~10^-6 m/s², we want arrows of a few Earth radii
    const arrowScale = 5e11;

    const moonResults: { start: Vector3; end: Vector3; magnitude: number }[] = [];
    const sunResults: { start: Vector3; end: Vector3; magnitude: number }[] = [];
    const combinedResults: { start: Vector3; end: Vector3; magnitude: number }[] = [];

    samplePoints.forEach((point) => {
      const moonForce = calculateSingleBodyTidalForce(point, moonVec, MOON_MASS);
      const sunForce = calculateSingleBodyTidalForce(point, sunVec, SUN_MASS);
      const combinedForce = moonForce.clone().add(sunForce);

      const startScene = point.clone().divideScalar(10000);

      // Moon vector
      const moonDir = moonForce.clone().multiplyScalar(arrowScale);
      let moonLength = moonDir.length();
      if (moonLength > maxArrowLength * 10000) {
        moonDir.normalize().multiplyScalar(maxArrowLength * 10000);
        moonLength = maxArrowLength * 10000;
      }
      const moonEnd = point.clone().add(moonDir).divideScalar(10000);
      moonResults.push({ start: startScene.clone(), end: moonEnd, magnitude: moonForce.length() });

      // Sun vector
      const sunDir = sunForce.clone().multiplyScalar(arrowScale);
      let sunLength = sunDir.length();
      if (sunLength > maxArrowLength * 10000) {
        sunDir.normalize().multiplyScalar(maxArrowLength * 10000);
        sunLength = maxArrowLength * 10000;
      }
      const sunEnd = point.clone().add(sunDir).divideScalar(10000);
      sunResults.push({ start: startScene.clone(), end: sunEnd, magnitude: sunForce.length() });

      // Combined vector
      const combDir = combinedForce.clone().multiplyScalar(arrowScale);
      let combLength = combDir.length();
      if (combLength > maxArrowLength * 10000) {
        combDir.normalize().multiplyScalar(maxArrowLength * 10000);
        combLength = maxArrowLength * 10000;
      }
      const combEnd = point.clone().add(combDir).divideScalar(10000);
      combinedResults.push({ start: startScene.clone(), end: combEnd, magnitude: combinedForce.length() });
    });

    return {
      moonVectors: moonResults,
      sunVectors: sunResults,
      combinedVectors: combinedResults,
    };
  }, [moonRaw, sunRaw, scale, forceVectorCount]);

  return (
    <group>
      {/* Legend */}
      <Html
        position={[scale.EARTH_RADIUS * 3, scale.EARTH_RADIUS * 2, 0]}
        center
        zIndexRange={[1, 10]}
        style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        <div style={{ color: '#60a5fa', marginBottom: '4px' }}>● Moon tidal force</div>
        <div style={{ color: '#fbbf24', marginBottom: '4px' }}>● Sun tidal force</div>
        <div style={{ color: '#f87171' }}>● Combined force</div>
      </Html>

      {/* Moon tidal forces - blue */}
      {moonVectors.map((v, i) => (
        <group key={`moon-${i}`}>
          <Line
            points={[v.start.toArray(), v.end.toArray()]}
            color="#60a5fa"
            lineWidth={2}
            transparent
            opacity={0.8}
          />
          <Cone
            args={[0.15, 0.4, 8]}
            position={v.end.toArray()}
            rotation={[
              Math.atan2(
                Math.sqrt((v.end.x - v.start.x) ** 2 + (v.end.z - v.start.z) ** 2),
                v.end.y - v.start.y
              ),
              0,
              Math.atan2(-(v.end.x - v.start.x), v.end.z - v.start.z),
            ]}
          >
            <meshBasicMaterial color="#60a5fa" />
          </Cone>
        </group>
      ))}

      {/* Sun tidal forces - yellow/amber */}
      {sunVectors.map((v, i) => (
        <group key={`sun-${i}`}>
          <Line
            points={[v.start.toArray(), v.end.toArray()]}
            color="#fbbf24"
            lineWidth={2}
            transparent
            opacity={0.8}
          />
          <Cone
            args={[0.15, 0.4, 8]}
            position={v.end.toArray()}
            rotation={[
              Math.atan2(
                Math.sqrt((v.end.x - v.start.x) ** 2 + (v.end.z - v.start.z) ** 2),
                v.end.y - v.start.y
              ),
              0,
              Math.atan2(-(v.end.x - v.start.x), v.end.z - v.start.z),
            ]}
          >
            <meshBasicMaterial color="#fbbf24" />
          </Cone>
        </group>
      ))}

      {/* Combined tidal forces - red/coral */}
      {combinedVectors.map((v, i) => (
        <group key={`combined-${i}`}>
          <Line
            points={[v.start.toArray(), v.end.toArray()]}
            color="#f87171"
            lineWidth={3}
          />
          <Cone
            args={[0.2, 0.5, 8]}
            position={v.end.toArray()}
            rotation={[
              Math.atan2(
                Math.sqrt((v.end.x - v.start.x) ** 2 + (v.end.z - v.start.z) ** 2),
                v.end.y - v.start.y
              ),
              0,
              Math.atan2(-(v.end.x - v.start.x), v.end.z - v.start.z),
            ]}
          >
            <meshBasicMaterial color="#f87171" />
          </Cone>
        </group>
      ))}
    </group>
  );
}
