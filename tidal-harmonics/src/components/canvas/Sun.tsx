import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3, AdditiveBlending, BackSide } from 'three';
import type { ShaderMaterial, Mesh } from 'three';
import { useScene } from '@/hooks/useScene';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';
import { TEXTURE_URLS } from '@/lib/constants';

// Simplex noise for surface turbulence
const noiseFunction = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
`;

const sunVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragmentShader = `
  uniform sampler2D map;
  uniform float time;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  ${noiseFunction}

  void main() {
    // Base texture
    vec3 texColor = texture2D(map, vUv).rgb;

    // Animated surface turbulence
    vec3 noisePos = vPosition * 2.0 + vec3(time * 0.05, time * 0.03, time * 0.04);
    float turbulence = fbm(noisePos) * 0.5 + 0.5;

    // Sunspots - darker patches that drift slowly
    vec3 spotPos = vPosition * 1.5 + vec3(time * 0.01, time * 0.008, time * 0.012);
    float spots = smoothstep(0.55, 0.65, fbm(spotPos));

    // Granulation - small bright cells
    vec3 granulePos = vPosition * 8.0 + vec3(time * 0.1, time * 0.08, time * 0.12);
    float granules = snoise(granulePos) * 0.1 + 0.95;

    // Limb darkening - edges are dimmer
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float limb = dot(vNormal, viewDir);
    float limbDarkening = pow(limb, 0.4);

    // Combine effects
    vec3 baseColor = vec3(1.0, 0.85, 0.4); // Warm yellow-orange
    vec3 hotColor = vec3(1.0, 0.95, 0.8);  // Brighter white-yellow
    vec3 coolColor = vec3(0.9, 0.5, 0.2);  // Darker orange-red for spots

    // Mix based on turbulence and spots
    vec3 surfaceColor = mix(baseColor, hotColor, turbulence * 0.3);
    surfaceColor = mix(surfaceColor, coolColor, spots * 0.6);
    surfaceColor *= granules;

    // Apply limb darkening
    surfaceColor *= limbDarkening;

    // Blend with original texture for detail
    vec3 finalColor = mix(surfaceColor, texColor * 1.2, 0.3);

    // Boost brightness
    finalColor *= 1.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const coronaVertexShader = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coronaFragmentShader = `
  uniform float time;
  varying vec3 vNormal;

  ${noiseFunction}

  void main() {
    // View-dependent glow (brighter at edges)
    vec3 viewDir = normalize(cameraPosition);
    float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
    rim = pow(rim, 2.0);

    // Animated corona wisps
    float wisp = snoise(vNormal * 3.0 + time * 0.1) * 0.3 + 0.7;

    // Corona color gradient
    vec3 innerColor = vec3(1.0, 0.9, 0.6);
    vec3 outerColor = vec3(1.0, 0.5, 0.2);
    vec3 coronaColor = mix(innerColor, outerColor, rim);

    float alpha = rim * wisp * 0.4;

    gl_FragColor = vec4(coronaColor, alpha);
  }
`;

export function Sun() {
  const { scale } = useScene();
  const { sun } = useCelestialPositions();
  const texture = useLoader(TextureLoader, TEXTURE_URLS.sun.surface2k);
  const materialRef = useRef<ShaderMaterial>(null);
  const coronaMaterialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      time: { value: 0 },
    }),
    [texture]
  );

  const coronaUniforms = useMemo(
    () => ({
      time: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.elapsedTime;
    }
    if (coronaMaterialRef.current) {
      coronaMaterialRef.current.uniforms.time.value = clock.elapsedTime;
    }
  });

  return (
    <group position={sun}>
      {/* Main sun surface */}
      <mesh>
        <sphereGeometry args={[scale.SUN_RADIUS, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={sunVertexShader}
          fragmentShader={sunFragmentShader}
        />
      </mesh>

      {/* Corona glow - slightly larger sphere rendered from inside */}
      <mesh>
        <sphereGeometry args={[scale.SUN_RADIUS * 1.15, 32, 32]} />
        <shaderMaterial
          ref={coronaMaterialRef}
          uniforms={coronaUniforms}
          vertexShader={coronaVertexShader}
          fragmentShader={coronaFragmentShader}
          transparent
          blending={AdditiveBlending}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
