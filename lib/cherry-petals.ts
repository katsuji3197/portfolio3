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

const FADE_IN_SEC = 0.75;
const OFFSCREEN_Y = -1.18;

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
    if (pose.y < OFFSCREEN_Y) {
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
    x0: rng() * 1.5 - 0.75,
    y0: 1.12,
    fall: 0.18 + rng() * 0.08,
    drift: (rng() - 0.5) * 0.05,
    swayAmp: 0.03 + rng() * 0.035,
    swayFreq: 0.65 + rng() * 0.55,
    phase: rng() * Math.PI * 2,
    rot0: rng() * Math.PI * 2,
    rotSpeed: (rng() - 0.5) * 0.7,
    tumbleSpeed: 0.35 + rng() * 0.4,
    tumblePhase: rng() * Math.PI * 2,
    age: 0,
    scale: 22 + rng() * 8,
  };
}

function poseOf(petal: Petal): PetalPose {
  const age = petal.age;
  const sway = Math.sin(age * petal.swayFreq + petal.phase);
  const swaySlow = Math.sin(age * petal.swayFreq * 0.45 + petal.phase * 1.7);
  const x = petal.x0 + petal.drift * age + sway * petal.swayAmp;
  const y =
    petal.y0 - petal.fall * age + Math.sin(age * 1.15 + petal.phase) * 0.012;
  const tumble = Math.sin(age * petal.tumbleSpeed + petal.tumblePhase) * 0.4;
  const rotation =
    petal.rot0 + petal.rotSpeed * age + sway * 0.45 + swaySlow * 0.2;

  let alpha = age < FADE_IN_SEC ? age / FADE_IN_SEC : 1;
  const fadeStart = -0.72;
  const fadeEnd = OFFSCREEN_Y;
  if (y < fadeStart) {
    const t = (fadeStart - y) / (fadeStart - fadeEnd);
    alpha *= 1 - clamp(t, 0, 1);
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
  const fill = ctx.createLinearGradient(c, c - size * 0.34, c, c + size * 0.32);
  fill.addColorStop(0, 'rgba(255, 186, 226, 1)');
  fill.addColorStop(0.42, 'rgba(255, 47, 154, 1)');
  fill.addColorStop(1, 'rgba(196, 16, 112, 1)');

  ctx.save();
  ctx.shadowColor = 'rgba(255, 40, 160, 0.95)';
  ctx.shadowBlur = size * 0.16;
  tracePetal(ctx, size);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowBlur = size * 0.07;
  ctx.shadowColor = 'rgba(255, 90, 190, 0.85)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  tracePetal(ctx, size);
  ctx.clip();
  const inner = ctx.createRadialGradient(
    c,
    c - size * 0.04,
    size * 0.01,
    c,
    c,
    size * 0.14
  );
  inner.addColorStop(0, 'rgba(255, 228, 246, 0.85)');
  inner.addColorStop(1, 'rgba(255, 228, 246, 0)');
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(c, c + size * 0.18);
  ctx.quadraticCurveTo(c, c + size * 0.02, c, c - size * 0.02);
  ctx.strokeStyle = 'rgba(255, 220, 240, 0.55)';
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.lineCap = 'round';
  ctx.stroke();
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
