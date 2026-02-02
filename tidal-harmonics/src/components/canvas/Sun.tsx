import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide } from 'three';
import type { ShaderMaterial } from 'three';
import { useScene } from '@/hooks/useScene';
import { useCelestialPositions } from '@/hooks/useCelestialPositions';

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
  uniform float time;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  ${noiseFunction}

  void main() {
    // Fully procedural - no texture needed

    // Animated surface turbulence - multiple layers for complexity
    vec3 noisePos = vPosition * 2.0 + vec3(time * 0.05, time * 0.03, time * 0.04);
    float turbulence = fbm(noisePos) * 0.5 + 0.5;

    // Flowing plasma currents
    vec3 plasmaPos = vPosition * 3.0 + vec3(time * 0.08, time * 0.06, time * 0.07);
    float plasma = abs(snoise(plasmaPos)) * 0.7;
    float plasmaFlow = snoise(plasmaPos * 0.5 + time * 0.03);

    // Sunspots - darker patches that drift slowly
    vec3 spotPos = vPosition * 1.5 + vec3(time * 0.01, time * 0.008, time * 0.012);
    float spots = smoothstep(0.55, 0.65, fbm(spotPos));

    // Granulation - small bright cells with subtle animation
    vec3 granulePos = vPosition * 8.0 + vec3(time * 0.1, time * 0.08, time * 0.12);
    float granules = snoise(granulePos) * 0.15 + 0.92;

    // Surface eruptions - bright flashes
    vec3 eruptPos = vPosition * 4.0 + vec3(time * 0.2);
    float eruptions = pow(max(0.0, snoise(eruptPos)), 4.0) * 0.4;

    // Subtle limb variation based on normal (not view-dependent to avoid dark arc)
    // Use the normal's z component for subtle edge effect
    float edgeFactor = abs(vNormal.z) * 0.3 + 0.7; // Subtle variation, never goes dark

    // Pulsing core energy
    float pulse = sin(time * 0.4) * 0.08 + 1.0;
    float deepPulse = sin(time * 0.15 + length(vPosition) * 2.0) * 0.05 + 1.0;

    // Rich color palette
    vec3 whiteHot = vec3(1.0, 0.98, 0.95);      // Core white
    vec3 solarYellow = vec3(1.0, 0.92, 0.5);   // Primary yellow
    vec3 plasmaOrange = vec3(1.0, 0.7, 0.3);   // Active plasma
    vec3 deepOrange = vec3(0.95, 0.55, 0.2);   // Warm base
    vec3 spotRed = vec3(0.7, 0.35, 0.15);      // Sunspot color
    vec3 eruptionWhite = vec3(1.0, 0.95, 0.85); // Eruption flash

    // Build up the surface color
    vec3 surfaceColor = mix(solarYellow, whiteHot, turbulence * 0.4 * pulse);
    surfaceColor = mix(surfaceColor, plasmaOrange, plasma * 0.35);
    surfaceColor = mix(surfaceColor, deepOrange, (1.0 - turbulence) * 0.2);
    surfaceColor = mix(surfaceColor, spotRed, spots * 0.7);
    surfaceColor = mix(surfaceColor, eruptionWhite, eruptions);

    // Apply granulation
    surfaceColor *= granules;

    // Plasma flow color shift
    surfaceColor = mix(surfaceColor, plasmaOrange, abs(plasmaFlow) * 0.15);

    // Apply subtle edge variation and pulse
    surfaceColor *= edgeFactor * deepPulse;

    // Final surface color (fully procedural)
    vec3 finalColor = surfaceColor;

    // Final intensity boost - make it HOT
    finalColor *= 1.5 * pulse;

    // Add subtle bloom effect by boosting bright areas
    float brightness = dot(finalColor, vec3(0.299, 0.587, 0.114));
    finalColor += finalColor * smoothstep(0.7, 1.0, brightness) * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const coronaVertexShader = `
  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying float vRim;

  void main() {
    vNormal = normal; // Keep in local space for noise
    vLocalPos = position;

    // Calculate rim in view space for correct edge detection
    vec3 viewNormal = normalize(normalMatrix * normal);
    vec3 viewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vec3 viewDir = normalize(-viewPos); // In view space, camera is at origin

    // For BackSide, normal points inward, so we want 1 - abs(dot)
    // This gives us edge glow regardless of which side we're on
    vRim = 1.0 - abs(dot(viewNormal, viewDir));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coronaFragmentShader = `
  uniform float time;
  uniform float layerScale;
  uniform float layerIntensity;

  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying float vRim;

  ${noiseFunction}

  void main() {
    float rim = vRim;

    // Softer falloff with exponential decay
    float softRim = pow(rim, 1.2) * exp(-rim * 0.3);

    // Animated flowing plasma wisps at multiple frequencies
    float slowWisp = snoise(vNormal * 2.0 + vec3(time * 0.05, time * 0.03, time * 0.04)) * 0.4 + 0.6;
    float fastWisp = snoise(vNormal * 5.0 + vec3(time * 0.15, time * 0.12, time * 0.1)) * 0.2 + 0.8;
    float wisp = slowWisp * fastWisp;

    // Flowing prominences - tendrils that reach outward
    vec3 prominencePos = vNormal * 1.5 + vec3(time * 0.02);
    float prominence = pow(max(0.0, snoise(prominencePos * 2.0)), 2.0) * 0.5;

    // Pulsing effect
    float pulse = sin(time * 0.5) * 0.1 + 1.0;

    // Dynamic color gradient - shifts between hot colors
    float colorShift = sin(time * 0.3 + rim * 3.0) * 0.5 + 0.5;
    vec3 hotWhite = vec3(1.0, 0.98, 0.95);
    vec3 solarYellow = vec3(1.0, 0.9, 0.5);
    vec3 plasmaOrange = vec3(1.0, 0.6, 0.2);
    vec3 deepRed = vec3(0.9, 0.3, 0.1);

    // Inner corona is white-hot, outer fades through yellow to orange
    vec3 coronaColor = mix(hotWhite, solarYellow, rim * 0.5);
    coronaColor = mix(coronaColor, plasmaOrange, rim * rim);
    coronaColor = mix(coronaColor, deepRed, prominence);

    // Add color shift for phantasmagorical effect
    coronaColor = mix(coronaColor, solarYellow, colorShift * 0.2);

    // Combine effects with softer alpha falloff - boosted for visibility
    float alpha = softRim * wisp * layerIntensity * pulse * 1.5;
    alpha += prominence * 0.5 * layerIntensity;

    // Smooth outer edge fade - gentler for more visible glow
    alpha *= smoothstep(0.0, 0.15, rim) * smoothstep(1.0, 0.4, rim);

    // Boost brightness for phantasmagorical effect
    gl_FragColor = vec4(coronaColor * 1.5, alpha);
  }
`;

export function Sun() {
  const { scale } = useScene();
  const { sun } = useCelestialPositions();
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
    }),
    []
  );

  // Multiple corona layers for soft falloff - increased intensity for dramatic effect
  const coronaLayers = useMemo(
    () => [
      { scale: 1.06, intensity: 0.9 },  // Tight inner glow
      { scale: 1.12, intensity: 0.7 },  // Inner corona
      { scale: 1.22, intensity: 0.5 },  // Mid corona
      { scale: 1.35, intensity: 0.35 }, // Outer corona
      { scale: 1.55, intensity: 0.2 },  // Far corona
      { scale: 1.8, intensity: 0.1 },   // Distant halo
    ],
    []
  );

  const coronaUniformsArray = useMemo(
    () =>
      coronaLayers.map((layer) => ({
        time: { value: 0 },
        layerScale: { value: layer.scale },
        layerIntensity: { value: layer.intensity },
      })),
    [coronaLayers]
  );

  const coronaMaterialRefs = useRef<(ShaderMaterial | null)[]>([]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.elapsedTime;
    }
    // Update all corona layers
    coronaMaterialRefs.current.forEach((mat) => {
      if (mat) {
        mat.uniforms.time.value = clock.elapsedTime;
      }
    });
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

      {/* Multi-layer corona for soft ethereal glow */}
      {coronaLayers.map((layer, i) => (
        <mesh key={i}>
          <sphereGeometry args={[scale.SUN_RADIUS * layer.scale, 48, 48]} />
          <shaderMaterial
            ref={(el) => {
              coronaMaterialRefs.current[i] = el;
            }}
            uniforms={coronaUniformsArray[i]}
            vertexShader={coronaVertexShader}
            fragmentShader={coronaFragmentShader}
            transparent
            blending={AdditiveBlending}
            side={BackSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
