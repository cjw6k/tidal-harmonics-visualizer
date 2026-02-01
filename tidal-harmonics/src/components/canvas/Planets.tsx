import { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useSceneStore } from '@/stores/sceneStore';
import { getAllPlanetPositions } from '@/lib/ephemeris';
import { PLANET_DATA } from '@/lib/constants';
import { Html } from '@react-three/drei';

interface PlanetProps {
  name: string;
  position: [number, number, number];
  radius: number;
  color: string;
  showLabel: boolean;
}

function Planet({ name, position, radius, color, showLabel }: PlanetProps) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
      {showLabel && (
        <Html
          position={[0, radius * 1.5, 0]}
          center
          zIndexRange={[0, 1]}
          wrapperClass="planet-label"
          style={{
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            textShadow: '0 0 3px black',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {name}
        </Html>
      )}
    </group>
  );
}

// Saturn's rings
function SaturnRings({ position, radius }: { position: [number, number, number]; radius: number }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2 + 0.47, 0, 0]}>
      <ringGeometry args={[radius * 1.2, radius * 2.2, 64]} />
      <meshStandardMaterial
        color="#c9b896"
        transparent
        opacity={0.7}
        side={2}
      />
    </mesh>
  );
}

export function Planets() {
  const epoch = useTimeStore((s) => s.epoch);
  const scaleMode = useSceneStore((s) => s.scaleMode);
  const showLabels = useSceneStore((s) => s.showLabels);

  const planetPositions = useMemo(() => {
    const date = new Date(epoch);
    const positions = getAllPlanetPositions(date);

    // Scale factor: convert km to scene units
    // In exaggerated mode, we compress distances dramatically for visibility
    const distanceScale = scaleMode === 'exaggerated' ? 1 / 5_000_000 : 1 / 10_000;
    const sizeScale = scaleMode === 'exaggerated' ? 1 / 20_000 : 1 / 10_000;

    // Minimum size so planets are visible
    const minSize = scaleMode === 'exaggerated' ? 0.8 : 0.3;

    return Object.entries(positions).map(([name, pos]) => {
      const data = PLANET_DATA[name as keyof typeof PLANET_DATA];

      // Position in scene coordinates
      const x = pos.x * distanceScale;
      const y = pos.z * distanceScale; // Swap Y/Z for 3D scene
      const z = pos.y * distanceScale;

      // Size (with minimum visibility)
      const radius = Math.max(data.radius * sizeScale, minSize);

      return {
        name: data.name,
        position: [x, y, z] as [number, number, number],
        radius,
        color: data.color,
        key: name,
      };
    });
  }, [epoch, scaleMode]);

  return (
    <>
      {planetPositions.map((planet) => (
        <Planet
          key={planet.key}
          name={planet.name}
          position={planet.position}
          radius={planet.radius}
          color={planet.color}
          showLabel={showLabels}
        />
      ))}
      {/* Saturn's rings */}
      {planetPositions.find(p => p.key === 'saturn') && (
        <SaturnRings
          position={planetPositions.find(p => p.key === 'saturn')!.position}
          radius={planetPositions.find(p => p.key === 'saturn')!.radius}
        />
      )}
    </>
  );
}
