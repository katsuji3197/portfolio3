export const MAX_PIXEL_RATIO = 2;
export const CAMERA_Z = 600;
export const CAMERA_FOV = 70;
/** Mesh pattern at 4:00. Shader flow is uTime * 0.012 → 2.88. */
export const MILKY_WAY_HOLD_SECONDS = 4 * 60;

export const SKY_MOTION = {
  pointerEase: 3.2,
  yawRange: 0.055,
  pitchRange: 0.035,
  panX: 16,
  panY: 10,
} as const;

export type StarLayerConfig = {
  count: number;
  planeZ: number;
  thickness: number;
  sizeMin: number;
  sizeMax: number;
  brightnessMin: number;
  brightnessMax: number;
  twinkleAmp: number;
  parallax: number;
};

export const STAR_LAYERS: StarLayerConfig[] = [
  {
    count: 10410,
    planeZ: -280,
    thickness: 220,
    sizeMin: 3.1,
    sizeMax: 4.6,
    brightnessMin: 0.22,
    brightnessMax: 0.4,
    twinkleAmp: 0.06,
    parallax: 4,
  },
  {
    count: 6000,
    planeZ: 80,
    thickness: 180,
    sizeMin: 3.4,
    sizeMax: 5.3,
    brightnessMin: 0.28,
    brightnessMax: 0.48,
    twinkleAmp: 0.08,
    parallax: 9,
  },
  {
    count: 2400,
    planeZ: 320,
    thickness: 120,
    sizeMin: 3.7,
    sizeMax: 6.1,
    brightnessMin: 0.34,
    brightnessMax: 0.56,
    twinkleAmp: 0.1,
    parallax: 16,
  },
  {
    count: 201,
    planeZ: 460,
    thickness: 50,
    sizeMin: 5,
    sizeMax: 7.8,
    brightnessMin: 0.58,
    brightnessMax: 0.9,
    twinkleAmp: 0.04,
    parallax: 24,
  },
];

/**
 * Yaw rate the sky root used to spin at. A star at local z moves across the
 * view at dx/dt = z * STAR_DRIFT_RATE. The live sky keeps that speed, but
 * wraps inside the original box instead of rotating the box out of frame.
 * The frozen Milky Way pose still uses this same rate at t = 4 min.
 */
export const STAR_DRIFT_RATE = 0.008;

/**
 * WebGPU can carry more screen quads, so each layer grows by this factor.
 * Sizes and the spectral-class colors stay on the same ranges; only the
 * count changes. WebGL, including a lost-device fallback, keeps STAR_LAYERS.
 */
export const WEBGPU_STAR_COUNT_SCALE = 1.5;

export function starLayersForBackend(
  backend: 'webgpu' | 'webgl'
): readonly StarLayerConfig[] {
  if (backend !== 'webgpu') {
    return STAR_LAYERS;
  }
  return STAR_LAYERS.map(layer => ({
    ...layer,
    count: Math.round(layer.count * WEBGPU_STAR_COUNT_SCALE),
  }));
}

/**
 * Naked-eye spectral-class counts from the Yale Bright Star Catalogue,
 * 5th Revised Ed. (Hoffleit & Warren 1991; CDS VizieR V/50). The
 * catalogue lists 9110 entries complete to about V = 6.5. Class totals
 * are the tabulated MK letters in the VizieR-derived BSC5 table
 * (juliensimon/bright-star-catalog): O 51, B 1757, A 1963, F 1287,
 * G 1145, K 2065, M 506 (8774 classified; the rest lack an O–M class).
 * RGB is a desaturated naked-eye mapping of each class, not a new mix:
 * O/B pale blue-white, A white, F cream, G pale yellow, K pale orange,
 * M muted orange-red. Sampling uses the raw counts, not invented %.
 */
const BSC5_SPECTRAL_CLASSES = [
  { count: 51, r: 0.84, g: 0.89, b: 1.0 },
  { count: 1757, r: 0.88, g: 0.92, b: 1.0 },
  { count: 1963, r: 0.96, g: 0.97, b: 1.0 },
  { count: 1287, r: 1.0, g: 0.98, b: 0.92 },
  { count: 1145, r: 1.0, g: 0.95, b: 0.82 },
  { count: 2065, r: 1.0, g: 0.86, b: 0.7 },
  { count: 506, r: 1.0, g: 0.72, b: 0.58 },
] as const;

