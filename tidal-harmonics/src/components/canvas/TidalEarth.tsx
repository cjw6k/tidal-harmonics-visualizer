import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3, Texture } from 'three';
import type { Mesh } from 'three';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { useScene } from '@/hooks/useScene';
import { useSceneStore } from '@/stores/sceneStore';
import { useTimeStore } from '@/stores/timeStore';
import { TEXTURE_URLS, ROTATION_SPEEDS } from '@/lib/constants';

const tidalVertexShader = `
  uniform vec3 moonDirection;
  uniform vec3 sunDirection;
  uniform float tidalAmplitude;

  varying float vTidalDisplacement;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normal;

    // Calculate Legendre P2 for Moon
    float cosThetaMoon = dot(normalize(position), moonDirection);
    float P2Moon = (3.0 * cosThetaMoon * cosThetaMoon - 1.0) / 2.0;

    // Calculate Legendre P2 for Sun
    float cosThetaSun = dot(normalize(position), sunDirection);
    float P2Sun = (3.0 * cosThetaSun * cosThetaSun - 1.0) / 2.0;

    // Combined tidal displacement (Moon + 46% Sun)
    float displacement = tidalAmplitude * (P2Moon + 0.46 * P2Sun);
    vTidalDisplacement = displacement;

    // Apply displacement along normal
    vec3 newPosition = position * (1.0 + displacement);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const tidalFragmentShader = `
  uniform sampler2D map;
  uniform float tidalIntensity;

  varying float vTidalDisplacement;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 baseColor = texture2D(map, vUv).rgb;

    // Subtle color tint on bulges (optional)
    float bulgeIntensity = abs(vTidalDisplacement) * tidalIntensity;
    vec3 bulgeColor = mix(baseColor, vec3(0.3, 0.5, 1.0), bulgeIntensity * 0.2);

    gl_FragColor = vec4(bulgeColor, 1.0);
  }
`;

interface TidalUniforms {
  [uniform: string]: { value: unknown };
  map: { value: Texture };
  moonDirection: { value: Vector3 };
  sunDirection: { value: Vector3 };
  tidalAmplitude: { value: number };
  tidalIntensity: { value: number };
}

export function TidalEarth() {
  const meshRef = useRef<Mesh>(null);
  const { moon, sun } = useCelestialPositions();
  const { scale } = useScene();
  const tidalExaggeration = useSceneStore((s) => s.tidalExaggeration);
  const playing = useTimeStore((s) => s.playing);
  const speed = useTimeStore((s) => s.speed);

  const texture = useLoader(TextureLoader, TEXTURE_URLS.earth.day2k);

  const uniforms = useMemo<TidalUniforms>(
    () => ({
      map: { value: texture },
      moonDirection: { value: new Vector3() },
      sunDirection: { value: new Vector3() },
      tidalAmplitude: { value: 0.0 },
      tidalIntensity: { value: 1.0 },
    }),
    [texture]
  );

  useFrame((_, delta) => {
    // Update moon/sun directions (normalized)
    uniforms.moonDirection.value.set(moon[0], moon[1], moon[2]).normalize();
    uniforms.sunDirection.value.set(sun[0], sun[1], sun[2]).normalize();

    // Physical tidal amplitude: 0.53m / Earth radius ≈ 8.3e-8
    // Apply exaggeration factor
    const physicalAmplitude = 0.53 / 6_371_000; // meters / Earth radius in meters
    uniforms.tidalAmplitude.value = physicalAmplitude * tidalExaggeration;

    // Earth rotation
    if (meshRef.current && playing) {
      meshRef.current.rotation.y += ROTATION_SPEEDS.EARTH * delta * speed;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[scale.EARTH_RADIUS, 128, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={tidalVertexShader}
        fragmentShader={tidalFragmentShader}
      />
    </mesh>
  );
}
