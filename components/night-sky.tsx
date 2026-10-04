'use client';

import { useEffect, useRef } from 'react';
import { capDevicePixelRatio, startWebGLPlayback } from '@/lib/webgl-playback';

const MAX_PIXEL_RATIO = 2;
const CAMERA_Z = 600;
const CAMERA_FOV = 70;
/** Mesh pattern at 4:00. Shader flow is uTime * 0.012 → 2.88. */
const MILKY_WAY_HOLD_SECONDS = 4 * 60;

type StarLayerConfig = {
  count: number;
  planeZ: number;
  thickness: number;
  sizeMin: number;
  sizeMax: number;
  brightnessMin: number;
  brightnessMax: number;
  twinkleAmp: number;
  parallax: number;
};

const STAR_LAYERS: StarLayerConfig[] = [
  {
    count: 3470,
    planeZ: -280,
    thickness: 220,
    sizeMin: 3.1,
    sizeMax: 4.6,
    brightnessMin: 0.22,
    brightnessMax: 0.4,
    twinkleAmp: 0.06,
    parallax: 4,
  },
  {
    count: 2000,
    planeZ: 80,
    thickness: 180,
    sizeMin: 3.4,
    sizeMax: 5.3,
    brightnessMin: 0.28,
    brightnessMax: 0.48,
    twinkleAmp: 0.08,
    parallax: 9,
  },
  {
    count: 800,
    planeZ: 320,
    thickness: 120,
    sizeMin: 3.7,
    sizeMax: 6.1,
    brightnessMin: 0.34,
    brightnessMax: 0.56,
    twinkleAmp: 0.1,
    parallax: 16,
  },
  {
    count: 67,
    planeZ: 460,
    thickness: 50,
    sizeMin: 5,
    sizeMax: 7.8,
    brightnessMin: 0.58,
    brightnessMax: 0.9,
    twinkleAmp: 0.04,
    parallax: 24,
  },
];

/**
 * Naked-eye spectral-class counts from the Yale Bright Star Catalogue,
 * 5th Revised Ed. (Hoffleit & Warren 1991; CDS VizieR V/50). The
 * catalogue lists 9110 entries complete to about V = 6.5. Class totals
 * are the tabulated MK letters in the VizieR-derived BSC5 table
 * (juliensimon/bright-star-catalog): O 51, B 1757, A 1963, F 1287,
 * G 1145, K 2065, M 506 (8774 classified; the rest lack an O–M class).
 * RGB is a desaturated naked-eye mapping of each class, not a new mix:
 * O/B pale blue-white, A white, F cream, G pale yellow, K pale orange,
 * M muted orange-red. Sampling uses the raw counts, not invented %.
 */
const BSC5_SPECTRAL_CLASSES = [
  { count: 51, r: 0.84, g: 0.89, b: 1.0 },
  { count: 1757, r: 0.88, g: 0.92, b: 1.0 },
  { count: 1963, r: 0.96, g: 0.97, b: 1.0 },
  { count: 1287, r: 1.0, g: 0.98, b: 0.92 },
  { count: 1145, r: 1.0, g: 0.95, b: 0.82 },
  { count: 2065, r: 1.0, g: 0.86, b: 0.7 },
  { count: 506, r: 1.0, g: 0.72, b: 0.58 },
] as const;

const BSC5_CLASSIFIED_TOTAL = BSC5_SPECTRAL_CLASSES.reduce(
  (sum, cls) => sum + cls.count,
  0
);

