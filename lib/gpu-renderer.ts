let gpuQueue: Promise<unknown> = Promise.resolve();

/**
 * React の開発時 Strict Mode は初期化を二重に走らせる。
 * WebGPU デバイスを同時に作ると、先に生きているキャンバスのデバイスが
 * 破棄されるので、生成と「もう不要なら破棄」までを直列にする。
 */
export function enqueueGpuMount<T extends { dispose: () => void }>(
  mount: () => Promise<T>,
  isCancelled: () => boolean
): Promise<T | null> {
  const run = gpuQueue.then(async () => {
    const mounted = await mount();
    if (isCancelled()) {
      mounted.dispose();
      return null;
    }
    return mounted;
  });
  gpuQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function canUseWebGPU(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

export function rendererBackendKind(renderer: object): 'webgpu' | 'webgl' {
  const backend = (renderer as { backend?: { isWebGPUBackend?: boolean } })
    .backend;
  return backend?.isWebGPUBackend === true ? 'webgpu' : 'webgl';
}
