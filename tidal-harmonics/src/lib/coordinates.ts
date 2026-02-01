import * as THREE from 'three';

/**
 * Convert spherical coordinates (radius, theta, phi) to Cartesian (x, y, z)
 * theta: azimuthal angle in radians (0 to 2π)
 * phi: polar angle in radians (0 to π, measured from positive Y axis)
 */
export function sphericalToCartesian(
  radius: number,
  theta: number,
  phi: number
): [number, number, number] {
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

/**
 * Convert Cartesian coordinates to spherical
 * Returns [radius, theta, phi]
 */
export function cartesianToSpherical(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const theta = Math.atan2(z, x);
  const phi = Math.acos(y / radius);
  return [radius, theta, phi];
}

/**
 * Normalize angle to [0, 2π) range
 */
export function normalizeAngle(angle: number): number {
  const twoPi = 2 * Math.PI;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Linear interpolation between two Vector3 positions
 */
export function lerpVector3(
  from: THREE.Vector3,
  to: THREE.Vector3,
  t: number
): THREE.Vector3 {
  return new THREE.Vector3().lerpVectors(from, to, t);
}

/**
 * Get direction vector from origin to target (normalized)
 */
export function getDirection(
  from: [number, number, number],
  to: [number, number, number]
): THREE.Vector3 {
  const dir = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  );
  return dir.normalize();
}
