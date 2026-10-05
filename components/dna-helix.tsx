'use client';

import { useEffect, useRef } from 'react';
import { canUseWebGPU, enqueueGpuMount } from '@/lib/gpu-renderer';
import type { DnaMountOptions } from '@/lib/dna-geometry';
import type { DnaRuntime } from '@/lib/night-sky-runtime';
import { clearRendererDebug, reportRendererDebug } from '@/lib/renderer-debug';
import { startWebGLPlayback } from '@/lib/webgl-playback';

type DNAHelixProps = {
  className?: string;
  style?: React.CSSProperties;
  radius?: number;
  height?: number;
  turns?: number;
  segmentsPerTurn?: number;
  baseEvery?: number;
  rotationSpeed?: number;
  particleSize?: number;
  particleColor?: string;
  baseSegmentsPerPair?: number;
  /** 画面座標 (0–1, 左上が 0,0)。らせんが見える始点。 */
  startViewport?: { x: number; y: number };
  /** 画面座標 (0–1)。らせんが見える終点。 */
  endViewport?: { x: number; y: number };
};

const DEFAULT_START = { x: 0.02, y: 0.88 };
const DEFAULT_END = { x: 0.9, y: 0.58 };

export default function DNAHelix({
  className,
  style,
  radius = 3.2,
  height = 1600,
  turns = 100,
  segmentsPerTurn = 90,
  baseEvery = 32,
  rotationSpeed = -0.6,
  particleSize = 0.25,
  particleColor = '#aeaeff',
  baseSegmentsPerPair = 0,
  startViewport = DEFAULT_START,
  endViewport = DEFAULT_END,
}: DNAHelixProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startX = startViewport.x;
  const startY = startViewport.y;
  const endX = endViewport.x;
  const endY = endViewport.y;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let runtime: DnaRuntime | null = null;
    let stopPlayback: (() => void) | null = null;
    let onResize: (() => void) | null = null;
    let fadeFrame = 0;
    let recovering = false;

    const options: DnaMountOptions = {
      radius,
      height,
      turns,
      segmentsPerTurn,
      baseEvery,
      rotationSpeed,
      particleSize,
      particleColor,
      baseSegmentsPerPair,
      startViewport: { x: startX, y: startY },
      endViewport: { x: endX, y: endY },
    };

    const reveal = (next: DnaRuntime, fallback: boolean) => {
      runtime = next;
      reportRendererDebug('dna', next.backend, fallback);
      next.domElement.style.opacity = '0';
      next.domElement.style.transition = 'opacity 3s ease';
      fadeFrame = requestAnimationFrame(() => {
        if (!disposed) {
          next.domElement.style.opacity = '1';
        }
      });
      next.renderFrame(0);
      stopPlayback?.();
      stopPlayback = startWebGLPlayback(container, (_now, dt) => {
        runtime?.renderFrame(dt);
      });
      if (onResize) {
        window.removeEventListener('resize', onResize);
      }
      onResize = () => {
        runtime?.resize();
        runtime?.renderFrame(0);
      };
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
      const { mountWebGLDna } = await import('@/lib/dna-webgl');
      if (disposed) {
        return;
      }
      const next = mountWebGLDna(container, options);
      if (disposed) {
        next.dispose();
        return;
      }
      reveal(next, true);
    };

    const setup = async () => {
      let fallback = false;
      const mounted = await enqueueGpuMount(
        async () => {
          if (await canUseWebGPU()) {
            try {
              const { mountWebGPUDna } = await import('@/lib/dna-webgpu');
              const next = await mountWebGPUDna(container, options, {
                onDeviceLost: () => {
                  void fallbackToWebGL();
                },
              });
              fallback = next.backend !== 'webgpu';
              return next;
            } catch (error) {
              console.warn('DNA WebGPU failed; using WebGL.', error);
              fallback = true;
            }
          }
          const { mountWebGLDna } = await import('@/lib/dna-webgl');
          return mountWebGLDna(container, options);
        },
        () => disposed
      );
      if (!mounted || disposed) {
        return;
      }
      reveal(mounted, fallback);
    };

    void setup();

    return () => {
      disposed = true;
      cancelAnimationFrame(fadeFrame);
      stopPlayback?.();
      if (onResize) {
        window.removeEventListener('resize', onResize);
      }
      runtime?.dispose();
      runtime = null;
      clearRendererDebug('dna');
    };
  }, [
    radius,
    height,
    turns,
    segmentsPerTurn,
    baseEvery,
    rotationSpeed,
    particleSize,
    particleColor,
    baseSegmentsPerPair,
    startX,
    startY,
    endX,
    endY,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
