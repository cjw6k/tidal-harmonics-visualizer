import { useEffect, useRef, useCallback } from 'react';
import { useHarmonicsStore } from '@/stores/harmonicsStore';

const vertexShader = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_amplitudes[8];
  uniform float u_frequencies[8];
  uniform float u_phases[8];
  uniform int u_numConstituents;
  uniform vec3 u_waterColor;
  uniform vec3 u_foamColor;

  // Simplex noise for foam
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Calculate wave height from constituents
    float height = 0.0;
    float totalAmp = 0.0;

    for (int i = 0; i < 8; i++) {
      if (i >= u_numConstituents) break;

      float amp = u_amplitudes[i];
      float freq = u_frequencies[i];
      float phase = u_phases[i];

      // Create wave pattern - different direction for each constituent
      float angle = float(i) * 0.7854; // 45 degrees apart
      vec2 dir = vec2(cos(angle), sin(angle));

      float wave = amp * sin(
        dot(uv * 10.0, dir) * freq +
        u_time * freq * 0.1 +
        phase
      );

      height += wave;
      totalAmp += amp;
    }

    // Normalize
    if (totalAmp > 0.0) {
      height /= totalAmp;
    }

    // Add subtle foam noise at wave peaks
    float foam = 0.0;
    if (height > 0.3) {
      float foamNoise = snoise(uv * 30.0 + u_time * 0.2);
      foam = (height - 0.3) * foamNoise * 0.5;
    }

    // Water color with depth shading
    float depth = (height + 1.0) * 0.5; // 0-1 range
    vec3 deepColor = u_waterColor * 0.4;
    vec3 shallowColor = u_waterColor;
    vec3 color = mix(deepColor, shallowColor, depth);

    // Add foam
    color = mix(color, u_foamColor, clamp(foam, 0.0, 1.0));

    // Add specular highlight
    float spec = pow(max(0.0, height), 4.0) * 0.3;
    color += vec3(spec);

    // Subtle gradient for depth illusion
    color *= 0.8 + uv.y * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

interface ShaderRefs {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: {
    time: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    amplitudes: WebGLUniformLocation | null;
    frequencies: WebGLUniformLocation | null;
    phases: WebGLUniformLocation | null;
    numConstituents: WebGLUniformLocation | null;
    waterColor: WebGLUniformLocation | null;
    foamColor: WebGLUniformLocation | null;
  };
}

/**
 * WaterSurfaceShader
 *
 * WebGL shader visualization showing animated water waves
 * driven by the enabled harmonic constituents.
 */
export function WaterSurfaceShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shaderRef = useRef<ShaderRefs | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const station = useHarmonicsStore((s) => s.selectedStation);
  const visibleConstituents = useHarmonicsStore((s) => s.visibleConstituents);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    // Set up geometry (fullscreen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    shaderRef.current = {
      gl,
      program,
      uniforms: {
        time: gl.getUniformLocation(program, 'u_time'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        amplitudes: gl.getUniformLocation(program, 'u_amplitudes'),
        frequencies: gl.getUniformLocation(program, 'u_frequencies'),
        phases: gl.getUniformLocation(program, 'u_phases'),
        numConstituents: gl.getUniformLocation(program, 'u_numConstituents'),
        waterColor: gl.getUniformLocation(program, 'u_waterColor'),
        foamColor: gl.getUniformLocation(program, 'u_foamColor'),
      },
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  // Animation loop
  const render = useCallback(() => {
    const shader = shaderRef.current;
    const canvas = canvasRef.current;
    if (!shader || !canvas || !station) return;

    const { gl, program, uniforms } = shader;

    // Resize canvas if needed
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);
    }

    gl.useProgram(program);

    // Time uniform (seconds since start)
    const time = (Date.now() - startTimeRef.current) / 1000;
    gl.uniform1f(uniforms.time, time);

    // Resolution
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);

    // Get constituent data
    const constituents = station.constituents
      .filter(c => visibleConstituents.includes(c.symbol))
      .slice(0, 8);

    const amplitudes = new Float32Array(8);
    const frequencies = new Float32Array(8);
    const phases = new Float32Array(8);

    // Angular speeds in degrees per hour for common constituents
    const angularSpeeds: Record<string, number> = {
      'M2': 28.984104,
      'S2': 30.0,
      'N2': 28.439730,
      'K1': 15.041069,
      'O1': 13.943036,
      'K2': 30.082138,
      'P1': 14.958931,
      'Q1': 13.398661,
    };

    constituents.forEach((c, i) => {
      amplitudes[i] = c.amplitude;
      frequencies[i] = (angularSpeeds[c.symbol] || 15) / 30; // Normalize around 0.5-1
      phases[i] = (c.phase * Math.PI) / 180; // Convert to radians
    });

    gl.uniform1fv(uniforms.amplitudes, amplitudes);
    gl.uniform1fv(uniforms.frequencies, frequencies);
    gl.uniform1fv(uniforms.phases, phases);
    gl.uniform1i(uniforms.numConstituents, constituents.length);

    // Water colors
    gl.uniform3f(uniforms.waterColor, 0.1, 0.4, 0.7); // Ocean blue
    gl.uniform3f(uniforms.foamColor, 0.9, 0.95, 1.0); // White foam

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationRef.current = requestAnimationFrame(render);
  }, [station, visibleConstituents]);

  useEffect(() => {
    if (station) {
      animationRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render, station]);

  if (!station) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-slate-500 text-center">
        Select a station to view water surface animation
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
        <span>🌊</span>
        Water Surface Animation
      </h3>

      <p className="text-slate-400 text-xs mb-3">
        WebGL shader showing combined wave patterns from enabled constituents
      </p>

      <div className="relative rounded-lg overflow-hidden" style={{ height: '180px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        {/* Overlay gradient for depth effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-900/50" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {visibleConstituents.slice(0, 8).map((symbol) => {
          const constituent = station.constituents.find(c => c.symbol === symbol);
          if (!constituent) return null;
          return (
            <span
              key={symbol}
              className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded"
            >
              {symbol}
            </span>
          );
        })}
      </div>

      <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-500">
        <strong className="text-slate-400">About this visualization:</strong>
        <p className="mt-1">
          Each enabled constituent creates a wave traveling in a different direction.
          The combined pattern shows how harmonic constituents interact to create
          complex water surface motion. Toggle constituents to see their individual effects.
        </p>
      </div>
    </div>
  );
}
