import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  Matrix4,
  Mesh,
  NoColorSpace,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three';
import {
  applyPetalPoses,
  createCherryPetalSimulation,
  createPetalSpriteCanvas,
  PETAL_POOL,
  type PetalView,
} from '@/lib/cherry-petals';
import { bindSkyMotion } from '@/lib/night-sky-motion';
import {
  CAMERA_FOV,
  CAMERA_Z,
  createStarSpriteCanvas,
  MILKY_WAY_HOLD_SECONDS,
  STAR_DRIFT_RATE,
  STAR_LAYERS,
  type StarLayerConfig,
} from '@/lib/night-sky-data';
import {
  fillClearedStarAttributes,
  MILKY_DEPTH_FADE_SECONDS,
} from '@/lib/milky-way-clearance';
import {
  markRendererBackend,
  type NightSkyRuntime,
} from '@/lib/night-sky-runtime';
import { capDevicePixelRatio } from '@/lib/webgl-playback';

export function mountWebGLSky(container: HTMLElement): NightSkyRuntime {
  const scene = new Scene();
  scene.background = null;

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 4000);
  camera.position.z = CAMERA_Z;
  scene.add(camera);
  const holdCamera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 4000);

  const renderer = new WebGLRenderer({
    antialias: false,
    alpha: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  markRendererBackend(renderer.domElement, 'webgl');
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const starTexture = new Texture(createStarSpriteCanvas());
  starTexture.needsUpdate = true;

  const root = new Group();
  scene.add(root);

  const starLayers: {
    geometry: BufferGeometry;
    material: ShaderMaterial;
    group: Group;
    parallax: number;
  }[] = [];

  for (const config of STAR_LAYERS) {
    const layer = createViewportStarLayer(starTexture, config);
    starLayers.push(layer);
    root.add(layer.group);
  }

  const milkyWay = createMilkyWayBand();
  milkyWay.group.rotation.set(0, 0, 0);
  milkyWay.group.matrixAutoUpdate = false;
  camera.add(milkyWay.group);

  const petals = createWebGLPetals(camera);
  let starCount = 0;
  for (const layer of starLayers) {
    const position = layer.geometry.getAttribute('position');
    starCount += position.count;
  }
  renderer.domElement.dataset.starCount = String(starCount);

  const motion = bindSkyMotion(
    { Euler, Matrix4 },
    {
      scene,
      camera,
      holdCamera,
      root,
      milkyGroup: milkyWay.group,
      starLayers,
      renderer,
      setStarTime: elapsed => {
        for (const layer of starLayers) {
          layer.material.uniforms.uTime.value = elapsed;
        }
      },
      setStarPixelRatio: pixelRatio => {
        for (const layer of starLayers) {
          layer.material.uniforms.uPixelRatio.value = pixelRatio;
        }
      },
      setMilkyTime: seconds => {
        milkyWay.material.uniforms.uTime.value = seconds;
      },
    }
  );

  motion.resize();

  return {
    backend: 'webgl',
    resize: motion.resize,
    renderFrame: (dt: number) => {
      const poses = petals.simulation.step(dt);
      applyPetalPoses(petals.views, poses, camera);
      renderer.domElement.dataset.petalCount = String(poses.length);
      motion.renderFrame(dt);
    },
    setPointerTarget: motion.setPointerTarget,
    dispose: () => {
      for (const layer of starLayers) {
        layer.geometry.dispose();
        layer.material.dispose();
      }
      petals.dispose();
      milkyWay.geometry.dispose();
      milkyWay.material.dispose();
      starTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

function createStarMaterial(map: Texture) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: {
        value: capDevicePixelRatio(
          typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
        ),
      },
      map: { value: map },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute vec3 aTwinkle;
      attribute vec4 aWrap;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vColor = aColor;
        float twinkle = 0.82 + aTwinkle.z * sin(uTime * aTwinkle.y + aTwinkle.x);
        vAlpha = clamp(twinkle, 0.45, 1.25);
        // Same drift as wrapClearedStar. mode >= 0.5 skips the Milky Way
        // gap; otherwise X wraps inside the behind-the-band interval.
        float drift = position.z * ${STAR_DRIFT_RATE} * uTime;
        float gapLo = aWrap.y;
        float gapHi = aWrap.z;
        float wrappedX;
        if (aWrap.x >= 0.5) {
          float halfW = aWrap.w;
          float right = halfW - gapHi;
          float safeSpan = max(halfW * 2.0 - (gapHi - gapLo), 0.001);
          float s0 = position.x >= gapHi
            ? position.x - gapHi
            : position.x + halfW * 2.0 - gapHi;
          float s = s0 + drift;
          s = s - safeSpan * floor(s / safeSpan);
          wrappedX = s <= right ? gapHi + s : -halfW + (s - right);
        } else {
          float span = max(gapHi - gapLo, 0.001);
          float shifted = position.x + drift;
          wrappedX = gapLo + (shifted - gapLo) - span * floor((shifted - gapLo) / span);
        }
        // Same curve as milkyDepthFade: out as a near star meets the band,
        // in again on the far side and for the copy placed behind the mesh.
        float gap = gapHi - gapLo;
        float fade = 1.0;
        if (gap > 0.01) {
          float width = max(abs(position.z) * ${STAR_DRIFT_RATE * MILKY_DEPTH_FADE_SECONDS}, 0.001);
          float dist;
          float reach = width;
          if (aWrap.x >= 0.5) {
            if (wrappedX >= gapHi) dist = wrappedX - gapHi;
            else if (wrappedX <= gapLo) dist = gapLo - wrappedX;
            else dist = 0.0;
          } else {
            dist = max(0.0, min(wrappedX - gapLo, gapHi - wrappedX));
            reach = min(width, max(gap * 0.5, 0.001));
          }
          fade = smoothstep(0.0, reach, dist);
        }
        vAlpha *= fade;
        vec3 drifted = vec3(wrappedX, position.y, position.z);
        vec4 mvPosition = modelViewMatrix * vec4(drifted, 1.0);
        gl_PointSize = max(
          aSize * uPixelRatio * (300.0 / max(-mvPosition.z, 80.0)),
          0.9 * uPixelRatio
        );
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      uniform sampler2D map;

      void main() {
        vec4 tex = texture2D(map, gl_PointCoord);
        float alpha = tex.a * vAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(vColor * tex.rgb * 2.0, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

function createViewportStarLayer(map: Texture, config: StarLayerConfig) {
  const { attrs, wraps } = fillClearedStarAttributes(config);

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(attrs.positions, 3)
  );
  geometry.setAttribute('aColor', new Float32BufferAttribute(attrs.colors, 3));
  geometry.setAttribute('aSize', new Float32BufferAttribute(attrs.sizes, 1));
  geometry.setAttribute(
    'aTwinkle',
    new Float32BufferAttribute(attrs.twinkles, 3)
  );
  geometry.setAttribute('aWrap', new Float32BufferAttribute(wraps, 4));

  const material = createStarMaterial(map);
  const points = new Points(geometry, material);
  const group = new Group();
  group.add(points);
  return { geometry, material, group, parallax: config.parallax };
}

function createMilkyWayBand() {
  const geometry = new PlaneGeometry(3200, 780, 1, 1);
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: MILKY_WAY_HOLD_SECONDS },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p *= 2.05;
          amp *= 0.55;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float core = exp(-pow(uv.y * 2.15, 2.0));
        float halo = exp(-pow(uv.y * 0.85, 2.0)) * 0.62;
        float along = 0.5 + 0.5 * fbm(vec2(uv.x * 2.6, uv.y * 4.2 + uTime * 0.012));
        float lanes = smoothstep(0.22, 0.8, fbm(vec2(uv.x * 5.1 + 8.0, uv.y * 1.7)));
        float glow = (core + halo) * along * mix(0.5, 1.0, lanes);
        float edge = smoothstep(1.0, 0.28, abs(uv.x));
        glow *= edge;

        vec3 cool = vec3(0.68, 0.78, 1.0);
        vec3 warm = vec3(1.0, 0.86, 0.7);
        vec3 col = mix(cool, warm, smoothstep(0.3, 0.75, along));
        float alpha = glow * 0.48;
        gl_FragColor = vec4(col * glow * 1.25, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    toneMapped: false,
    side: DoubleSide,
  });

  const mesh = new Mesh(geometry, material);
  const group = new Group();
  group.add(mesh);
  group.rotation.x = Math.PI / 6;
  group.rotation.z = -Math.PI / 6;
  return { group, geometry, material };
}

function createWebGLPetals(camera: PerspectiveCamera) {
  const simulation = createCherryPetalSimulation();
  const texture = new CanvasTexture(createPetalSpriteCanvas());
  texture.colorSpace = NoColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const geometry = new PlaneGeometry(1, 1);
  const materials: ShaderMaterial[] = [];
  const meshes: Mesh[] = [];
  const views: PetalView[] = [];

  for (let i = 0; i < PETAL_POOL; i += 1) {
    const material = createPetalMaterial(texture);
    materials.push(material);
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;
    camera.add(mesh);
    meshes.push(mesh);
    views.push({
      mesh,
      setOpacity: opacity => {
        material.uniforms.uOpacity.value = opacity;
      },
    });
  }

  return {
    simulation,
    views,
    dispose: () => {
      for (const mesh of meshes) {
        camera.remove(mesh);
      }
      geometry.dispose();
      for (const material of materials) {
        material.dispose();
      }
      texture.dispose();
    },
  };
}

function createPetalMaterial(map: Texture) {
  return new ShaderMaterial({
    uniforms: {
      map: { value: map },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D map;
      uniform float uOpacity;
      void main() {
        vec4 tex = texture2D(map, vUv);
        float alpha = tex.a * uOpacity;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(tex.rgb * 2.6, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    toneMapped: false,
    side: DoubleSide,
  });
}
