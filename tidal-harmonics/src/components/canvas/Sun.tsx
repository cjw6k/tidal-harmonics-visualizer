import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useScene } from '@/hooks/useScene';
import { TEXTURE_URLS } from '@/lib/constants';

export function Sun() {
  const { scale } = useScene();
  const texture = useLoader(TextureLoader, TEXTURE_URLS.sun.surface2k);

  return (
    <mesh position={[-scale.SUN_DISTANCE, 0, 0]}>
      <sphereGeometry args={[scale.SUN_RADIUS, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
