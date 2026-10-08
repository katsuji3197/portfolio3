import { MILKY_CLEARANCE_TABLES } from '@/lib/milky-way-clearance-table';
import {
  CAMERA_Z,
  MILKY_WAY_HOLD_SECONDS,
  SKY_MOTION,
  STAR_DRIFT_RATE,
  fillStarAttributes,
  starLayerHalfExtents,
  type StarAttributes,
  type StarLayerConfig,
} from '@/lib/night-sky-data';

/**
 * The Milky Way is a 3200×780 plane frozen at the 4-minute pose and parented
 * to the camera, so it stays put in view space while stars drift in X.
 * Depth is not the depth buffer: both backends draw stars and the band with
 * depthTest off. "In front" means the view ray hits that quad closer than
 * the star. WebGL and WebGPU share this placement, then the vertex shader
 * only wraps X inside the interval chosen here.
 *
 * Stars that never cross the band keep their layer depth, size, and the
 * original box. Stars that would cross it are moved back along the view ray
 * until the whole drift interval sits behind the quad, and aSize is scaled
 * by the same ratio so the on-screen point size stays put.
 *
 * The handoff at that boundary is a fade, not a cut. A star at the original
 * depth eases out over MILKY_DEPTH_FADE_SECONDS as it reaches the gap, and
 * the star placed behind the mesh eases in over the same travel time. Rows
 * with no gap stay fully opaque.
 */
const QUAD_HALF_X = 1600;
const QUAD_HALF_Y = 390;
/** A few units past the mesh so a star does not sit on the near side. */
const QUAD_PAD = 8;
const DEPTH_MARGIN = 4;
const ROW_COUNT = 28;

export type ClearedStar = {
  x: number;
  y: number;
  z: number;
  parallax: number;
  /** 1 = wrap the layer box, skipping the band. 0 = wrap a linear interval. */
  mode: number;
  gapLo: number;
  gapHi: number;
  half: number;
  sizeScale: number;
};

type MotionState = {
  px: number;
  py: number;
  /** Live view × live root, column-major. */
  m: Float64Array;
  normal: [number, number, number];
  planeD: number;
  /** Inverse mesh 3×3, column-major, and its translation. */
  q: Float64Array;
  qTrans: [number, number, number];
};

type Row = {
  y: number;
  open: boolean;
  lo: number;
  hi: number;
  behindZ: number;
  behindK: number;
};

const scratch = { ok: false, lo: 0, hi: 0 };
const candidates = new Float64Array(16);
let motionStates: MotionState[] | null = null;

function rotationXYZ(x: number, y: number, z: number, te: Float64Array) {
  const a = Math.cos(x);
  const b = Math.sin(x);
  const c = Math.cos(y);
  const d = Math.sin(y);
  const e = Math.cos(z);
  const f = Math.sin(z);
  const ae = a * e;
  const af = a * f;
  const be = b * e;
  const bf = b * f;
  te[0] = c * e;
  te[4] = -c * f;
  te[8] = d;
  te[12] = 0;
  te[1] = af + be * d;
  te[5] = ae - bf * d;
  te[9] = -b * c;
  te[13] = 0;
  te[2] = bf - ae * d;
  te[6] = be + af * d;
  te[10] = a * c;
  te[14] = 0;
  te[3] = 0;
  te[7] = 0;
  te[11] = 0;
  te[15] = 1;
}

/** View matrix of a camera at `eye` looking at `target`, three.js lookAt. */
function cameraView(
  eyeX: number,
  eyeY: number,
  eyeZ: number,
  targetX: number,
  targetY: number,
  targetZ: number,
  out: Float64Array
) {
  let zx = eyeX - targetX;
  let zy = eyeY - targetY;
  let zz = eyeZ - targetZ;
  let len = Math.hypot(zx, zy, zz);
  if (len === 0) {
    zz = 1;
    len = 1;
  }
  zx /= len;
  zy /= len;
  zz /= len;
  let xx = zz;
  let xy = 0;
  let xz = -zx;
  len = Math.hypot(xx, xy, xz);
  if (len === 0) {
    zz += 0.0001;
    len = Math.hypot(zx, zy, zz);
    zx /= len;
    zy /= len;
    zz /= len;
    xx = zz;
    xz = -zx;
    len = Math.hypot(xx, xy, xz);
  }
  xx /= len;
  xy /= len;
  xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  out[0] = xx;
  out[4] = xy;
  out[8] = xz;
  out[1] = yx;
  out[5] = yy;
  out[9] = yz;
  out[2] = zx;
  out[6] = zy;
  out[10] = zz;
  out[12] = -(xx * eyeX + xy * eyeY + xz * eyeZ);
  out[13] = -(yx * eyeX + yy * eyeY + yz * eyeZ);
  out[14] = -(zx * eyeX + zy * eyeY + zz * eyeZ);
  out[3] = 0;
  out[7] = 0;
  out[11] = 0;
  out[15] = 1;
}

