import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useSceneStore } from '@/stores/sceneStore';
import { getBodyPosition, Astronomy } from '@/lib/ephemeris';
import { scalePosition } from '@/lib/scalePosition';

interface OrbitPathProps {
  body: Astronomy.Body;
  segments?: number;
  color?: string;
}

export function OrbitPath({ body, segments = 360, color = '#444' }: OrbitPathProps) {
  const scaleMode = useSceneStore((s) => s.scaleMode);

  const points = useMemo(() => {
    const now = new Date();
    // Orbital period in days
    const orbitalPeriod = body === Astronomy.Body.Moon ? 27.3 : 365.25;
    const result: [number, number, number][] = [];

    for (let i = 0; i <= segments; i++) {
      const daysOffset = (i / segments) * orbitalPeriod;
      const date = new Date(now.getTime() + daysOffset * 86400000);
      const pos = getBodyPosition(body, date);
      result.push(scalePosition(pos, scaleMode));
    }

    return result;
  }, [body, segments, scaleMode]);

  return (
    <Line points={points} color={color} lineWidth={1} transparent opacity={0.5} />
  );
}

export function MoonOrbitPath() {
  return <OrbitPath body={Astronomy.Body.Moon} color="#666" />;
}
