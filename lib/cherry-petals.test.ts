import { describe, expect, it } from '@jest/globals';
import { PerspectiveCamera, Vector3 } from 'three';
import { CAMERA_FOV, CAMERA_Z } from './night-sky-data';
import {
  PETAL_MAX_ALIVE,
  applyPetalPoses,
  createCherryPetalSimulation,
  createPetalSystem,
  petalSpawnDelay,
  stepPetalSystem,
  type PetalPose,
  type PetalView,
} from './cherry-petals';

const zero = () => 0;

describe('petalSpawnDelay', () => {
  it('stays inside 8 to 11 seconds', () => {
    expect(petalSpawnDelay(() => 0)).toBe(8);
    expect(petalSpawnDelay(() => 1)).toBe(11);
    expect(petalSpawnDelay(() => 0.5)).toBe(9.5);
  });
});

describe('stepPetalSystem', () => {
  it('drops one petal after the first interval and lets it fall', () => {
    const system = createPetalSystem(zero);
    let born: PetalPose[] = [];
    let elapsed = 0;
    while (born.length === 0 && elapsed < 12) {
      born = stepPetalSystem(system, 0.05);
      elapsed += 0.05;
    }

    expect(elapsed).toBeGreaterThanOrEqual(8);
    expect(elapsed).toBeLessThan(8.2);
    expect(born).toHaveLength(1);
    expect(born[0].alpha).toBeLessThan(0.25);
    expect(born[0].y).toBeGreaterThan(-0.6);
    expect(born[0].y).toBeLessThan(1.45);
    expect(born[0].x).toBeGreaterThan(-1.25);
    expect(born[0].x).toBeLessThan(1.25);
    expect(born[0].depth).toBeGreaterThan(0.5);
    expect(born[0].depth).toBeLessThan(1.7);
    expect(born[0].scale).toBeGreaterThanOrEqual(10);
    expect(born[0].scale).toBeLessThanOrEqual(13);

    const falling = born;
    for (let i = 0; i < 39; i += 1) {
      stepPetalSystem(system, 0.05);
    }
    const later = stepPetalSystem(system, 0.05);
    expect(later[0].y).toBeLessThan(falling[0].y - 0.15);
    expect(Math.abs(later[0].x - falling[0].x)).toBeGreaterThan(0.3);
    expect(later[0].alpha).toBeGreaterThan(born[0].alpha);
  });

  it('sends each petal along a different arc and depth', () => {
    const system = createPetalSystem(mulberry32(3));
    const births: PetalPose[] = [];
    const solos: PetalPose[][] = [];
    let prevCount = 0;
    let solo: PetalPose[] | null = null;

    for (let i = 0; i < 1200; i += 1) {
      const poses = stepPetalSystem(system, 0.05);
      if (poses.length > prevCount) {
        births.push(poses.reduce((a, b) => (a.alpha < b.alpha ? a : b)));
      }
      prevCount = poses.length;
      if (poses.length === 1) {
        if (!solo) {
          solo = [];
          solos.push(solo);
        }
        solo.push(poses[0]);
      } else {
        solo = null;
      }
    }

    expect(births.length).toBeGreaterThanOrEqual(3);
    expect(spread(births.map(pose => pose.x))).toBeGreaterThan(0.45);
    expect(spread(births.map(pose => pose.depth))).toBeGreaterThan(0.3);
    expect(spread(births.map(pose => pose.scale))).toBeGreaterThan(1);
    expect(spread(births.map(pose => pose.y))).toBeGreaterThan(0.2);

    const depthTravel = solos
      .filter(track => track.length > 30)
      .map(track => Math.abs(track[30].depth - track[0].depth));
    expect(Math.max(...depthTravel)).toBeGreaterThan(0.04);

    const drift = solos
      .filter(track => track.length > 40)
      .map(track => track[40].x - track[0].x);
    expect(spread(drift)).toBeGreaterThan(0.12);
  });

  it('catches the air, then keeps falling with the same wind', () => {
    const track = firstPetalTrack(zero);
    const vertical = windowSpeeds(track.y);
    expect(vertical.some(speed => speed > -0.05)).toBe(true);
    expect(vertical.some(speed => speed < -0.18)).toBe(true);
    expect(track.y[track.y.length - 1]).toBeLessThan(track.y[0] - 0.5);
    expect(Math.abs(track.x[track.x.length - 1] - track.x[0])).toBeGreaterThan(
      0.4
    );

    const varied = createPetalSystem(mulberry32(3));
    const rises: number[] = [];
    let prev = 0;
    let current: number[] = [];
    for (let i = 0; i < 1200; i += 1) {
      const poses = stepPetalSystem(varied, 0.05);
      if (poses.length === 1) {
        if (prev !== 1) {
          current = [];
        }
        current.push(poses[0].y);
      } else if (current.length > 20) {
        rises.push(Math.max(...windowSpeeds(current)));
        current = [];
      }
      prev = poses.length;
    }
    if (current.length > 20) {
      rises.push(Math.max(...windowSpeeds(current)));
    }
    expect(Math.max(...rises)).toBeGreaterThan(0.02);
  });

  it('keeps at most a couple of petals and removes them off-screen', () => {
    const system = createPetalSystem(zero);
    let maxAlive = 0;
    const seenY: number[] = [];
    const seenX: number[] = [];

    for (let i = 0; i < 800; i += 1) {
      const poses = stepPetalSystem(system, 0.05);
      maxAlive = Math.max(maxAlive, poses.length);
      for (const pose of poses) {
        seenY.push(pose.y);
        seenX.push(pose.x);
        expect(pose.y).toBeGreaterThan(-1.2);
        expect(pose.x).toBeGreaterThan(-1.3);
        expect(pose.alpha).toBeGreaterThan(0);
        expect(pose.alpha).toBeLessThanOrEqual(1);
      }
    }

    expect(maxAlive).toBeLessThanOrEqual(PETAL_MAX_ALIVE);
    expect(maxAlive).toBeGreaterThanOrEqual(1);
    expect(Math.min(...seenY)).toBeLessThan(0);
    expect(Math.min(...seenX)).toBeLessThan(0);
  });

  it('does not advance while reduced motion is on', () => {
    let reduced = false;
    const simulation = createCherryPetalSimulation(zero, () => reduced);
    stepUntil(simulation.step, 9);
    expect(simulation.system.petals.length).toBe(1);

    reduced = true;
    expect(simulation.step(1)).toEqual([]);
    expect(simulation.system.petals).toHaveLength(0);

    const waiting = simulation.system.spawnIn;
    reduced = false;
    simulation.step(0.05);
    expect(simulation.system.spawnIn).toBeCloseTo(waiting - 0.05, 5);
  });
});

