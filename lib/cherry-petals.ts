/**
 * One magenta cherry petal at a time, occasionally two. The pose is a
 * function of age so a paused tab (dt stops with the sky loop) resumes
 * without a jump. Both renderers draw whatever `step` returns.
 */

export const PETAL_SPAWN_MIN_SEC = 8;
export const PETAL_SPAWN_MAX_SEC = 11;
export const PETAL_MAX_ALIVE = 2;
export const PETAL_DISTANCE = 210;
export const PETAL_POOL = PETAL_MAX_ALIVE;

const FADE_IN_SEC = 0.45;
const OFFSCREEN_Y = -1.18;
const OFFSCREEN_X = -1.28;
const OFFSCREEN_X_RIGHT = 1.48;
const DEPTH_NEAR = 0.55;
const DEPTH_FAR = 1.65;

export type PetalPose = {
  x: number;
  y: number;
  /** 1 is the reference distance. Smaller is nearer (larger, brighter). */
  depth: number;
  rotation: number;
  tumble: number;
  pitch: number;
  alpha: number;
  scale: number;
};

type Gust = {
  center: number;
  rise: number;
  hold: number;
  /** 1 cancels the fall while the gust holds. A little over 1 is a slight rise. */
  strength: number;
};

type Petal = {
  x0: number;
  y0: number;
  depth0: number;
  zDrift: number;
  zAmp: number;
  zFreq: number;
  zPhase: number;
  fall: number;
  drift: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  arcAmp: number;
  arcFreq: number;
  arcPhase: number;
  yBob: number;
  gusts: Gust[];
  rot0: number;
  rotSpeed: number;
  tumbleSpeed: number;
  tumblePhase: number;
  pitchAmp: number;
  yawAmp: number;
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
    rotation: { x: number; y: number; z: number };
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
    if (
      pose.y < OFFSCREEN_Y ||
      pose.x < OFFSCREEN_X ||
      pose.x > OFFSCREEN_X_RIGHT ||
      pose.alpha <= 0
    ) {
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
    const depth = pose.depth;
    view.mesh.position.set(
      pose.x * halfW * depth,
      pose.y * halfH * depth,
      -PETAL_DISTANCE * depth
    );
    view.mesh.rotation.z = pose.rotation;
    view.mesh.rotation.y = pose.tumble;
    view.mesh.rotation.x = pose.pitch;
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
  const tumbleAmp = 0.4 + rng() * 0.85;
  const tumbleAxis = rng() * Math.PI * 2;
  return {
    x0: -0.2 + rng() * 1.4,
    y0: 0.7 + rng() * 0.62,
    depth0: 0.64 + rng() * 0.78,
    zDrift: (rng() - 0.5) * 0.1,
    zAmp: 0.06 + rng() * 0.16,
    zFreq: 0.32 + rng() * 0.6,
    zPhase: rng() * Math.PI * 2,
    // Half of the previous 3× fall (0.54–0.78) and wind (−0.52 to −0.78).
    fall: (0.18 + rng() * 0.08) * 1.5,
    drift: -(0.26 + rng() * 0.13),
    swayAmp: 0.03 + rng() * 0.18,
    swayFreq: 0.7 + rng() * 2.1,
    phase: rng() * Math.PI * 2,
    arcAmp: 0.04 + rng() * 0.34,
    arcFreq: 0.22 + rng() * 0.55,
    arcPhase: rng() * Math.PI * 2,
    yBob: 0.012 + rng() * 0.03,
    gusts: planGusts(rng),
    rot0: rng() * Math.PI * 2,
    rotSpeed: (rng() - 0.5) * 2.4,
    tumbleSpeed: 0.7 + rng() * 1.5,
    tumblePhase: rng() * Math.PI * 2,
    pitchAmp: Math.cos(tumbleAxis) * tumbleAmp,
    yawAmp: Math.sin(tumbleAxis) * tumbleAmp,
    age: 0,
    // Half of the previous 20–26 quad. Glow texture is unchanged.
    scale: 10 + rng() * 3,
  };
}

function planGusts(rng: () => number): Gust[] {
  const count = rng() < 0.22 ? 1 : 2;
  const gusts: Gust[] = [];
  let cursor = 0.55 + rng() * 0.7;
  for (let i = 0; i < count; i += 1) {
    const rise = 0.32 + rng() * 0.22;
    const hold = 0.4 + rng() * 0.75;
    const strength = 0.95 + rng() * 0.5;
    gusts.push({
      center: cursor + rise + hold / 2,
      rise,
      hold,
      strength,
    });
    cursor += rise * 2 + hold + 0.9 + rng() * 1.0;
  }
  return gusts;
}

/** Extra height from gusts that cancel or briefly reverse the baseline fall. */
function catchLift(petal: Petal, age: number): number {
  let lift = 0;
  for (const gust of petal.gusts) {
    lift += petal.fall * gust.strength * gustIntegral(age, gust);
  }
  return lift;
}

function gustIntegral(age: number, gust: Gust): number {
  const start = gust.center - (gust.rise + gust.hold / 2);
  const riseEnd = start + gust.rise;
  const holdEnd = riseEnd + gust.hold;
  const end = holdEnd + gust.rise;
  if (age <= start) {
    return 0;
  }
  if (age < riseEnd) {
    const u = (age - start) / gust.rise;
    return gust.rise * smoothIntegral(u);
  }
  const riseArea = gust.rise * 0.5;
  if (age < holdEnd) {
    return riseArea + (age - riseEnd);
  }
  if (age < end) {
    const u = (age - holdEnd) / gust.rise;
    return riseArea + gust.hold + gust.rise * (u - smoothIntegral(u));
  }
  return gust.hold + gust.rise;
}

function smoothIntegral(u: number): number {
  return u * u * u - 0.5 * u * u * u * u;
}

function poseOf(petal: Petal): PetalPose {
  const age = petal.age;
  const sway = Math.sin(age * petal.swayFreq + petal.phase);
  const gust = Math.sin(age * petal.swayFreq * 0.47 + petal.phase * 1.7);
  const arc = Math.sin(age * petal.arcFreq + petal.arcPhase) * petal.arcAmp;
  const x =
    petal.x0 +
    petal.drift * age +
    sway * petal.swayAmp +
    gust * petal.swayAmp * 0.65 +
    arc;
  const y =
    petal.y0 -
    petal.fall * age +
    Math.sin(age * petal.swayFreq * 0.63 + petal.phase) * petal.yBob +
    gust * petal.yBob * 0.45 +
    catchLift(petal, age);
  const depth = clamp(
    petal.depth0 +
      petal.zDrift * age +
      Math.sin(age * petal.zFreq + petal.zPhase) * petal.zAmp,
    DEPTH_NEAR,
    DEPTH_FAR
  );
  const tumbleWave = Math.sin(age * petal.tumbleSpeed + petal.tumblePhase);
  const tumble = tumbleWave * petal.yawAmp;
  const pitch = tumbleWave * petal.pitchAmp;
  const rotation = petal.rot0 + petal.rotSpeed * age + sway * 0.9 + gust * 0.4;

  let alpha = age < FADE_IN_SEC ? age / FADE_IN_SEC : 1;
  alpha *= clamp(1.55 - depth * 0.7, 0.38, 1);
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
    depth,
    rotation,
    tumble,
    pitch,
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
