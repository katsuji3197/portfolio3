import { describe, expect, it } from '@jest/globals';
import {
  GYRO_FULL_TILT_DEG,
  createGyroCalibration,
  startSkyGyro,
  type SkyGyroEnvironment,
} from './sky-gyro';

function fakeEnvironment(options?: {
  requestPermission?: () => Promise<string>;
  angle?: number;
}) {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  const env: SkyGyroEnvironment = {
    addEventListener: (type, listener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    requestPermission: options?.requestPermission,
    screenAngle: () => options?.angle ?? 0,
  };
  return {
    env,
    dispatch(type: string, detail: object) {
      for (const listener of listeners.get(type) ?? []) {
        listener(detail as Event);
      }
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

describe('createGyroCalibration', () => {
  it('treats the first holding angle as the center', () => {
    const gyro = createGyroCalibration();
    expect(gyro.sample(62, -4, 0)).toEqual({ x: 0, y: 0 });
    expect(gyro.sample(62, -4, 0)).toEqual({ x: 0, y: 0 });
  });

  it('maps a right tilt and a look-up to the mouse pointer', () => {
    const gyro = createGyroCalibration();
    gyro.sample(60, 0, 0);

    expect(gyro.sample(60, GYRO_FULL_TILT_DEG / 2, 0)).toEqual({
      x: 0.5,
      y: 0,
    });

    const lookUp = createGyroCalibration();
    lookUp.sample(60, 0, 0);
    expect(lookUp.sample(60 - GYRO_FULL_TILT_DEG / 2, 0, 0)).toEqual({
      x: 0,
      y: 0.5,
    });
  });

  it('clamps past the full tilt', () => {
    const gyro = createGyroCalibration();
    gyro.sample(60, 0, 0);
    expect(gyro.sample(60, 80, 0)).toEqual({ x: 1, y: 0 });
    expect(gyro.sample(60, -80, 0)).toEqual({ x: -1, y: 0 });
  });

  it('swaps axes for landscape and recalibrates on the turn', () => {
    const gyro = createGyroCalibration();
    gyro.sample(60, 0, 0);
    expect(gyro.sample(10, 30, 90)).toEqual({ x: 0, y: 0 });
    expect(gyro.sample(10 + GYRO_FULL_TILT_DEG / 2, 30, 90)).toEqual({
      x: 0.5,
      y: 0,
    });

    const lookUp = createGyroCalibration();
    lookUp.sample(10, 30, 90);
    expect(lookUp.sample(10, 30 + GYRO_FULL_TILT_DEG / 2, 90)).toEqual({
      x: 0,
      y: 0.5,
    });
  });

  it('ignores empty samples without moving the baseline', () => {
    const gyro = createGyroCalibration();
    gyro.sample(40, 0, 0);
    expect(gyro.sample(null, 10, 0)).toBeNull();
    expect(gyro.sample(40, GYRO_FULL_TILT_DEG / 2, 0)).toEqual({
      x: 0.5,
      y: 0,
    });
  });

  it('treats a beta wrap as a small tilt instead of a spin', () => {
    const gyro = createGyroCalibration();
    gyro.sample(170, 0, 0);
    expect(gyro.sample(-170, 0, 0)).toEqual({ x: 0, y: -1 });
  });
});

describe('startSkyGyro', () => {
  it('applies simulated deviceorientation events when permission is not required', () => {
    const host = fakeEnvironment();
    const seen: { x: number; y: number }[] = [];
    const stop = startSkyGyro(pointer => seen.push(pointer), host.env);

    host.dispatch('deviceorientation', { beta: 50, gamma: 0 });
    host.dispatch('deviceorientation', {
      beta: 50,
      gamma: GYRO_FULL_TILT_DEG / 2,
    });

    expect(seen.map(pointer => pointer.x)).toEqual([0, 0.5]);
    stop();
    host.dispatch('deviceorientation', { beta: 50, gamma: GYRO_FULL_TILT_DEG });
    expect(seen).toHaveLength(2);
    expect(host.listenerCount('deviceorientation')).toBe(0);
  });

  it('asks for permission on the first touchend and stays quiet if denied', async () => {
    const decisions: string[] = [];
    const host = fakeEnvironment({
      requestPermission: () => {
        decisions.push('asked');
        return Promise.resolve('denied');
      },
    });
    const seen: { x: number; y: number }[] = [];
    startSkyGyro(pointer => seen.push(pointer), host.env);

    host.dispatch('deviceorientation', { beta: 40, gamma: 10 });
    expect(decisions).toEqual([]);
    expect(host.listenerCount('deviceorientation')).toBe(0);

    host.dispatch('touchend', {});
    host.dispatch('touchend', {});
    await Promise.resolve();

    expect(decisions).toEqual(['asked']);
    host.dispatch('deviceorientation', { beta: 40, gamma: 10 });
    expect(seen).toEqual([]);
  });

  it('listens after a granted permission from the tap', async () => {
    let resolvePermission: (state: string) => void = () => {};
    const pending = new Promise<string>(resolve => {
      resolvePermission = resolve;
    });
    const host = fakeEnvironment({
      requestPermission: () => pending,
    });
    const seen: { x: number; y: number }[] = [];
    startSkyGyro(pointer => seen.push(pointer), host.env);

    host.dispatch('touchend', {});
    host.dispatch('deviceorientation', { beta: 20, gamma: 0 });
    expect(seen).toEqual([]);

    resolvePermission('granted');
    await pending;
    host.dispatch('deviceorientation', { beta: 20, gamma: 0 });
    host.dispatch('deviceorientation', {
      beta: 20,
      gamma: GYRO_FULL_TILT_DEG / 2,
    });
    expect(seen.map(pointer => pointer.x)).toEqual([0, 0.5]);
  });

  it('swallows a permission throw', () => {
    const host = fakeEnvironment({
      requestPermission: () => {
        throw new Error('blocked');
      },
    });
    startSkyGyro(() => {}, host.env);
    expect(() => host.dispatch('touchend', {})).not.toThrow();
    expect(host.listenerCount('deviceorientation')).toBe(0);
  });
});