describe('viewport coverage', () => {
  it('spreads paths across both sides of the diagonal at every depth', () => {
    for (const aspect of [16 / 9, 9 / 16]) {
      const coverage = projectSpawns(aspect, 2000, mulberry32(11));
      expect(coverage.total).toBeGreaterThan(10_000);
      for (const share of [
        coverage.tl,
        coverage.tr,
        coverage.bl,
        coverage.br,
      ]) {
        expect(share).toBeGreaterThan(0.15);
        expect(share).toBeLessThan(0.4);
      }
      expect(coverage.above).toBeGreaterThan(0.35);
      expect(coverage.above).toBeLessThan(0.65);
      expect(coverage.below).toBeGreaterThan(0.35);
      expect(coverage.below).toBeLessThan(0.65);
      expect(coverage.maxNdcError).toBeLessThan(1e-4);

      for (const band of coverage.depths) {
        expect(band.total).toBeGreaterThan(1000);
        expect(band.br).toBeGreaterThan(0.12);
        expect(band.bl).toBeGreaterThan(0.12);
        expect(band.above).toBeGreaterThan(0.3);
        expect(band.above).toBeLessThan(0.7);
      }
    }
  });
});

describe('applyPetalPoses', () => {
  it('places a centered petal in front of the camera and hides the rest', () => {
    const views = [fakeView(), fakeView()];
    const pose: PetalPose = {
      x: 0,
      y: 0,
      depth: 1,
      rotation: 0.4,
      tumble: -0.2,
      pitch: 0.3,
      alpha: 0.8,
      scale: 12,
    };
    applyPetalPoses(views, [pose], { fov: 70, aspect: 1 });

    expect(views[0].mesh.visible).toBe(true);
    expect(views[0].mesh.position).toMatchObject({ x: 0, y: 0, z: -210 });
    expect(views[0].mesh.rotation).toEqual({ x: 0.3, y: -0.2, z: 0.4 });
    expect(views[0].opacity).toBe(0.8);
    expect(views[1].mesh.visible).toBe(false);
    expect(views[1].opacity).toBe(0);
  });
});

