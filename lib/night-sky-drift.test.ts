import { describe, expect, it } from '@jest/globals';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import {
  CAMERA_FOV,
  CAMERA_Z,
  STAR_DRIFT_RATE,
  randomViewportPosition,
  starLayerHalfExtents,
  starLayersForBackend,
  wrapDriftedX,
} from './night-sky-data';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = { x: number; y: number; z: number; halfWidth: number };

function buildStars(backend: 'webgl' | 'webgpu', seed: number): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (const layer of starLayersForBackend(backend)) {
    const { halfWidth } = starLayerHalfExtents(layer.planeZ);
    for (let i = 0; i < layer.count; i += 1) {
      const pos = randomViewportPosition(layer.planeZ, layer.thickness, rand);
      stars.push({ ...pos, halfWidth });
    }
  }
  return stars;
}

function visibleStars(stars: Star[], aspect: number, elapsed: number) {
  const camera = new PerspectiveCamera(CAMERA_FOV, aspect, 1, 4000);
  camera.position.set(
    Math.sin(elapsed * 0.12) * 8,
    Math.cos(elapsed * 0.1) * 5,
    CAMERA_Z
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const root = new Group();
  root.rotation.x = Math.sin(elapsed * 0.05) * 0.04;
  root.updateMatrixWorld(true);

  const world = new Vector3();
  const ndc = new Vector3();
  const grid = new Array<number>(9).fill(0);
  let visible = 0;

  for (const star of stars) {
    const x = wrapDriftedX(star.x, star.z, elapsed, star.halfWidth);
    world.set(x, star.y, star.z).applyMatrix4(root.matrixWorld);
    ndc.copy(world).project(camera);
    if (ndc.z < -1 || ndc.z > 1) continue;
    if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) continue;
    visible += 1;
    const gx = Math.min(2, Math.max(0, Math.floor(((ndc.x + 1) / 2) * 3)));
    const gy = Math.min(2, Math.max(0, Math.floor(((1 - ndc.y) / 2) * 3)));
    grid[gy * 3 + gx] += 1;
  }

  return { visible, grid };
}

describe('wrapDriftedX', () => {
  it('is the identity at t = 0 and stays inside the layer box', () => {
    const half = starLayerHalfExtents(-280).halfWidth;
    expect(wrapDriftedX(12.5, -280, 0, half)).toBeCloseTo(12.5, 6);

    for (const elapsed of [30, 120, 600, 3600, 86400]) {
      const x = wrapDriftedX(-40, -280, elapsed, half);
      expect(x).toBeGreaterThanOrEqual(-half);
      expect(x).toBeLessThan(half);
    }
  });

  it('repeats after one trip across the box', () => {
    const half = 180;
    const z = 320;
    const period = (half * 2) / Math.abs(z * STAR_DRIFT_RATE);
    expect(wrapDriftedX(25, z, period, half)).toBeCloseTo(25, 4);
    expect(wrapDriftedX(25, -z, period, half)).toBeCloseTo(25, 4);
  });
});

describe('visible star density over time', () => {
  const times = [0, 120, 300, 600, 3600];

  it('keeps WebGL density steady on desktop and phone', () => {
    const stars = buildStars('webgl', 1);
    expect(stars.length).toBe(19011);

    for (const [aspect, fraction] of [
      [16 / 9, [0.64, 0.72]],
      [9 / 16, [0.18, 0.25]],
    ] as const) {
      const samples = times.map(elapsed =>
        visibleStars(stars, aspect, elapsed)
      );
      const start = samples[0].visible;
      expect(start / stars.length).toBeGreaterThan(fraction[0]);
      expect(start / stars.length).toBeLessThan(fraction[1]);

      for (const sample of samples.slice(1)) {
        expect(sample.visible / start).toBeGreaterThan(0.97);
        expect(sample.visible / start).toBeLessThan(1.03);
      }

      const later = samples[3];
      const mean = later.visible / 9;
      expect(Math.min(...later.grid) / mean).toBeGreaterThan(0.8);
    }
  });

  it('keeps WebGPU about 1.5x the WebGL visible count', () => {
    const webgl = buildStars('webgl', 2);
    const webgpu = buildStars('webgpu', 2);
    const gl = visibleStars(webgl, 16 / 9, 0).visible;
    const gpu0 = visibleStars(webgpu, 16 / 9, 0).visible;
    const gpu10 = visibleStars(webgpu, 16 / 9, 600).visible;

    expect(gpu0 / gl).toBeGreaterThan(1.45);
    expect(gpu0 / gl).toBeLessThan(1.55);
    expect(gpu10 / gpu0).toBeGreaterThan(0.97);
    expect(gpu10 / gpu0).toBeLessThan(1.03);
  });
});
