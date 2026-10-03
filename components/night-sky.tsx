'use client';

import { useEffect, useRef } from 'react';
import { capDevicePixelRatio, startWebGLPlayback } from '@/lib/webgl-playback';

const FIELD_STAR_COUNT = 5200;
const BAND_STAR_COUNT = 2200;
const BRIGHT_STAR_COUNT = 70;
const MAX_PIXEL_RATIO = 2;

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
    let starGeometry: import('three').BufferGeometry | null = null;
    let starMaterial: import('three').ShaderMaterial | null = null;
    let milkyGeometry: import('three').BufferGeometry | null = null;
    let milkyMaterial: import('three').ShaderMaterial | null = null;
    let starTexture: import('three').Texture | null = null;

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
      } = THREE;

      const scene = new Scene();
      scene.background = null;

      const camera = new PerspectiveCamera(70, 1, 1, 4000);
      camera.position.z = 600;

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
        renderer.setPixelRatio(
          capDevicePixelRatio(window.devicePixelRatio || 1)
        );
        renderer.setSize(width, height, false);
        if (starMaterial) {
          starMaterial.uniforms.uPixelRatio.value = Math.min(
            window.devicePixelRatio || 1,
            MAX_PIXEL_RATIO
          );
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

      const starField = createStarField(
        {
          BufferGeometry,
          Float32BufferAttribute,
          Points,
          ShaderMaterial,
          Color,
          AdditiveBlending,
        },
        starTexture
      );
      starGeometry = starField.geometry;
      starMaterial = starField.material;
      root.add(starField.points);

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
      root.add(milkyWay.group);

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
        if (!renderer || !starMaterial || !milkyMaterial) {
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

        starMaterial.uniforms.uTime.value = elapsed;
        milkyMaterial.uniforms.uTime.value = elapsed;
        renderer.render(scene, camera);
      };

      // タブ非表示などでループが始まらなくても、星空の1枚は出しておく
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
      starGeometry?.dispose();
      starMaterial?.dispose();
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
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-80"
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

function createStarField(
  deps: {
    BufferGeometry: typeof import('three').BufferGeometry;
    Float32BufferAttribute: typeof import('three').Float32BufferAttribute;
    Points: typeof import('three').Points;
    ShaderMaterial: typeof import('three').ShaderMaterial;
    Color: typeof import('three').Color;
    AdditiveBlending: typeof import('three').AdditiveBlending;
  },
  map: import('three').Texture
) {
  const total = FIELD_STAR_COUNT + BAND_STAR_COUNT + BRIGHT_STAR_COUNT;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const sizes = new Float32Array(total);
  const twinkles = new Float32Array(total * 3);
  const color = new deps.Color();

  for (let i = 0; i < total; i += 1) {
    const isBright = i >= FIELD_STAR_COUNT + BAND_STAR_COUNT;
    const inBand = !isBright && i >= FIELD_STAR_COUNT;
    const pos = inBand ? randomBandPosition() : randomFieldPosition(isBright);
    const idx = i * 3;
    positions[idx] = pos.x;
    positions[idx + 1] = pos.y;
    positions[idx + 2] = pos.z;

    pickStarColor(color, inBand);
    const magnitude = isBright
      ? 0.78 + Math.random() * 0.22
      : inBand
        ? Math.pow(Math.random(), 1.8) * 0.7
        : Math.pow(Math.random(), 2.4);
    const brightness = isBright
      ? 1.35 + magnitude * 0.5
      : 0.9 + magnitude * 1.15;
    colors[idx] = color.r * brightness;
    colors[idx + 1] = color.g * brightness;
    colors[idx + 2] = color.b * brightness;

    sizes[i] = isBright
      ? 9.5 + magnitude * 7
      : inBand
        ? 3.6 + magnitude * 4.4
        : 5.2 + magnitude * 8.8;
    twinkles[idx] = Math.random() * Math.PI * 2;
    twinkles[idx + 1] = 0.22 + Math.random() * 0.7;
    twinkles[idx + 2] = isBright
      ? 0.06 + Math.random() * 0.08
      : 0.14 + (1 - magnitude) * 0.22;
  }

  const geometry = new deps.BufferGeometry();
  geometry.setAttribute(
    'position',
    new deps.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('aColor', new deps.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new deps.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute(
    'aTwinkle',
    new deps.Float32BufferAttribute(twinkles, 3)
  );

  const material = new deps.ShaderMaterial({
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
        gl_PointSize = aSize * uPixelRatio * (300.0 / max(-mvPosition.z, 1.0));
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
    blending: deps.AdditiveBlending,
    toneMapped: false,
  });

  return {
    points: new deps.Points(geometry, material),
    geometry,
    material,
  };
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
      uTime: { value: 0 },
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

function randomFieldPosition(closer = false) {
  const radius = closer ? 620 + Math.random() * 420 : 880 + Math.random() * 900;
  const theta = Math.acos(2 * Math.random() - 1);
  const phi = Math.random() * Math.PI * 2;
  return {
    x: radius * Math.sin(theta) * Math.cos(phi),
    y: radius * Math.sin(theta) * Math.sin(phi),
    z: radius * Math.cos(theta),
  };
}

function randomBandPosition() {
  const x = (Math.random() - 0.5) * 2400;
  const u = Math.random() * Math.PI * 2;
  const r = Math.pow(Math.random(), 0.62);
  const y = r * Math.cos(u) * 95;
  const z = r * Math.sin(u) * 210;
  return rotateBandPoint(x, y, z);
}

function rotateBandPoint(x: number, y: number, z: number) {
  const rx = Math.PI / 6;
  const rz = -Math.PI / 6;
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  return {
    x: x * Math.cos(rz) - y1 * Math.sin(rz),
    y: x * Math.sin(rz) + y1 * Math.cos(rz),
    z: z1,
  };
}

function pickStarColor(color: import('three').Color, inBand: boolean) {
  const roll = Math.random();
  if (inBand) {
    if (roll < 0.62) {
      color.setHSL(
        0.62,
        0.08 + Math.random() * 0.1,
        0.88 + Math.random() * 0.08
      );
      return;
    }
    if (roll < 0.84) {
      color.setHSL(
        0.63,
        0.32 + Math.random() * 0.22,
        0.76 + Math.random() * 0.12
      );
      return;
    }
    color.setHSL(0.08, 0.28 + Math.random() * 0.2, 0.78 + Math.random() * 0.1);
    return;
  }

  if (roll < 0.5) {
    color.setHSL(0.62, 0.04 + Math.random() * 0.08, 0.9 + Math.random() * 0.08);
    return;
  }
  if (roll < 0.8) {
    color.setHSL(
      0.62,
      0.34 + Math.random() * 0.28,
      0.76 + Math.random() * 0.14
    );
    return;
  }
  color.setHSL(0.08, 0.32 + Math.random() * 0.28, 0.76 + Math.random() * 0.12);
}