function projectSpawns(aspect: number, spawnTarget: number, rng: () => number) {
  const system = createPetalSystem(rng);
  const camera = new PerspectiveCamera(CAMERA_FOV, aspect, 1, 4000);
  camera.position.set(Math.sin(1.2) * 8, Math.cos(1) * 5, CAMERA_Z);
  camera.lookAt(2, -1, 0);
  camera.updateMatrixWorld(true);

  const view = fakeView();
  const world = new Vector3();
  const ndc = new Vector3();
  const counts = { tl: 0, tr: 0, bl: 0, br: 0, above: 0, below: 0, total: 0 };
  const bands = {
    near: { tl: 0, tr: 0, bl: 0, br: 0, above: 0, below: 0, total: 0 },
    mid: { tl: 0, tr: 0, bl: 0, br: 0, above: 0, below: 0, total: 0 },
    far: { tl: 0, tr: 0, bl: 0, br: 0, above: 0, below: 0, total: 0 },
  };
  let maxNdcError = 0;
  let spawns = 0;
  let prev = 0;

  for (let i = 0; i < 3_000_000 && spawns < spawnTarget; i += 1) {
    const poses = stepPetalSystem(system, 0.05);
    if (poses.length > prev) {
      spawns += poses.length - prev;
    }
    prev = poses.length;
    for (const pose of poses) {
      if (pose.alpha < 0.08) {
        continue;
      }
      applyPetalPoses([view], [pose], camera);
      const position = view.mesh.position as unknown as {
        x: number;
        y: number;
        z: number;
      };
      world
        .set(position.x, position.y, position.z)
        .applyMatrix4(camera.matrixWorld);
      ndc.copy(world).project(camera);
      maxNdcError = Math.max(
        maxNdcError,
        Math.abs(ndc.x - pose.x),
        Math.abs(ndc.y - pose.y)
      );
      if (ndc.z < -1 || ndc.z > 1) {
        continue;
      }
      if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) {
        continue;
      }
      const band =
        pose.depth < 0.9
          ? bands.near
          : pose.depth < 1.25
            ? bands.mid
            : bands.far;
      tally(counts, ndc.x, ndc.y);
      tally(band, ndc.x, ndc.y);
    }
  }

  return {
    ...shares(counts),
    maxNdcError,
    depths: [shares(bands.near), shares(bands.mid), shares(bands.far)],
  };
}

function tally(
  bucket: {
    tl: number;
    tr: number;
    bl: number;
    br: number;
    above: number;
    below: number;
    total: number;
  },
  x: number,
  y: number
) {
  bucket.total += 1;
  if (x < 0 && y >= 0) {
    bucket.tl += 1;
  } else if (x >= 0 && y >= 0) {
    bucket.tr += 1;
  } else if (x < 0) {
    bucket.bl += 1;
  } else {
    bucket.br += 1;
  }
  if (x + y > 0) {
    bucket.above += 1;
  } else {
    bucket.below += 1;
  }
}

function shares(bucket: {
  tl: number;
  tr: number;
  bl: number;
  br: number;
  above: number;
  below: number;
  total: number;
}) {
  const share = (count: number) => count / Math.max(bucket.total, 1);
  return {
    total: bucket.total,
    tl: share(bucket.tl),
    tr: share(bucket.tr),
    bl: share(bucket.bl),
    br: share(bucket.br),
    above: share(bucket.above),
    below: share(bucket.below),
  };
}

function firstPetalTrack(rng: () => number) {
  const system = createPetalSystem(rng);
  const y: number[] = [];
  const x: number[] = [];
  let tracking = false;
  for (let i = 0; i < 500 && y.length < 400; i += 1) {
    const poses = stepPetalSystem(system, 0.05);
    if (!tracking) {
      if (poses.length === 0) {
        continue;
      }
      tracking = true;
    }
    if (poses.length === 0) {
      break;
    }
    if (y.length > 0 && Math.abs(poses[0].y - y[y.length - 1]) > 0.45) {
      break;
    }
    y.push(poses[0].y);
    x.push(poses[0].x);
  }
  return { x, y };
}

function windowSpeeds(samples: number[]) {
  const speeds: number[] = [];
  const span = 8;
  for (let i = span; i < samples.length; i += 1) {
    speeds.push((samples[i] - samples[i - span]) / (span * 0.05));
  }
  return speeds;
}

function spread(values: number[]) {
  return Math.max(...values) - Math.min(...values);
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stepUntil(step: (dt: number) => PetalPose[], seconds: number) {
  let left = seconds;
  while (left > 0) {
    const dt = Math.min(0.05, left);
    step(dt);
    left -= dt;
  }
}

function fakeView(): PetalView & { opacity: number } {
  const position = {
    x: 0,
    y: 0,
    z: 0,
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    },
  };
  const rotation = { x: 0, y: 0, z: 0 };
  const view: PetalView & { opacity: number } = {
    opacity: 1,
    mesh: {
      visible: false,
      position,
      rotation,
      scale: {
        set() {},
      },
    },
    setOpacity(opacity: number) {
      view.opacity = opacity;
    },
  };
  return view;
}
