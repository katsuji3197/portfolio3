import { describe, expect, it } from '@jest/globals';
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
  it('stays inside 5 to 8 seconds', () => {
    expect(petalSpawnDelay(() => 0)).toBe(5);
    expect(petalSpawnDelay(() => 1)).toBe(8);
    expect(petalSpawnDelay(() => 0.5)).toBe(6.5);
  });
});

describe('stepPetalSystem', () => {
  it('drops one petal after the first interval and lets it fall', () => {
    const system = createPetalSystem(zero);
    let born: PetalPose[] = [];
    let elapsed = 0;
    while (born.length === 0 && elapsed < 6) {
      born = stepPetalSystem(system, 0.05);
      elapsed += 0.05;
    }

    expect(elapsed).toBeGreaterThanOrEqual(5);
    expect(elapsed).toBeLessThan(5.2);
    expect(born).toHaveLength(1);
    expect(born[0].alpha).toBeLessThan(0.2);
    expect(born[0].y).toBeGreaterThan(1);
    expect(born[0].x).toBeGreaterThan(0.3);

    const falling = born;
    for (let i = 0; i < 19; i += 1) {
      stepPetalSystem(system, 0.05);
    }
    const later = stepPetalSystem(system, 0.05);
    expect(later[0].y).toBeLessThan(falling[0].y - 0.4);
    expect(later[0].x).toBeLessThan(falling[0].x - 0.25);
    expect(later[0].alpha).toBeGreaterThan(born[0].alpha);
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
    stepUntil(simulation.step, 6);
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

describe('applyPetalPoses', () => {
  it('places a centered petal in front of the camera and hides the rest', () => {
    const views = [fakeView(), fakeView()];
    const pose: PetalPose = {
      x: 0,
      y: 0,
      rotation: 0.4,
      tumble: -0.2,
      alpha: 0.8,
      scale: 20,
    };
    applyPetalPoses(views, [pose], { fov: 70, aspect: 1 });

    expect(views[0].mesh.visible).toBe(true);
    expect(views[0].mesh.position).toMatchObject({ x: 0, y: 0, z: -210 });
    expect(views[0].mesh.rotation).toEqual({ y: -0.2, z: 0.4 });
    expect(views[0].opacity).toBe(0.8);
    expect(views[1].mesh.visible).toBe(false);
    expect(views[1].opacity).toBe(0);
  });
});

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
  const rotation = { y: 0, z: 0 };
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
