import { describe, expect, it } from '@jest/globals';
import { Euler, Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { MILKY_CLEARANCE_TABLES } from './milky-way-clearance-table';
import {
  buildMilkyClearanceTable,
  placeClearedStar,
  wrapClearedStar,
  type ClearedStar,
} from './milky-way-clearance';
import {
  CAMERA_Z,
  MILKY_WAY_HOLD_SECONDS,
  SKY_MOTION,
  STAR_DRIFT_RATE,
  STAR_LAYERS,
  starLayerHalfExtents,
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

type Pose = {
  px: number;
  py: number;
  normal: Vector3;
  planeD: number;
  inv: Matrix4;
  root: Matrix4;
  view: Matrix4;
};

function buildPoses(): Pose[] {
  const meshLocal = new Matrix4().makeRotationFromEuler(
    new Euler(Math.PI / 6, 0, -Math.PI / 6)
  );
  const poses: Pose[] = [];
  const hold = MILKY_WAY_HOLD_SECONDS;
  for (const px of [-1, 0, 1]) {
    for (const py of [-1, 0, 1]) {
      const holdCamera = new PerspectiveCamera(70, 1, 1, 4000);
      holdCamera.position.set(
        Math.sin(hold * 0.12) * 8 + px * SKY_MOTION.panX,
        Math.cos(hold * 0.1) * 5 + py * SKY_MOTION.panY,
        CAMERA_Z
      );
      holdCamera.lookAt(px * 6, py * 4, 0);
      holdCamera.updateMatrixWorld(true);
      const holdRoot = new Matrix4().makeRotationFromEuler(
        new Euler(
          Math.sin(hold * 0.05) * 0.04 - py * SKY_MOTION.pitchRange,
          hold * STAR_DRIFT_RATE + px * SKY_MOTION.yawRange,
          0
        )
      );
      const meshView = new Matrix4()
        .copy(holdCamera.matrixWorld)
        .invert()
        .multiply(new Matrix4().multiplyMatrices(holdRoot, meshLocal));
      const center = new Vector3().applyMatrix4(meshView);
      const normal = new Vector3(0, 0, 1).transformDirection(meshView);
      const inv = meshView.clone().invert();
      const planeD = normal.dot(center);
      for (const pitchSin of [-1, 0, 1]) {
        for (const camX of [-1, 1]) {
          for (const camY of [-1, 1]) {
            const camera = new PerspectiveCamera(70, 1, 1, 4000);
            camera.position.set(
              camX * 8 + px * SKY_MOTION.panX,
              camY * 5 + py * SKY_MOTION.panY,
              CAMERA_Z
            );
            camera.lookAt(px * 6, py * 4, 0);
            camera.updateMatrixWorld(true);
            poses.push({
              px,
              py,
              normal,
              planeD,
              inv,
              root: new Matrix4().makeRotationFromEuler(
                new Euler(
                  pitchSin * 0.04 - py * SKY_MOTION.pitchRange,
                  px * SKY_MOTION.yawRange,
                  0
                )
              ),
              view: camera.matrixWorldInverse.clone(),
            });
          }
        }
      }
    }
  }
  return poses;
}

const poses = buildPoses();
const world = new Vector3();
const view = new Vector3();
const dir = new Vector3();
const hit = new Vector3();

function isInFront(star: ClearedStar, x: number) {
  for (const pose of poses) {
    world
      .set(
        x + pose.px * star.parallax,
        star.y + pose.py * star.parallax,
        star.z
      )
      .applyMatrix4(pose.root);
    view.copy(world).applyMatrix4(pose.view);
    const dist = view.length();
    if (dist < 1) return true;
    dir.copy(view).multiplyScalar(1 / dist);
    const denom = pose.normal.dot(dir);
    if (Math.abs(denom) < 1e-6) continue;
    const t = pose.planeD / denom;
    if (!(t > 0) || dist >= t - 0.5) continue;
    hit.copy(dir).multiplyScalar(t).applyMatrix4(pose.inv);
    if (Math.abs(hit.x) <= 1600 && Math.abs(hit.y) <= 390) return true;
  }
  return false;
}

describe('milky way clearance', () => {
  it('matches the baked band table', () => {
    for (const layer of STAR_LAYERS) {
      const key = `${layer.planeZ}:${layer.thickness}:${layer.parallax}`;
      expect(buildMilkyClearanceTable(layer)).toEqual(
        MILKY_CLEARANCE_TABLES[key]
      );
    }
  });

  it('keeps a full-box wrap identical to the uncut drift', () => {
    const half = starLayerHalfExtents(-280).halfWidth;
    const star: ClearedStar = {
      x: -40,
      y: 10,
      z: -280,
      parallax: 4,
      mode: 1,
      gapLo: -half,
      gapHi: -half,
      half,
      sizeScale: 1,
    };
    for (const elapsed of [0, 30, 120, 600, 3600]) {
      expect(wrapClearedStar(star, elapsed)).toBeCloseTo(
        wrapDriftedX(star.x, star.z, elapsed, half),
        4
      );
    }
  });

  it('places every WebGL star behind the frozen quad along its drift', () => {
    const rand = mulberry32(3);
    const stars: ClearedStar[] = [];
    for (const layer of STAR_LAYERS) {
      for (let i = 0; i < layer.count; i += 1) {
        stars.push(placeClearedStar(layer, rand));
      }
    }
    expect(stars).toHaveLength(19011);

    for (const elapsed of [0, 120, 600]) {
      let front = 0;
      for (const star of stars) {
        if (isInFront(star, wrapClearedStar(star, elapsed))) front += 1;
      }
      expect(front).toBe(0);
    }
  }, 20000);
});