function multiply(a: Float64Array, b: Float64Array, out: Float64Array) {
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
}

function invertRigid(m: Float64Array, out: Float64Array) {
  out[0] = m[0];
  out[1] = m[4];
  out[2] = m[8];
  out[4] = m[1];
  out[5] = m[5];
  out[6] = m[9];
  out[8] = m[2];
  out[9] = m[6];
  out[10] = m[10];
  const tx = m[12];
  const ty = m[13];
  const tz = m[14];
  out[12] = -(out[0] * tx + out[4] * ty + out[8] * tz);
  out[13] = -(out[1] * tx + out[5] * ty + out[9] * tz);
  out[14] = -(out[2] * tx + out[6] * ty + out[10] * tz);
  out[3] = 0;
  out[7] = 0;
  out[11] = 0;
  out[15] = 1;
}

function buildMotionStates(): MotionState[] {
  const states: MotionState[] = [];
  const holdView = new Float64Array(16);
  const liveView = new Float64Array(16);
  const holdRoot = new Float64Array(16);
  const liveRoot = new Float64Array(16);
  const meshLocal = new Float64Array(16);
  const holdMesh = new Float64Array(16);
  const meshView = new Float64Array(16);
  const inv = new Float64Array(16);
  const starM = new Float64Array(16);
  rotationXYZ(Math.PI / 6, 0, -Math.PI / 6, meshLocal);
  const hold = MILKY_WAY_HOLD_SECONDS;

  for (const px of [-1, 0, 1]) {
    for (const py of [-1, 0, 1]) {
      cameraView(
        Math.sin(hold * 0.12) * 8 + px * SKY_MOTION.panX,
        Math.cos(hold * 0.1) * 5 + py * SKY_MOTION.panY,
        CAMERA_Z,
        px * 6,
        py * 4,
        0,
        holdView
      );
      rotationXYZ(
        Math.sin(hold * 0.05) * 0.04 - py * SKY_MOTION.pitchRange,
        hold * STAR_DRIFT_RATE + px * SKY_MOTION.yawRange,
        0,
        holdRoot
      );
      multiply(holdRoot, meshLocal, holdMesh);
      multiply(holdView, holdMesh, meshView);
      const centerX = meshView[12];
      const centerY = meshView[13];
      const centerZ = meshView[14];
      let nx = meshView[8];
      let ny = meshView[9];
      let nz = meshView[10];
      const nLen = Math.hypot(nx, ny, nz) || 1;
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;
      const planeD = nx * centerX + ny * centerY + nz * centerZ;
      invertRigid(meshView, inv);
      const q = new Float64Array([
        inv[0],
        inv[1],
        inv[2],
        inv[4],
        inv[5],
        inv[6],
        inv[8],
        inv[9],
        inv[10],
      ]);
      const qTrans: [number, number, number] = [inv[12], inv[13], inv[14]];
      const normal: [number, number, number] = [nx, ny, nz];

      for (const pitchSin of [-1, 0, 1]) {
        for (const camX of [-1, 1]) {
          for (const camY of [-1, 1]) {
            cameraView(
              camX * 8 + px * SKY_MOTION.panX,
              camY * 5 + py * SKY_MOTION.panY,
              CAMERA_Z,
              px * 6,
              py * 4,
              0,
              liveView
            );
            rotationXYZ(
              pitchSin * 0.04 - py * SKY_MOTION.pitchRange,
              px * SKY_MOTION.yawRange,
              0,
              liveRoot
            );
            multiply(liveView, liveRoot, starM);
            states.push({
              px,
              py,
              m: new Float64Array(starM),
              normal,
              planeD,
              q,
              qTrans,
            });
          }
        }
      }
    }
  }
  return states;
}

function states(): MotionState[] {
  if (!motionStates) motionStates = buildMotionStates();
  return motionStates;
}

