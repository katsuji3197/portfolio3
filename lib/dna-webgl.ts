import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { buildDnaPositions, type DnaMountOptions } from '@/lib/dna-geometry';
import { markRendererBackend, type DnaRuntime } from '@/lib/night-sky-runtime';
import { capDevicePixelRatio } from '@/lib/webgl-playback';

export function mountWebGLDna(
  container: HTMLElement,
  options: DnaMountOptions
): DnaRuntime {
  const scene = new Scene();
  scene.background = null;

  const camera = new PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.set(0, 0, 34);

  const renderer = new WebGLRenderer({
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
  });
  renderer.setClearColor(0x000000, 0);
  markRendererBackend(renderer.domElement, 'webgl');

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

  const positions = buildDnaPositions(options);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color: new Color(options.particleColor),
    size: options.particleSize,
    sizeAttenuation: true,
  });
  const dots = new Points(geom, material);
  content.add(dots);

  const frameToViewport = createViewportFraming(
    camera,
    content,
    options.startViewport,
    options.endViewport
  );
  frameToViewport();

  const renderFrame = (dt: number) => {
    content.rotateOnAxis(localYAxis, options.rotationSpeed * dt);
    renderer.render(scene, camera);
  };

  const resize = () => {
    setRendererSize();
    frameToViewport();
  };

  return {
    backend: 'webgl',
    domElement: renderer.domElement,
    resize,
    renderFrame,
    dispose: () => {
      geom.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

const localYAxis = new Vector3(0, 1, 0);

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
