/**
 * One magenta cherry petal at a time, occasionally two. The pose is a
 * function of age so a paused tab (dt stops with the sky loop) resumes
 * without a jump. Both renderers draw whatever `step` returns.
 */

export const PETAL_SPAWN_MIN_SEC = 5;
export const PETAL_SPAWN_MAX_SEC = 8;
export const PETAL_MAX_ALIVE = 2;
export const PETAL_DISTANCE = 210;
export const PETAL_POOL = PETAL_MAX_ALIVE;

const FADE_IN_SEC = 0.45;
const OFFSCREEN_Y = -1.18;
const OFFSCREEN_X = -1.28;

export type PetalPose = {
  x: number;
  y: number;
  rotation: number;
  tumble: number;
  alpha: number;
  scale: number;
};

type Petal = {
  x0: number;
  y0: number;
  fall: number;
  drift: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  rot0: number;
  rotSpeed: number;
  tumbleSpeed: number;
  tumblePhase: number;
  age: number;
  scale: number;
};

export type PetalSystem = {
  petals: Petal[];
  spawnIn: number;
  rng: () => number;
};

export type PetalView = {
  mesh: {
    visible: boolean;
    position: { set: (x: number, y: number, z: number) => void };
    rotation: { y: number; z: number };
    scale: { set: (x: number, y: number, z: number) => void };
  };
  setOpacity: (opacity: number) => void;
};

export function petalSpawnDelay(rng: () => number = Math.random): number {
  return (
    PETAL_SPAWN_MIN_SEC + rng() * (PETAL_SPAWN_MAX_SEC - PETAL_SPAWN_MIN_SEC)
  );
}

export function createPetalSystem(
  rng: () => number = Math.random
): PetalSystem {
  return {
    petals: [],
    spawnIn: petalSpawnDelay(rng),
    rng,
  };
}

export function clearPetalSystem(system: PetalSystem) {
  system.petals.length = 0;
}

export function stepPetalSystem(system: PetalSystem, dt: number): PetalPose[] {
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (step === 0) {
    return system.petals.map(poseOf);
  }

  system.spawnIn -= step;
  if (system.spawnIn <= 0) {
    if (system.petals.length < PETAL_MAX_ALIVE) {
      system.petals.push(spawnPetal(system.rng));
    }
    system.spawnIn = petalSpawnDelay(system.rng);
  }

  const poses: PetalPose[] = [];
  const alive: Petal[] = [];
  for (const petal of system.petals) {
    petal.age += step;
    const pose = poseOf(petal);
    if (pose.y < OFFSCREEN_Y || pose.x < OFFSCREEN_X || pose.alpha <= 0) {
      continue;
    }
    alive.push(petal);
    poses.push(pose);
  }
  system.petals = alive;
  return poses;
}

export function createCherryPetalSimulation(
  rng: () => number = Math.random,
  prefersReduced: () => boolean = motionReduced
) {
  const system = createPetalSystem(rng);
  return {
    system,
    step(dt: number): PetalPose[] {
      if (prefersReduced()) {
        clearPetalSystem(system);
        return [];
      }
      return stepPetalSystem(system, dt);
    },
  };
}

export function applyPetalPoses(
  views: PetalView[],
  poses: PetalPose[],
  camera: { fov: number; aspect: number }
) {
  const halfH = Math.tan(((camera.fov * Math.PI) / 180) * 0.5) * PETAL_DISTANCE;
  const halfW = halfH * Math.max(camera.aspect, 0.3);

  for (let i = 0; i < views.length; i += 1) {
    const view = views[i];
    const pose = poses[i];
    if (!pose || pose.alpha <= 0.01) {
      view.mesh.visible = false;
      view.setOpacity(0);
      continue;
    }
    view.mesh.visible = true;
    view.mesh.position.set(pose.x * halfW, pose.y * halfH, -PETAL_DISTANCE);
    view.mesh.rotation.z = pose.rotation;
    view.mesh.rotation.y = pose.tumble;
    view.mesh.scale.set(pose.scale, pose.scale * 1.12, 1);
    view.setOpacity(pose.alpha);
  }
}

export function createPetalSpriteCanvas(): HTMLCanvasElement {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }
  drawCherryPetal(ctx, size);
  return canvas;
}

function spawnPetal(rng: () => number): Petal {
  return {
    x0: 0.48 + rng() * 0.72,
    y0: 1.14 + rng() * 0.18,
    // About 3× the previous 0.18–0.26 screen-heights per second.
    fall: (0.18 + rng() * 0.08) * 3,
    drift: -(0.52 + rng() * 0.26),
    swayAmp: 0.11 + rng() * 0.09,
    swayFreq: 2.4 + rng() * 1.8,
    phase: rng() * Math.PI * 2,
    rot0: rng() * Math.PI * 2,
    rotSpeed: (rng() - 0.5) * 3.4,
    tumbleSpeed: 1.3 + rng() * 1.5,
    tumblePhase: rng() * Math.PI * 2,
    age: 0,
    // Quad is about the previous petal's size so the bloom has room.
    // The drawn petal itself is scaled down inside the texture.
    scale: 20 + rng() * 6,
  };
}

