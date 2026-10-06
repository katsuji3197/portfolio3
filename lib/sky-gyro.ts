/**
 * Handheld tilt, mapped into the same -1..1 pointer the desktop mouse uses.
 * `bindSkyMotion` eases that target, so gyro and mouse share one feel.
 *
 * ±GYRO_FULL_TILT_DEG from the pose captured on the first sample (and again
 * after a portrait/landscape change) equals the mouse at the viewport edge.
 * Device axes stay in the natural orientation; the screen angle rotates them
 * so "right" and "up" follow the page. See the Device Orientation spec's
 * screen-axis remap (0° β/γ, 90° β/−γ, 180° −γ/−β, 270° −β/γ).
 */

export const GYRO_FULL_TILT_DEG = 20;

export type GyroPointer = {
  x: number;
  y: number;
};

export type ScreenTilt = {
  /** Positive when the screen's right side tilts down. */
  leftRight: number;
  /** Positive when the screen's top tips toward the user. */
  forward: number;
};

export function isCoarseHandheld(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

export function prefersReducedMotion(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function readScreenAngle(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const angle = window.screen?.orientation?.angle;
  if (typeof angle === 'number' && Number.isFinite(angle)) {
    return angle;
  }
  const legacy = (window as Window & { orientation?: number }).orientation;
  if (typeof legacy === 'number' && Number.isFinite(legacy)) {
    return legacy;
  }
  return 0;
}

/** 0 portrait, 1 rotated 90° clockwise, 2 upside down, 3 the other landscape. */
export function orientationQuarter(screenAngle: number): 0 | 1 | 2 | 3 {
  const normalized = ((screenAngle % 360) + 360) % 360;
  return (Math.round(normalized / 90) % 4) as 0 | 1 | 2 | 3;
}

export function screenTilt(
  beta: number,
  gamma: number,
  quarter: 0 | 1 | 2 | 3
): ScreenTilt {
  switch (quarter) {
    case 1:
      return { leftRight: beta, forward: -gamma };
    case 2:
      return { leftRight: -gamma, forward: -beta };
    case 3:
      return { leftRight: -beta, forward: gamma };
    default:
      return { leftRight: gamma, forward: beta };
  }
}

export function createGyroCalibration(fullTiltDeg = GYRO_FULL_TILT_DEG) {
  let baseline: ScreenTilt | null = null;
  let quarter: 0 | 1 | 2 | 3 | null = null;

  const sample = (
    beta: number | null,
    gamma: number | null,
    screenAngle: number
  ): GyroPointer | null => {
    if (beta == null || gamma == null) {
      return null;
    }
    if (!Number.isFinite(beta) || !Number.isFinite(gamma)) {
      return null;
    }

    const nextQuarter = orientationQuarter(screenAngle);
    const tilt = screenTilt(beta, gamma, nextQuarter);
    if (baseline == null || quarter !== nextQuarter) {
      baseline = tilt;
      quarter = nextQuarter;
      return { x: 0, y: 0 };
    }

    return {
      x: clamp(
        shortestDelta(tilt.leftRight, baseline.leftRight) / fullTiltDeg,
        -1,
        1
      ),
      // Decreasing beta in portrait tips the top away (look up), matching mouse-up.
      y: clamp(
        -shortestDelta(tilt.forward, baseline.forward) / fullTiltDeg,
        -1,
        1
      ),
    };
  };

  return { sample };
}

export type DeviceOrientationSample = {
  beta: number | null;
  gamma: number | null;
};

export type SkyGyroEnvironment = {
  addEventListener: (
    type: string,
    listener: (event: Event) => void,
    options?: AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: Event) => void,
    options?: EventListenerOptions
  ) => void;
  /**
   * Set only on iOS, where `DeviceOrientationEvent.requestPermission` exists.
   * Called synchronously from the gesture handler.
   */
  requestPermission?: () => Promise<string>;
  screenAngle: () => number;
};

export function browserSkyGyroEnvironment(): SkyGyroEnvironment {
  const ctor =
    window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
  const requestPermission =
    typeof ctor?.requestPermission === 'function'
      ? () => ctor.requestPermission!()
      : undefined;

  return {
    addEventListener: (type, listener, options) => {
      window.addEventListener(type, listener, options);
    },
    removeEventListener: (type, listener, options) => {
      window.removeEventListener(type, listener, options);
    },
    requestPermission,
    screenAngle: readScreenAngle,
  };
}

/**
 * Feeds `setPointerTarget`. Without `requestPermission`, listening starts
 * immediately. With it (iOS Safari/Chrome), the first `touchend` asks, and a
 * denial or throw leaves the sky still.
 */
export function startSkyGyro(
  onPointer: (pointer: GyroPointer) => void,
  env: SkyGyroEnvironment
): () => void {
  const calibration = createGyroCalibration();
  let disposed = false;
  let listening = false;
  let asked = false;

  const onOrientation = (event: Event) => {
    const sample = event as Event & DeviceOrientationSample;
    const pointer = calibration.sample(
      sample.beta,
      sample.gamma,
      env.screenAngle()
    );
    if (pointer) {
      onPointer(pointer);
    }
  };

  const listen = () => {
    if (disposed || listening) {
      return;
    }
    listening = true;
    env.addEventListener('deviceorientation', onOrientation);
  };

  const gestureOptions: AddEventListenerOptions = {
    capture: true,
    passive: true,
  };

  const onTouchEnd = () => {
    if (asked || disposed) {
      return;
    }
    asked = true;
    env.removeEventListener('touchend', onTouchEnd, gestureOptions);
    if (!env.requestPermission) {
      listen();
      return;
    }
    try {
      env.requestPermission().then(
        state => {
          if (!disposed && state === 'granted') {
            listen();
          }
        },
        () => {
          // Denied, dismissed, or rejected. Keep the still background.
        }
      );
    } catch {
      // Some browsers throw instead of rejecting. Same silent fallback.
    }
  };

  if (env.requestPermission) {
    env.addEventListener('touchend', onTouchEnd, gestureOptions);
  } else {
    listen();
  }

  return () => {
    disposed = true;
    env.removeEventListener('deviceorientation', onOrientation);
    env.removeEventListener('touchend', onTouchEnd, gestureOptions);
  };
}

function clamp(value: number, min: number, max: number) {
  const next = Math.min(max, Math.max(min, value));
  return next === 0 ? 0 : next;
}

/** Beta wraps at ±180. A step across that edge is a small tilt, not a spin. */
function shortestDelta(next: number, base: number) {
  const wrapped = ((((next - base + 180) % 360) + 360) % 360) - 180;
  return wrapped === 0 ? 0 : wrapped;
}
