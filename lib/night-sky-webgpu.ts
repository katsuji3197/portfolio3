import {
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGPURenderer,
} from 'three/webgpu';
import { rendererBackendKind } from '@/lib/gpu-renderer';
import { bindSkyMotion } from '@/lib/night-sky-motion';
import {
  CAMERA_FOV,
  CAMERA_Z,
  fillStarAttributes,
  randomViewportPosition,
  STAR_LAYERS,
} from '@/lib/night-sky-data';
import {
  markRendererBackend,
  type NightSkyRuntime,
} from '@/lib/night-sky-runtime';
import { expandPointQuads } from '@/lib/point-quads';
import {
  createWebGPUMilkyMaterial,
  createWebGPUStarMaterial,
} from '@/lib/webgpu-sky-materials';

export async function mountWebGPUSky(
  container: HTMLElement,
  hooks?: { onDeviceLost?: () => void }
): Promise<NightSkyRuntime> {
  const renderer = new WebGPURenderer({
    antialias: false,
    alpha: true,
    depth: true,
    stencil: false,
  });
  await renderer.init();
  renderer.setClearColor(0x000000, 0);

  const backend = rendererBackendKind(renderer);
  markRendererBackend(renderer.domElement, backend);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.background = null;

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 4000);
  camera.position.z = CAMERA_Z;
  scene.add(camera);
  const holdCamera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 4000);

  const stars = createWebGPUStarMaterial(renderer);
  const root = new Group();
  scene.add(root);

  const geometries: BufferGeometry[] = [];
  const starLayers: { group: Group; parallax: number }[] = [];

  for (const config of STAR_LAYERS) {
    const attrs = fillStarAttributes(
      config.count,
      () => randomViewportPosition(config.planeZ, config.thickness),
      config.sizeMin,
      config.sizeMax,
      config.brightnessMin,
      config.brightnessMax,
      config.twinkleAmp
    );
    const quads = expandPointQuads(attrs);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(quads.centers, 3)
    );
    geometry.setAttribute(
      'aCenter',
      new Float32BufferAttribute(quads.centers, 3)
    );
    geometry.setAttribute(
      'aCorner',
      new Float32BufferAttribute(quads.corners, 2)
    );
    geometry.setAttribute(
      'aColor',
      new Float32BufferAttribute(quads.colors ?? new Float32Array(), 3)
    );
    geometry.setAttribute(
      'aSize',
      new Float32BufferAttribute(quads.sizes ?? new Float32Array(), 1)
    );
    geometry.setAttribute(
      'aTwinkle',
      new Float32BufferAttribute(quads.twinkles ?? new Float32Array(), 3)
    );
    const mesh = new Mesh(geometry, stars.material);
    mesh.frustumCulled = false;
    const group = new Group();
    group.add(mesh);
    root.add(group);
    geometries.push(geometry);
    starLayers.push({ group, parallax: config.parallax });
  }

  const milkyMaterial = createWebGPUMilkyMaterial();
  const milkyGeometry = new PlaneGeometry(3200, 780, 1, 1);
  const milkyMesh = new Mesh(milkyGeometry, milkyMaterial);
  milkyMesh.frustumCulled = false;
  const milkyGroup = new Group();
  milkyGroup.add(milkyMesh);
  milkyGroup.rotation.set(0, 0, 0);
  milkyGroup.matrixAutoUpdate = false;
  milkyGroup.frustumCulled = false;
  camera.add(milkyGroup);

  const motion = bindSkyMotion(
    { Euler, Matrix4 },
    {
      scene,
      camera,
      holdCamera,
      root,
      milkyGroup,
      starLayers,
      renderer,
      setStarTime: elapsed => {
        stars.uTime.value = elapsed;
      },
      setStarPixelRatio: pixelRatio => {
        stars.uPixelRatio.value = pixelRatio;
      },
      setMilkyTime: () => {},
    }
  );

  const rendererWithLoss = renderer as WebGPURenderer & {
    onDeviceLost: (info: unknown) => void;
  };
  const reportDeviceLost = rendererWithLoss.onDeviceLost.bind(renderer);
  rendererWithLoss.onDeviceLost = info => {
    reportDeviceLost(info);
    hooks?.onDeviceLost?.();
  };

  motion.resize();

  return {
    backend,
    resize: motion.resize,
    renderFrame: motion.renderFrame,
    setPointerTarget: motion.setPointerTarget,
    dispose: () => {
      for (const geometry of geometries) {
        geometry.dispose();
      }
      stars.material.dispose();
      stars.sprite.dispose();
      milkyGeometry.dispose();
      milkyMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