function poseOf(petal: Petal): PetalPose {
  const age = petal.age;
  const sway = Math.sin(age * petal.swayFreq + petal.phase);
  const gust = Math.sin(age * petal.swayFreq * 0.41 + petal.phase * 1.7);
  const x =
    petal.x0 +
    petal.drift * age +
    sway * petal.swayAmp +
    gust * petal.swayAmp * 0.7;
  const y =
    petal.y0 -
    petal.fall * age +
    Math.sin(age * petal.swayFreq * 0.72 + petal.phase) * 0.04 +
    gust * 0.025;
  const tumble = Math.sin(age * petal.tumbleSpeed + petal.tumblePhase) * 1.2;
  const rotation =
    petal.rot0 + petal.rotSpeed * age + sway * 1.05 + gust * 0.55;

  let alpha = age < FADE_IN_SEC ? age / FADE_IN_SEC : 1;
  const fadeStart = -0.72;
  const fadeEnd = OFFSCREEN_Y;
  if (y < fadeStart) {
    const t = (fadeStart - y) / (fadeStart - fadeEnd);
    alpha *= 1 - clamp(t, 0, 1);
  }
  if (x < -0.78) {
    alpha *= 1 - clamp((-0.78 - x) / 0.42, 0, 1);
  }

  return {
    x,
    y,
    rotation,
    tumble,
    alpha: clamp(alpha, 0, 1),
    scale: petal.scale,
  };
}

function drawCherryPetal(ctx: CanvasRenderingContext2D, size: number) {
  const c = size / 2;
  const bloom = ctx.createRadialGradient(c, c, size * 0.02, c, c, size * 0.5);
  bloom.addColorStop(0, 'rgba(255, 252, 255, 1)');
  bloom.addColorStop(0.14, 'rgba(255, 120, 220, 0.95)');
  bloom.addColorStop(0.32, 'rgba(255, 40, 175, 0.82)');
  bloom.addColorStop(0.55, 'rgba(255, 20, 155, 0.58)');
  bloom.addColorStop(0.78, 'rgba(255, 12, 145, 0.28)');
  bloom.addColorStop(1, 'rgba(255, 0, 130, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(c, c + size * 0.01);
  ctx.scale(0.5, 0.5);
  ctx.translate(-c, -c);
  const fill = ctx.createLinearGradient(c, c - size * 0.34, c, c + size * 0.32);
  fill.addColorStop(0, 'rgba(255, 255, 255, 1)');
  fill.addColorStop(0.2, 'rgba(255, 210, 245, 1)');
  fill.addColorStop(0.55, 'rgba(255, 48, 176, 1)');
  fill.addColorStop(1, 'rgba(255, 12, 140, 1)');
  tracePetal(ctx, size);
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.save();
  tracePetal(ctx, size);
  ctx.clip();
  const core = ctx.createRadialGradient(
    c,
    c - size * 0.02,
    0,
    c,
    c,
    size * 0.18
  );
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.35, 'rgba(255, 244, 252, 1)');
  core.addColorStop(1, 'rgba(255, 120, 220, 0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
  ctx.restore();
}

function tracePetal(ctx: CanvasRenderingContext2D, size: number) {
  const c = size / 2;
  const s = size;
  ctx.beginPath();
  ctx.moveTo(c, c + s * 0.3);
  ctx.bezierCurveTo(
    c - s * 0.04,
    c + s * 0.16,
    c - s * 0.26,
    c + s * 0.06,
    c - s * 0.22,
    c - s * 0.08
  );
  ctx.bezierCurveTo(
    c - s * 0.2,
    c - s * 0.24,
    c - s * 0.1,
    c - s * 0.36,
    c - s * 0.03,
    c - s * 0.18
  );
  ctx.quadraticCurveTo(c, c - s * 0.04, c + s * 0.03, c - s * 0.18);
  ctx.bezierCurveTo(
    c + s * 0.1,
    c - s * 0.36,
    c + s * 0.2,
    c - s * 0.24,
    c + s * 0.22,
    c - s * 0.08
  );
  ctx.bezierCurveTo(
    c + s * 0.26,
    c + s * 0.06,
    c + s * 0.04,
    c + s * 0.16,
    c,
    c + s * 0.3
  );
  ctx.closePath();
}

function motionReduced(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
