import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshBasicMaterial } from 'three';

interface HighlightRingProps {
  position: [number, number, number];
  radius: number;
  color?: string;
  visible?: boolean;
}

export function HighlightRing({ position, radius, color = '#3b82f6', visible = true }: HighlightRingProps) {
  const ringRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={ringRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius * 1.3, radius * 0.03, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

interface PulsingGlowProps {
  position: [number, number, number];
  radius: number;
  color?: string;
  visible?: boolean;
}

export function PulsingGlow({ position, radius, color = '#3b82f6', visible = true }: PulsingGlowProps) {
  const glowRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 2) * 0.15 + 0.85;
      glowRef.current.scale.setScalar(pulse);
      const mat = glowRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(clock.elapsedTime * 2) * 0.1;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={glowRef} position={position}>
      <sphereGeometry args={[radius * 1.15, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}
