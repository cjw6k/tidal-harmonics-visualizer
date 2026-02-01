import { useMemo } from 'react';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { useScene } from '@/hooks/useScene';
import { useSceneStore } from '@/stores/sceneStore';
import { generateFibonacciSphere } from '@/lib/fibonacciSphere';
import { calculateTidalForce } from '@/lib/gravitationalField';

export function ForceField() {
  const { moonRaw, sunRaw } = useCelestialPositions();
  const { scale } = useScene();
  const forceVectorCount = useSceneStore((s) => s.forceVectorCount);

  const vectors = useMemo(() => {
    // Earth radius in km for sampling
    const earthRadiusKm = scale.EARTH_RADIUS * 10000;
    const samplePoints = generateFibonacciSphere(forceVectorCount, earthRadiusKm);

    const moonVec = new Vector3(moonRaw.x, moonRaw.y, moonRaw.z);
    const sunVec = new Vector3(sunRaw.x, sunRaw.y, sunRaw.z);

    return samplePoints.map((point) => {
      const force = calculateTidalForce(point, moonVec, sunVec);

      // Scale force for visibility: magnitude is ~10^-6 m/s², we need visible arrows
      const arrowScale = 1e13;
      const arrowDir = force.direction.clone().multiplyScalar(force.magnitude * arrowScale);

      return {
        start: point.clone().divideScalar(10000), // Scale to scene units
        end: point
          .clone()
          .add(arrowDir)
          .divideScalar(10000),
        magnitude: force.magnitude,
      };
    });
  }, [moonRaw, sunRaw, scale, forceVectorCount]);

  // Normalize magnitudes for color mapping
  const maxMag = Math.max(...vectors.map((v) => v.magnitude));

  return (
    <group>
      {vectors.map((v, i) => {
        // Color by magnitude: red (strong) to yellow (weak)
        const intensity = v.magnitude / maxMag;
        const r = 1;
        const g = 1 - intensity * 0.7;
        const b = 0.2;
        const color = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;

        return (
          <Line
            key={i}
            points={[v.start.toArray(), v.end.toArray()]}
            color={color}
            lineWidth={2}
          />
        );
      })}
    </group>
  );
}