export default function NightSky() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    let stopPlayback: (() => void) | null = null;
    let onResize: (() => void) | null = null;
    let onPointerMove: ((event: PointerEvent) => void) | null = null;
    let onPointerLeave: (() => void) | null = null;
    let renderer: import('three').WebGLRenderer | null = null;
    let milkyGeometry: import('three').BufferGeometry | null = null;
    let milkyMaterial: import('three').ShaderMaterial | null = null;
    let starTexture: import('three').Texture | null = null;
    const starLayers: {
      geometry: import('three').BufferGeometry;
      material: import('three').ShaderMaterial;
      group: import('three').Group;
      parallax: number;
    }[] = [];

    const setup = async () => {
      const THREE = await import('three');
      if (disposed || !containerRef.current) {
        return;
      }

      const {
        Scene,
        PerspectiveCamera,
        WebGLRenderer,
        BufferGeometry,
        Float32BufferAttribute,
        Points,
        ShaderMaterial,
        Color,
        Group,
        AdditiveBlending,
        Texture,
        PlaneGeometry,
        Mesh,
        Euler,
        Matrix4,
      } = THREE;

      const scene = new Scene();
      scene.background = null;

      const camera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 4000);
      camera.position.z = CAMERA_Z;
      scene.add(camera);
      const holdCamera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 4000);

      renderer = new WebGLRenderer({
        antialias: false,
        alpha: true,
        depth: true,
        stencil: false,
        premultipliedAlpha: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const setRendererSize = () => {
        if (!renderer) {
          return;
        }
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        holdCamera.aspect = width / height;
        holdCamera.updateProjectionMatrix();
        renderer.setPixelRatio(
          capDevicePixelRatio(window.devicePixelRatio || 1)
        );
        renderer.setSize(width, height, false);
        const pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          MAX_PIXEL_RATIO
        );
        for (const layer of starLayers) {
          layer.material.uniforms.uPixelRatio.value = pixelRatio;
        }
      };

      setRendererSize();
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.inset = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      container.appendChild(renderer.domElement);

      starTexture = createSoftStarTexture(Texture);
      const root = new Group();
      scene.add(root);

      const sharedDeps = {
        BufferGeometry,
        Float32BufferAttribute,
        Points,
        ShaderMaterial,
        Color,
        AdditiveBlending,
        Group,
      };

      for (const config of STAR_LAYERS) {
        const layer = createViewportStarLayer(sharedDeps, starTexture, config);
        starLayers.push(layer);
        root.add(layer.group);
      }

      const milkyWay = createMilkyWayBand({
        PlaneGeometry,
        ShaderMaterial,
        Mesh,
        AdditiveBlending,
        Group,
        DoubleSide: THREE.DoubleSide,
      });
      milkyGeometry = milkyWay.geometry;
      milkyMaterial = milkyWay.material;
      milkyWay.group.rotation.set(0, 0, 0);
      milkyWay.group.matrixAutoUpdate = false;
      camera.add(milkyWay.group);

      const holdRootEuler = new Euler();
      const meshLocalEuler = new Euler(Math.PI / 6, 0, -Math.PI / 6);
      const holdRootMatrix = new Matrix4();
      const meshLocalMatrix = new Matrix4();
      const holdMeshWorld = new Matrix4();
      const meshInHoldCam = new Matrix4();

      setRendererSize();

      let elapsed = 0;
      let pointerTargetX = 0;
      let pointerTargetY = 0;
      let pointerX = 0;
      let pointerY = 0;
      const pointerEase = 3.2;
      const yawRange = 0.055;
      const pitchRange = 0.035;
      const panX = 16;
      const panY = 10;

      onPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') {
          return;
        }
        const width = window.innerWidth || 1;
        const height = window.innerHeight || 1;
        pointerTargetX = (event.clientX / width) * 2 - 1;
        pointerTargetY = -((event.clientY / height) * 2 - 1);
      };
      onPointerLeave = () => {
        pointerTargetX = 0;
        pointerTargetY = 0;
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onPointerLeave);

      const renderFrame = (dt: number) => {
        if (!renderer || !milkyMaterial) {
          return;
        }

        elapsed += dt;
        const follow = 1 - Math.exp(-pointerEase * dt);
        pointerX += (pointerTargetX - pointerX) * follow;
        pointerY += (pointerTargetY - pointerY) * follow;

        root.rotation.y = elapsed * 0.008 + pointerX * yawRange;
        root.rotation.x =
          Math.sin(elapsed * 0.05) * 0.04 - pointerY * pitchRange;
        camera.position.x = Math.sin(elapsed * 0.12) * 8 + pointerX * panX;
        camera.position.y = Math.cos(elapsed * 0.1) * 5 + pointerY * panY;
        camera.lookAt(pointerX * 6, pointerY * 4, 0);

        holdRootEuler.set(
          Math.sin(MILKY_WAY_HOLD_SECONDS * 0.05) * 0.04 -
            pointerY * pitchRange,
          MILKY_WAY_HOLD_SECONDS * 0.008 + pointerX * yawRange,
          0
        );
        holdRootMatrix.makeRotationFromEuler(holdRootEuler);
        meshLocalMatrix.makeRotationFromEuler(meshLocalEuler);
        holdMeshWorld.multiplyMatrices(holdRootMatrix, meshLocalMatrix);
        holdCamera.position.set(
          Math.sin(MILKY_WAY_HOLD_SECONDS * 0.12) * 8 + pointerX * panX,
          Math.cos(MILKY_WAY_HOLD_SECONDS * 0.1) * 5 + pointerY * panY,
          CAMERA_Z
        );
        holdCamera.lookAt(pointerX * 6, pointerY * 4, 0);
        holdCamera.updateMatrixWorld();
        meshInHoldCam
          .copy(holdCamera.matrixWorld)
          .invert()
          .multiply(holdMeshWorld);
        milkyWay.group.matrix.copy(meshInHoldCam);

        for (const layer of starLayers) {
          layer.group.position.x = pointerX * layer.parallax;
          layer.group.position.y = pointerY * layer.parallax;
          layer.material.uniforms.uTime.value = elapsed;
        }
        milkyMaterial.uniforms.uTime.value = MILKY_WAY_HOLD_SECONDS;
        renderer.render(scene, camera);
      };

      renderFrame(0);

      stopPlayback = startWebGLPlayback(container, (_now, dt) => {
        renderFrame(dt);
      });

      onResize = setRendererSize;
      window.addEventListener('resize', onResize);
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
      for (const layer of starLayers) {
        layer.geometry.dispose();
        layer.material.dispose();
      }
      milkyGeometry?.dispose();
      milkyMaterial?.dispose();
      starTexture?.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
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

