'use client';

import { useEffect, useRef } from 'react';
import { canUseWebGPU, enqueueGpuMount } from '@/lib/gpu-renderer';
import type { NightSkyRuntime } from '@/lib/night-sky-runtime';
import { startWebGLPlayback } from '@/lib/webgl-playback';

export default function NightSky() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    let runtime: NightSkyRuntime | null = null;
    let stopPlayback: (() => void) | null = null;
    let onResize: (() => void) | null = null;
    let onPointerMove: ((event: PointerEvent) => void) | null = null;
    let onPointerLeave: (() => void) | null = null;
    let recovering = false;

    const play = (next: NightSkyRuntime) => {
      runtime = next;
      next.renderFrame(0);
      stopPlayback?.();
      stopPlayback = startWebGLPlayback(container, (_now, dt) => {
        runtime?.renderFrame(dt);
      });
      if (onResize) {
        window.removeEventListener('resize', onResize);
      }
      onResize = () => runtime?.resize();
      window.addEventListener('resize', onResize);
    };

    const fallbackToWebGL = async () => {
      if (recovering || disposed) {
        return;
      }
      recovering = true;
      const failed = runtime;
      runtime = null;
      stopPlayback?.();
      stopPlayback = null;
      failed?.dispose();
      const { mountWebGLSky } = await import('@/lib/night-sky-webgl');
      if (disposed) {
        return;
      }
      const next = mountWebGLSky(container);
      if (disposed) {
        next.dispose();
        return;
      }
      play(next);
    };

    const setup = async () => {
      const mounted = await enqueueGpuMount(
        () =>
          mountSky(container, {
            onDeviceLost: () => {
              void fallbackToWebGL();
            },
          }),
        () => disposed
      );
      if (!mounted || disposed) {
        return;
      }

      onPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') {
          return;
        }
        const width = window.innerWidth || 1;
        const height = window.innerHeight || 1;
        runtime?.setPointerTarget(
          (event.clientX / width) * 2 - 1,
          -((event.clientY / height) * 2 - 1)
        );
      };
      onPointerLeave = () => {
        runtime?.setPointerTarget(0, 0);
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onPointerLeave);
      play(mounted);
    };

    void setup();

    return () => {
      disposed = true;
      stopPlayback?.();
      if (onResize) {
        window.removeEventListener('resize', onResize);
      }
      if (onPointerMove) {
        window.removeEventListener('pointermove', onPointerMove);
      }
      if (onPointerLeave) {
        document.documentElement.removeEventListener(
          'mouseleave',
          onPointerLeave
        );
      }
      runtime?.dispose();
      runtime = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-65"
      style={{
        background:
          'radial-gradient(1000px 600px at 50% 120%, #0b1226 0%, #070b18 35%, #050912 70%, #03060d 100%)',
      }}
    />
  );
}

async function mountSky(
  container: HTMLElement,
  hooks?: { onDeviceLost?: () => void }
): Promise<NightSkyRuntime> {
  if (await canUseWebGPU()) {
    try {
      const { mountWebGPUSky } = await import('@/lib/night-sky-webgpu');
      return await mountWebGPUSky(container, hooks);
    } catch (error) {
      console.warn('Night sky WebGPU failed; using WebGL.', error);
    }
  }
  const { mountWebGLSky } = await import('@/lib/night-sky-webgl');
  return mountWebGLSky(container);
}
