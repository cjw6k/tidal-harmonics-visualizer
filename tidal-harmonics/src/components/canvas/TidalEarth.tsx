import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3, Texture, Quaternion } from 'three';
import type { Mesh } from 'three';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { useScene } from '@/hooks/useScene';
import { useSceneStore } from '@/stores/sceneStore';
import { useTimeStore } from '@/stores/timeStore';
import { TEXTURE_URLS, ROTATION_SPEEDS } from '@/lib/constants';

const tidalVertexShader = `
  uniform vec3 moonDirection;
  uniform vec3 sunDirection;
  uniform vec3 sunLightDir;
  uniform float tidalAmplitude;

  varying float vTidalDisplacement;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;

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

    // Transform normal to world space for lighting
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const tidalFragmentShader = `
  uniform sampler2D map;
  uniform float tidalIntensity;
  uniform vec3 sunLightDir;

  varying float vTidalDisplacement;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;

  void main() {
    vec3 baseColor = texture2D(map, vUv).rgb;

    // Sun-based lighting (diffuse)
    float diffuse = max(dot(normalize(vWorldNormal), normalize(sunLightDir)), 0.0);
    // Add ambient so dark side isn't completely black
    float lighting = 0.15 + diffuse * 0.85;

    vec3 litColor = baseColor * lighting;

    // Color tint on bulges - more visible for pedagogical effect
    float bulgeIntensity = abs(vTidalDisplacement) * tidalIntensity;
    // Amplify the tint so bulge areas show subtle blue highlight
    vec3 bulgeColor = mix(litColor, vec3(0.3, 0.5, 1.0), clamp(bulgeIntensity * 3.0, 0.0, 0.4));

    gl_FragColor = vec4(bulgeColor, 1.0);
  }
`;

interface TidalUniforms {
  [uniform: string]: { value: unknown };
  map: { value: Texture };
  moonDirection: { value: Vector3 };
  sunDirection: { value: Vector3 };
  sunLightDir: { value: Vector3 };
  tidalAmplitude: { value: number };
  tidalIntensity: { value: number };
}

export function TidalEarth() {
  const meshRef = useRef<Mesh>(null);
  const { moon, sun } = useCelestialPositions();
  const { scale } = useScene();
  const tidalExaggeration = useSceneStore((s) => s.tidalExaggeration);
  const pulseEffect = useSceneStore((s) => s.pulseEffect);
  const playing = useTimeStore((s) => s.playing);
  const speed = useTimeStore((s) => s.speed);

  const texture = useLoader(TextureLoader, TEXTURE_URLS.earth.day2k);

  const uniforms = useMemo<TidalUniforms>(
    () => ({
      map: { value: texture },
      moonDirection: { value: new Vector3() },
      sunDirection: { value: new Vector3() },
      sunLightDir: { value: new Vector3() },
      tidalAmplitude: { value: 0.0 },
      tidalIntensity: { value: 1.0 },
    }),
    [texture]
  );

  useFrame(({ clock }, delta) => {
    // Earth rotation (do this first so we can use the rotation to transform directions)
    if (meshRef.current && playing) {
      meshRef.current.rotation.y += ROTATION_SPEEDS.EARTH * delta * speed;
    }

    // Transform moon/sun directions from world space to object space
    // This ensures the tidal bulge always points toward the Moon regardless of Earth's rotation
    const moonDir = new Vector3(moon[0], moon[1], moon[2]).normalize();
    const sunDir = new Vector3(sun[0], sun[1], sun[2]).normalize();

    if (meshRef.current) {
      // Get inverse of mesh rotation to transform world -> object space
      const inverseQuat = new Quaternion();
      meshRef.current.getWorldQuaternion(inverseQuat);
      inverseQuat.invert();

      moonDir.applyQuaternion(inverseQuat);
      sunDir.applyQuaternion(inverseQuat);
    }

    uniforms.moonDirection.value.copy(moonDir);
    uniforms.sunDirection.value.copy(sunDir);
    // Sun light direction in world space (not transformed) for lighting
    uniforms.sunLightDir.value.set(sun[0], sun[1], sun[2]).normalize();

    // Pedagogical tidal amplitude for visible effect
    // Physical amplitude (0.53m / 6,371km = 8.3e-8) is invisible even at 50,000×
    // Instead, use a visual amplitude calibrated to tutorial exaggeration levels:
    // At 50,000× exaggeration → 12% bulge (clearly visible)
    const pedagogicalAmplitude = 0.12 / 50_000; // 2.4e-6
    let amplitude = pedagogicalAmplitude * tidalExaggeration;

    // Pulse effect: breathe the tidal bulge to emphasize maximum tidal range
    if (pulseEffect) {
      // Oscillate between 70% and 130% of base amplitude at ~1Hz for dramatic effect
      const pulse = Math.sin(clock.elapsedTime * 2) * 0.30 + 1.0;
      amplitude *= pulse;
      // Also pulse the color intensity more dramatically
      uniforms.tidalIntensity.value = 1.0 + Math.sin(clock.elapsedTime * 2) * 0.5;
    } else {
      uniforms.tidalIntensity.value = 1.0;
    }

    uniforms.tidalAmplitude.value = amplitude;
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