function createSoftStarTexture(
  TextureCtor: typeof import('three').Texture
): import('three').Texture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new TextureCtor(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createStarMaterial(
  ShaderMaterial: typeof import('three').ShaderMaterial,
  AdditiveBlending: typeof import('three').AdditiveBlending,
  map: import('three').Texture
) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: {
        value: Math.min(
          typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
          MAX_PIXEL_RATIO
        ),
      },
      map: { value: map },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute vec3 aTwinkle;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vColor = aColor;
        float twinkle = 0.82 + aTwinkle.z * sin(uTime * aTwinkle.y + aTwinkle.x);
        vAlpha = clamp(twinkle, 0.45, 1.25);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
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

function fillStarAttributes(
  ColorCtor: typeof import('three').Color,
  count: number,
  place: (index: number) => { x: number; y: number; z: number },
  sizeMin: number,
  sizeMax: number,
  brightnessMin: number,
  brightnessMax: number,
  twinkleAmp: number
) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkles = new Float32Array(count * 3);
  const color = new ColorCtor();

  for (let i = 0; i < count; i += 1) {
    const pos = place(i);
    const idx = i * 3;
    positions[idx] = pos.x;
    positions[idx + 1] = pos.y;
    positions[idx + 2] = pos.z;

    pickStarColor(color);
    const rank = Math.pow(Math.random(), 2.1);
    const brightness = brightnessMin + rank * (brightnessMax - brightnessMin);
    colors[idx] = color.r * brightness;
    colors[idx + 1] = color.g * brightness;
    colors[idx + 2] = color.b * brightness;
    sizes[i] = sizeMin + rank * (sizeMax - sizeMin);
    twinkles[idx] = Math.random() * Math.PI * 2;
    twinkles[idx + 1] = 0.2 + Math.random() * 0.75;
    twinkles[idx + 2] = twinkleAmp * (0.65 + (1 - rank) * 0.7);
  }

  return { positions, colors, sizes, twinkles };
}

