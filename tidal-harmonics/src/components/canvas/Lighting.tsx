import { useCelestialPositions } from '@/hooks/useCelestialPositions';

export function Lighting() {
  const { sun } = useCelestialPositions();

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight
        position={sun}
        intensity={1.5}
        castShadow
      />
    </>
  );
}