const BSC5_CLASSIFIED_TOTAL = BSC5_SPECTRAL_CLASSES.reduce(
  (sum, cls) => sum + cls.count,
  0
);

export type StarAttributes = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  twinkles: Float32Array;
};

export function createStarSpriteCanvas(): HTMLCanvasElement {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function fillStarAttributes(
  count: number,
  place: (index: number) => { x: number; y: number; z: number },
  sizeMin: number,
  sizeMax: number,
  brightnessMin: number,
  brightnessMax: number,
  twinkleAmp: number
): StarAttributes {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkles = new Float32Array(count * 3);
  const color = { r: 1, g: 1, b: 1 };

  for (let i = 0; i < count; i += 1) {
    const pos = place(i);
    const idx = i * 3;
    positions[idx] = pos.x;
    positions[idx + 1] = pos.y;
    positions[idx + 2] = pos.z;

    pickStarColor(color);
    const rank = Math.pow(Math.random(), 2.1);
    const brightness = brightnessMin + rank * (brightnessMax - brightnessMin);
    colors[idx] = color.r * brightness;
    colors[idx + 1] = color.g * brightness;
    colors[idx + 2] = color.b * brightness;
    sizes[i] = sizeMin + rank * (sizeMax - sizeMin);
    twinkles[idx] = Math.random() * Math.PI * 2;
    twinkles[idx + 1] = 0.2 + Math.random() * 0.75;
    twinkles[idx + 2] = twinkleAmp * (0.65 + (1 - rank) * 0.7);
  }

  return { positions, colors, sizes, twinkles };
}

/** Box the star layer is scattered in. The shader wraps X inside halfWidth. */
export function starLayerHalfExtents(planeZ: number) {
  const dist = Math.max(CAMERA_Z - planeZ, 80);
  const halfHeight =
    Math.tan(((CAMERA_FOV * Math.PI) / 180) * 0.5) * dist * 1.2;
  const halfWidth = halfHeight * 1.85;
  return { halfWidth, halfHeight };
}

export function randomViewportPosition(
  planeZ: number,
  thickness: number,
  rand: () => number = Math.random
) {
  const { halfWidth, halfHeight } = starLayerHalfExtents(planeZ);
  return {
    x: (rand() * 2 - 1) * halfWidth,
    y: (rand() * 2 - 1) * halfHeight,
    z: planeZ + (rand() - 0.5) * thickness,
  };
}

/**
 * Keep a star inside its layer box while it drifts at the old yaw's
 * initial speed (dx/dt = z * STAR_DRIFT_RATE). Wrapping at the box edge
 * is off screen, so the viewport stays full at every elapsed time.
 * Matches `mod(shifted + halfWidth, span) - halfWidth` in the shaders.
 */
export function wrapDriftedX(
  x: number,
  z: number,
  elapsed: number,
  halfWidth: number
) {
  const span = halfWidth * 2;
  const shifted = x + z * STAR_DRIFT_RATE * elapsed;
  const wrapped =
    shifted + halfWidth - span * Math.floor((shifted + halfWidth) / span);
  return wrapped - halfWidth;
}

function pickStarColor(color: { r: number; g: number; b: number }) {
  const roll = Math.random() * BSC5_CLASSIFIED_TOTAL;
  let acc = 0;
  for (const cls of BSC5_SPECTRAL_CLASSES) {
    acc += cls.count;
    if (roll < acc) {
      const jitter = (Math.random() - 0.5) * 0.035;
      color.r = clamp01(cls.r + jitter);
      color.g = clamp01(cls.g + jitter * 0.6);
      color.b = clamp01(cls.b + jitter * 0.4);
      return;
    }
  }
  const last = BSC5_SPECTRAL_CLASSES[BSC5_SPECTRAL_CLASSES.length - 1];
  color.r = last.r;
  color.g = last.g;
  color.b = last.b;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