function createViewportStarLayer(
  deps: {
    BufferGeometry: typeof import('three').BufferGeometry;
    Float32BufferAttribute: typeof import('three').Float32BufferAttribute;
    Points: typeof import('three').Points;
    ShaderMaterial: typeof import('three').ShaderMaterial;
    Color: typeof import('three').Color;
    AdditiveBlending: typeof import('three').AdditiveBlending;
    Group: typeof import('three').Group;
  },
  map: import('three').Texture,
  config: StarLayerConfig
) {
  const attrs = fillStarAttributes(
    deps.Color,
    config.count,
    () => randomViewportPosition(config.planeZ, config.thickness),
    config.sizeMin,
    config.sizeMax,
    config.brightnessMin,
    config.brightnessMax,
    config.twinkleAmp
  );

  const geometry = new deps.BufferGeometry();
  geometry.setAttribute(
    'position',
    new deps.Float32BufferAttribute(attrs.positions, 3)
  );
  geometry.setAttribute(
    'aColor',
    new deps.Float32BufferAttribute(attrs.colors, 3)
  );
  geometry.setAttribute(
    'aSize',
    new deps.Float32BufferAttribute(attrs.sizes, 1)
  );
  geometry.setAttribute(
    'aTwinkle',
    new deps.Float32BufferAttribute(attrs.twinkles, 3)
  );

  const material = createStarMaterial(
    deps.ShaderMaterial,
    deps.AdditiveBlending,
    map
  );
  const points = new deps.Points(geometry, material);
  const group = new deps.Group();
  group.add(points);
  return { geometry, material, group, parallax: config.parallax };
}

function createMilkyWayBand(deps: {
  PlaneGeometry: typeof import('three').PlaneGeometry;
  ShaderMaterial: typeof import('three').ShaderMaterial;
  Mesh: typeof import('three').Mesh;
  AdditiveBlending: typeof import('three').AdditiveBlending;
  Group: typeof import('three').Group;
  DoubleSide: import('three').Side;
}) {
  const geometry = new deps.PlaneGeometry(3200, 780, 1, 1);
  const material = new deps.ShaderMaterial({
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
    blending: deps.AdditiveBlending,
    toneMapped: false,
    side: deps.DoubleSide,
  });

  const mesh = new deps.Mesh(geometry, material);
  const group = new deps.Group();
  group.add(mesh);
  group.rotation.x = Math.PI / 6;
  group.rotation.z = -Math.PI / 6;
  return { group, geometry, material };
}

function randomViewportPosition(planeZ: number, thickness: number) {
  const dist = Math.max(CAMERA_Z - planeZ, 80);
  const halfHeight =
    Math.tan(((CAMERA_FOV * Math.PI) / 180) * 0.5) * dist * 1.2;
  const halfWidth = halfHeight * 1.85;
  return {
    x: (Math.random() * 2 - 1) * halfWidth,
    y: (Math.random() * 2 - 1) * halfHeight,
    z: planeZ + (Math.random() - 0.5) * thickness,
  };
}

function pickStarColor(color: import('three').Color) {
  const roll = Math.random() * BSC5_CLASSIFIED_TOTAL;
  let acc = 0;
  for (const cls of BSC5_SPECTRAL_CLASSES) {
    acc += cls.count;
    if (roll < acc) {
      const jitter = (Math.random() - 0.5) * 0.035;
      color.setRGB(
        clamp01(cls.r + jitter),
        clamp01(cls.g + jitter * 0.6),
        clamp01(cls.b + jitter * 0.4)
      );
      return;
    }
  }
  const last = BSC5_SPECTRAL_CLASSES[BSC5_SPECTRAL_CLASSES.length - 1];
  color.setRGB(last.r, last.g, last.b);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