function unsafeSpan(
  state: MotionState,
  y: number,
  z: number,
  parallax: number,
  halfX: number,
  halfY: number,
  margin: number
) {
  const px = state.px * parallax;
  const py = y + state.py * parallax;
  const m = state.m;
  const vbx = m[0] * px + m[4] * py + m[8] * z + m[12];
  const vby = m[1] * px + m[5] * py + m[9] * z + m[13];
  const vbz = m[2] * px + m[6] * py + m[10] * z + m[14];
  const vax = m[0];
  const vay = m[1];
  const vaz = m[2];
  const q = state.q;
  const qbx = q[0] * vbx + q[3] * vby + q[6] * vbz;
  const qby = q[1] * vbx + q[4] * vby + q[7] * vbz;
  const qax = q[0] * vax + q[3] * vay + q[6] * vaz;
  const qay = q[1] * vax + q[4] * vay + q[7] * vaz;
  const n0 =
    state.normal[0] * vbx + state.normal[1] * vby + state.normal[2] * vbz;
  const n1 =
    state.normal[0] * vax + state.normal[1] * vay + state.normal[2] * vaz;
  const planeD = state.planeD;
  const tx = state.qTrans[0];
  const ty = state.qTrans[1];

  let count = 0;
  const push = (x: number) => {
    if (Number.isFinite(x)) {
      candidates[count] = x;
      count += 1;
    }
  };
  push(-1e6);
  push(1e6);
  const solve = (qi: number, qa: number, ti: number, edge: number) => {
    const a = planeD * qa + ti * n1 - edge * n1;
    const b = edge * n0 - planeD * qi - ti * n0;
    if (Math.abs(a) >= 1e-10) push(b / a);
  };
  solve(qbx, qax, tx, -halfX);
  solve(qbx, qax, tx, halfX);
  solve(qby, qay, ty, -halfY);
  solve(qby, qay, ty, halfY);
  if (Math.abs(n1) > 1e-10) {
    push(-n0 / n1);
    push((planeD - n0) / n1);
  }
  for (let i = 1; i < count; i += 1) {
    const value = candidates[i];
    let j = i - 1;
    while (j >= 0 && candidates[j] > value) {
      candidates[j + 1] = candidates[j];
      j -= 1;
    }
    candidates[j + 1] = value;
  }

  const inside = (x: number) => {
    const denom = n0 + x * n1;
    if (!(denom > 1e-6)) return false;
    const vx = vbx + x * vax;
    const vy = vby + x * vay;
    const vz = vbz + x * vaz;
    const dist = Math.hypot(vx, vy, vz);
    const t = (planeD / denom) * dist;
    // `margin` pushes the star past the quad, so it is not merely grazing it.
    if (!(t > 0) || dist >= t + margin) return false;
    const lx = (planeD * (qbx + x * qax) + tx * denom) / denom;
    const ly = (planeD * (qby + x * qay) + ty * denom) / denom;
    return Math.abs(lx) <= halfX && Math.abs(ly) <= halfY;
  };

  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < count - 1; i += 1) {
    const a = candidates[i];
    const b = candidates[i + 1];
    if (b - a < 1e-4) continue;
    if (inside((a + b) * 0.5)) {
      if (a < lo) lo = a;
      if (b > hi) hi = b;
    }
  }
  scratch.ok = lo < hi;
  scratch.lo = lo;
  scratch.hi = hi;
}

function spanHitsBox(
  state: MotionState,
  y: number,
  z: number,
  parallax: number,
  lo: number,
  hi: number
) {
  unsafeSpan(
    state,
    y,
    z,
    parallax,
    QUAD_HALF_X + QUAD_PAD,
    QUAD_HALF_Y + QUAD_PAD,
    DEPTH_MARGIN
  );
  return scratch.ok && scratch.hi >= lo && scratch.lo <= hi;
}

function segmentClear(
  y: number,
  zB: number,
  gapLo: number,
  gapHi: number,
  planeZ: number,
  parallax: number,
  dys: readonly number[]
) {
  const depth0 = CAMERA_Z - planeZ;
  const k = (CAMERA_Z - zB) / depth0;
  const lo = gapLo * k;
  const hi = gapHi * k;
  if (!(hi > lo + 1e-3)) return true;
  for (const dy of dys) {
    const yB = (y + dy) * k;
    for (const state of states()) {
      if (spanHitsBox(state, yB, zB, parallax, lo, hi)) return false;
    }
  }
  return true;
}

