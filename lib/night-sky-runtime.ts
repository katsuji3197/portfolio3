export type NightSkyRuntime = {
  backend: 'webgpu' | 'webgl';
  resize: () => void;
  renderFrame: (dt: number) => void;
  setPointerTarget: (x: number, y: number) => void;
  dispose: () => void;
};

export type DnaRuntime = {
  backend: 'webgpu' | 'webgl';
  domElement: HTMLCanvasElement;
  resize: () => void;
  renderFrame: (dt: number) => void;
  dispose: () => void;
};

export function markRendererBackend(
  canvas: HTMLCanvasElement,
  backend: 'webgpu' | 'webgl'
) {
  canvas.dataset.rendererBackend = backend;
}
