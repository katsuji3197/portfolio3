import type {
  Camera,
  Euler,
  Group,
  Matrix4,
  PerspectiveCamera,
  Scene,
} from 'three';
import {
  CAMERA_Z,
  MILKY_WAY_HOLD_SECONDS,
  SKY_MOTION,
} from '@/lib/night-sky-data';
import { capDevicePixelRatio } from '@/lib/webgl-playback';

type ThreeNS = {
  Euler: new () => Euler;
  Matrix4: new () => Matrix4;
};

type StarLayer = {
  group: Group;
  parallax: number;
};

type SkyRenderer = {
  setPixelRatio: (value: number) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  render: (scene: Scene, camera: Camera) => unknown;
};

/**
 * Shared camera drift, pointer follow, and the frozen 4-minute Milky Way
 * pose. Both backends call this so the mesh cannot drift from main.
 */
export function bindSkyMotion(
  THREE: ThreeNS,
  options: {
    scene: Scene;
    camera: PerspectiveCamera;
    holdCamera: PerspectiveCamera;
    root: Group;
    milkyGroup: Group;
    starLayers: StarLayer[];
    renderer: SkyRenderer;
    setStarTime: (elapsed: number) => void;
    setStarPixelRatio: (pixelRatio: number) => void;
    setMilkyTime: (seconds: number) => void;
  }
) {
  const {
    scene,
    camera,
    holdCamera,
    root,
    milkyGroup,
    starLayers,
    renderer,
    setStarTime,
    setStarPixelRatio,
    setMilkyTime,
  } = options;

  const holdRootEuler = new THREE.Euler();
  const meshLocalEuler = new THREE.Euler();
  meshLocalEuler.set(Math.PI / 6, 0, -Math.PI / 6);
  const holdRootMatrix = new THREE.Matrix4();
  const meshLocalMatrix = new THREE.Matrix4();
  const holdMeshWorld = new THREE.Matrix4();
  const meshInHoldCam = new THREE.Matrix4();

  let elapsed = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    holdCamera.aspect = width / height;
    holdCamera.updateProjectionMatrix();
    const pixelRatio = capDevicePixelRatio(window.devicePixelRatio || 1);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    setStarPixelRatio(pixelRatio);
  };

  const renderFrame = (dt: number) => {
    elapsed += dt;
    const follow = 1 - Math.exp(-SKY_MOTION.pointerEase * dt);
    pointerX += (pointerTargetX - pointerX) * follow;
    pointerY += (pointerTargetY - pointerY) * follow;

    root.rotation.y = elapsed * 0.008 + pointerX * SKY_MOTION.yawRange;
    root.rotation.x =
      Math.sin(elapsed * 0.05) * 0.04 - pointerY * SKY_MOTION.pitchRange;
    camera.position.x =
      Math.sin(elapsed * 0.12) * 8 + pointerX * SKY_MOTION.panX;
    camera.position.y =
      Math.cos(elapsed * 0.1) * 5 + pointerY * SKY_MOTION.panY;
    camera.lookAt(pointerX * 6, pointerY * 4, 0);

    holdRootEuler.set(
      Math.sin(MILKY_WAY_HOLD_SECONDS * 0.05) * 0.04 -
        pointerY * SKY_MOTION.pitchRange,
      MILKY_WAY_HOLD_SECONDS * 0.008 + pointerX * SKY_MOTION.yawRange,
      0
    );
    holdRootMatrix.makeRotationFromEuler(holdRootEuler);
    meshLocalMatrix.makeRotationFromEuler(meshLocalEuler);
    holdMeshWorld.multiplyMatrices(holdRootMatrix, meshLocalMatrix);
    holdCamera.position.set(
      Math.sin(MILKY_WAY_HOLD_SECONDS * 0.12) * 8 + pointerX * SKY_MOTION.panX,
      Math.cos(MILKY_WAY_HOLD_SECONDS * 0.1) * 5 + pointerY * SKY_MOTION.panY,
      CAMERA_Z
    );
    holdCamera.lookAt(pointerX * 6, pointerY * 4, 0);
    holdCamera.updateMatrixWorld();
    meshInHoldCam.copy(holdCamera.matrixWorld).invert().multiply(holdMeshWorld);
    milkyGroup.matrix.copy(meshInHoldCam);
    milkyGroup.matrixWorldNeedsUpdate = true;

    for (const layer of starLayers) {
      layer.group.position.x = pointerX * layer.parallax;
      layer.group.position.y = pointerY * layer.parallax;
    }
    setStarTime(elapsed);
    setMilkyTime(MILKY_WAY_HOLD_SECONDS);
    renderer.render(scene, camera);
  };

  const setPointerTarget = (x: number, y: number) => {
    pointerTargetX = x;
    pointerTargetY = y;
  };

  return { resize, renderFrame, setPointerTarget };
}
