import { useScene } from '@/hooks/useScene';

export function Lighting() {
  const { scale } = useScene();

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[-scale.SUN_DISTANCE, 0, 0]}
        intensity={1.5}
        castShadow
      />
    </>
  );
}
