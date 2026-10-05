import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  NoToneMapping,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import {
  buildDnaPositions,
  type DnaBuildOptions,
  type DnaMountOptions,
} from '@/lib/dna-geometry';
import { rendererBackendKind } from '@/lib/gpu-renderer';
import { markRendererBackend, type DnaRuntime } from '@/lib/night-sky-runtime';
import { expandPointQuads } from '@/lib/point-quads';
import { capDevicePixelRatio } from '@/lib/webgl-playback';
import { createWebGPUDnaMaterial } from '@/lib/webgpu-sky-materials';

const localYAxis = new Vector3(0, 1, 0);

export async function mountWebGPUDna(
  container: HTMLElement,
  options: DnaMountOptions,
  hooks?: { onDeviceLost?: () => void }
): Promise<DnaRuntime> {
  const scene = new Scene();
  scene.background = null;

  const camera = new PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.set(0, 0, 34);

  const renderer = new WebGPURenderer({
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
  });
  await renderer.init();
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NoToneMapping;
  const dnaMaterial = createWebGPUDnaMaterial(
    options.particleSize,
    options.particleColor
  );
  renderer.outputColorSpace = dnaMaterial.outputColorSpace;

  const backend = rendererBackendKind(renderer);
  markRendererBackend(renderer.domElement, backend);

  const setRendererSize = () => {
    const width = container.clientWidth || window.innerWidth;
    const heightPx = container.clientHeight || window.innerHeight;
    camera.aspect = width / Math.max(heightPx, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, heightPx, false);
    renderer.setPixelRatio(capDevicePixelRatio(window.devicePixelRatio || 1));
  };
  setRendererSize();
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const root = new Group();
  const content = new Group();
  root.add(content);
  scene.add(root);

  const positions = buildDnaPositions(options satisfies DnaBuildOptions);
  const quads = expandPointQuads({ positions });
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(quads.centers, 3));
  geom.setAttribute('aCenter', new Float32BufferAttribute(quads.centers, 3));
  geom.setAttribute('aCorner', new Float32BufferAttribute(quads.corners, 2));
  const dots = new Mesh(geom, dnaMaterial.material);
  dots.frustumCulled = false;
  content.add(dots);

  const frameToViewport = createViewportFraming(
    camera,
    content,
    options.startViewport,
    options.endViewport
  );
  frameToViewport();

  const rendererWithLoss = renderer as WebGPURenderer & {
    onDeviceLost: (info: unknown) => void;
  };
  const reportDeviceLost = rendererWithLoss.onDeviceLost.bind(renderer);
  rendererWithLoss.onDeviceLost = info => {
    reportDeviceLost(info);
    hooks?.onDeviceLost?.();
  };

  const renderFrame = (dt: number) => {
    content.rotateOnAxis(localYAxis, options.rotationSpeed * dt);
    renderer.render(scene, camera);
  };

  const resize = () => {
    setRendererSize();
    frameToViewport();
  };

  return {
    backend,
    domElement: renderer.domElement,
    resize,
    renderFrame,
    dispose: () => {
      geom.dispose();
      dnaMaterial.material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

function createViewportFraming(
  camera: PerspectiveCamera,
  content: Group,
  startViewport: { x: number; y: number },
  endViewport: { x: number; y: number }
) {
  const startWorld = new Vector3();
  const endWorld = new Vector3();
  const axisDir = new Vector3();
  const midpoint = new Vector3();
  const alignQuat = new Quaternion();

  const viewportToWorldOnViewPlane = (
    viewport: { x: number; y: number },
    target: Vector3
  ) => {
    const fovRad = (camera.fov * Math.PI) / 180;
    const viewHeight = 2 * Math.tan(fovRad / 2) * Math.abs(camera.position.z);
    const viewWidth = viewHeight * camera.aspect;
    target.set(
      (viewport.x - 0.5) * viewWidth,
      (0.5 - viewport.y) * viewHeight,
      0
    );
  };

  return () => {
    camera.lookAt(0, 0, 0);
    viewportToWorldOnViewPlane(startViewport, startWorld);
    viewportToWorldOnViewPlane(endViewport, endWorld);
    axisDir.subVectors(endWorld, startWorld);
    if (axisDir.lengthSq() < 1e-8) {
      return;
    }
    axisDir.normalize();
    midpoint.addVectors(startWorld, endWorld).multiplyScalar(0.5);
    alignQuat.setFromUnitVectors(localYAxis, axisDir);
    content.quaternion.copy(alignQuat);
    content.position.copy(midpoint);
  };
}
