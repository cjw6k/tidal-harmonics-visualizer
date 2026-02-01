import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useScene } from '@/hooks/useScene';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { TEXTURE_URLS } from '@/lib/constants';

export function Sun() {
  const { scale } = useScene();
  const { sun } = useCelestialPositions();
  const texture = useLoader(TextureLoader, TEXTURE_URLS.sun.surface2k);

  return (
    <mesh position={sun}>
      <sphereGeometry args={[scale.SUN_RADIUS, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