function findBehindZ(
  y: number,
  gapLo: number,
  gapHi: number,
  planeZ: number,
  thickness: number,
  parallax: number,
  dy: number
) {
  const onRow = [0];
  const withSlop = [-dy, 0, dy];
  let z = planeZ + thickness / 2;
  const limit = -3800;
  while (z > limit) {
    if (segmentClear(y, z, gapLo, gapHi, planeZ, parallax, onRow)) {
      let best = z;
      for (const step of [24, 6]) {
        while (
          best + step <= planeZ + thickness / 2 &&
          segmentClear(y, best + step, gapLo, gapHi, planeZ, parallax, onRow)
        ) {
          best += step;
        }
      }
      while (
        best > limit &&
        !segmentClear(y, best, gapLo, gapHi, planeZ, parallax, withSlop)
      ) {
        best -= 12;
      }
      return {
        z: best,
        k: (CAMERA_Z - best) / (CAMERA_Z - planeZ),
      };
    }
    z -= 48;
  }
  return null;
}

function buildTable(layer: StarLayerConfig): Row[] {
  const { halfWidth, halfHeight } = starLayerHalfExtents(layer.planeZ);
  const dy = (2 * halfHeight) / (ROW_COUNT - 1);
  const zs = [0, 0.5, 1].map(
    t => layer.planeZ - layer.thickness / 2 + t * layer.thickness
  );
  const ySamples = [0];
  const raw: Row[] = [];

  for (let i = 0; i < ROW_COUNT; i += 1) {
    const y = -halfHeight + i * dy;
    let lo = Infinity;
    let hi = -Infinity;
    let open = false;
    for (const oy of ySamples) {
      for (const z of zs) {
        for (const state of states()) {
          unsafeSpan(
            state,
            y + oy,
            z,
            layer.parallax,
            QUAD_HALF_X + QUAD_PAD,
            QUAD_HALF_Y + QUAD_PAD,
            DEPTH_MARGIN
          );
          if (!scratch.ok) continue;
          const a = Math.max(scratch.lo, -halfWidth);
          const b = Math.min(scratch.hi, halfWidth);
          if (a < b) {
            open = true;
            if (a < lo) lo = a;
            if (b > hi) hi = b;
          }
        }
      }
    }
    if (open) {
      lo = Math.max(-halfWidth, lo - 8);
      hi = Math.min(halfWidth, hi + 8);
    }
    raw.push({
      y,
      open,
      lo: open ? lo : -halfWidth,
      hi: open ? hi : -halfWidth,
      behindZ: layer.planeZ,
      behindK: 1,
    });
  }

  return raw.map((row, index) => {
    let open = row.open;
    let lo = row.lo;
    let hi = row.hi;
    for (const neighbor of [raw[index - 1], raw[index + 1]]) {
      if (!neighbor?.open) continue;
      if (!open) {
        open = true;
        lo = neighbor.lo;
        hi = neighbor.hi;
      } else {
        lo = Math.min(lo, neighbor.lo);
        hi = Math.max(hi, neighbor.hi);
      }
    }
    if (!open) {
      return {
        y: row.y,
        open: false,
        lo: -halfWidth,
        hi: -halfWidth,
        behindZ: layer.planeZ,
        behindK: 1,
      };
    }
    const behind = findBehindZ(
      row.y,
      lo,
      hi,
      layer.planeZ,
      layer.thickness,
      layer.parallax,
      dy
    );
    if (!behind) {
      throw new Error(
        `No star depth stays behind the Milky Way at y=${row.y.toFixed(1)}`
      );
    }
    return {
      y: row.y,
      open: true,
      lo,
      hi,
      behindZ: behind.z,
      behindK: behind.k,
    };
  });
}

/** Rebuilds one layer table. The page uses MILKY_CLEARANCE_TABLES instead. */
export function buildMilkyClearanceTable(layer: StarLayerConfig): Row[] {
  return buildTable(layer);
}

function tableFor(layer: StarLayerConfig): Row[] {
  const key = `${layer.planeZ}:${layer.thickness}:${layer.parallax}`;
  const baked = MILKY_CLEARANCE_TABLES[key];
  if (!baked) {
    throw new Error(`Missing Milky Way clearance table for ${key}`);
  }
  return baked;
}

export function placeClearedStar(
  layer: Pick<StarLayerConfig, 'planeZ' | 'thickness' | 'parallax' | 'count'>,
  rand: () => number = Math.random
): ClearedStar {
  const config = layer as StarLayerConfig;
  const { halfWidth, halfHeight } = starLayerHalfExtents(config.planeZ);
  const rows = tableFor(config);
  const x = (rand() * 2 - 1) * halfWidth;
  const y = (rand() * 2 - 1) * halfHeight;
  const z = config.planeZ + (rand() - 0.5) * config.thickness;
  const t = (y / halfHeight + 1) * 0.5;
  const index = Math.min(
    rows.length - 1,
    Math.max(0, Math.round(t * (rows.length - 1)))
  );
  const row = rows[index];
  const inGap = row.open && x > row.lo && x < row.hi;
  if (!inGap) {
    return {
      x,
      y,
      z,
      parallax: config.parallax,
      mode: 1,
      gapLo: row.lo,
      gapHi: row.hi,
      half: halfWidth,
      sizeScale: 1,
    };
  }
  const k = row.behindK;
  return {
    x: x * k,
    y: y * k,
    z: row.behindZ,
    parallax: config.parallax,
    mode: 0,
    gapLo: row.lo * k,
    gapHi: row.hi * k,
    half: 0,
    sizeScale: k,
  };
}

/**
 * How long a star takes to ease between fully hidden at the band edge and
 * fully opaque one fade-width farther away. Width is |z| * drift rate, so
 * the clock time stays the same at every depth.
 */
export const MILKY_DEPTH_FADE_SECONDS = 1.1;

/** Opacity for a wrapped X. 1 away from the band, 0 on the edge. */
export function milkyDepthFade(star: ClearedStar, wrappedX: number) {
  const gap = star.gapHi - star.gapLo;
  if (gap <= 0.01) return 1;
  const width = Math.max(
    Math.abs(star.z) * STAR_DRIFT_RATE * MILKY_DEPTH_FADE_SECONDS,
    1e-3
  );
  let dist: number;
  let reach = width;
  if (star.mode >= 0.5) {
    if (wrappedX >= star.gapHi) dist = wrappedX - star.gapHi;
    else if (wrappedX <= star.gapLo) dist = star.gapLo - wrappedX;
    else dist = 0;
  } else {
    dist = Math.max(0, Math.min(wrappedX - star.gapLo, star.gapHi - wrappedX));
    reach = Math.min(width, Math.max(gap * 0.5, 1e-3));
  }
  const t = Math.min(1, Math.max(0, dist / reach));
  return t * t * (3 - 2 * t);
}

/** X after drift. Matches the star vertex shaders on both backends. */
export function wrapClearedStar(star: ClearedStar, elapsed: number) {
  const drift = star.z * STAR_DRIFT_RATE * elapsed;
  if (star.mode >= 0.5) {
    const { half } = star;
    const { gapLo, gapHi } = star;
    const right = half - gapHi;
    const safeSpan = Math.max(half * 2 - (gapHi - gapLo), 1e-3);
    const s0 = star.x >= gapHi ? star.x - gapHi : star.x + half * 2 - gapHi;
    let s = s0 + drift;
    s -= safeSpan * Math.floor(s / safeSpan);
    return s <= right ? gapHi + s : -half + (s - right);
  }
  const lo = star.gapLo;
  const hi = star.gapHi;
  const span = Math.max(hi - lo, 1e-3);
  const shifted = star.x + drift;
  return lo + (shifted - lo - span * Math.floor((shifted - lo) / span));
}

export function fillClearedStarAttributes(
  layer: StarLayerConfig,
  rand: () => number = Math.random
): { attrs: StarAttributes; wraps: Float32Array } {
  const placed: ClearedStar[] = [];
  const attrs = fillStarAttributes(
    layer.count,
    () => {
      const star = placeClearedStar(layer, rand);
      placed.push(star);
      return star;
    },
    layer.sizeMin,
    layer.sizeMax,
    layer.brightnessMin,
    layer.brightnessMax,
    layer.twinkleAmp
  );
  const wraps = new Float32Array(layer.count * 4);
  for (let i = 0; i < layer.count; i += 1) {
    const star = placed[i];
    attrs.sizes[i] *= star.sizeScale;
    wraps[i * 4] = star.mode;
    wraps[i * 4 + 1] = star.gapLo;
    wraps[i * 4 + 2] = star.gapHi;
    wraps[i * 4 + 3] = star.half;
  }
  return { attrs, wraps };
}
