import type { Node, NodeBuilder, WebGPURenderer } from 'three/webgpu';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  FrontSide,
  LinearSRGBColorSpace,
  NoColorSpace,
  NoToneMapping,
  NodeMaterial,
  NormalBlending,
  SRGBColorSpace,
} from 'three/webgpu';
import type { ShaderNodeObject } from 'three/tsl';
import {
  abs,
  attribute,
  cameraProjectionMatrix,
  clamp,
  dot,
  exp,
  float,
  floor,
  fract,
  Fn,
  max,
  mix,
  modelViewMatrix,
  sin,
  smoothstep,
  texture,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
  viewport,
} from 'three/tsl';
import {
  createStarSpriteCanvas,
  MILKY_WAY_HOLD_SECONDS,
} from '@/lib/night-sky-data';
import { capDevicePixelRatio } from '@/lib/webgl-playback';

type Tsl = ShaderNodeObject<Node>;

/**
 * `Fn` overloads in @types/three treat a one-argument callback as a
 * NodeBuilder. The runtime still takes an input list, which is what the
 * noise helpers need.
 */
function fn(jsFunc: (args: Tsl[]) => Tsl): (...args: Tsl[]) => Tsl {
  const built = Fn(
    jsFunc as unknown as (args: Tsl[], builder: NodeBuilder) => void
  );
  return built as unknown as (...args: Tsl[]) => Tsl;
}

const i1 = () => float(1);
const u1 = uint(1);

/**
 * WebGPU canvases composite with premultiplied alpha. The previous
 * WebGLRenderer used a straight-alpha drawing buffer, whose page blend
 * multiplies RGB by alpha again. SrcAlpha blending of (straight * alpha)
 * stores straight * alpha^2, which matches that page blend.
 */
function straightAlphaAdditive(straightRgb: Tsl, alpha: Tsl) {
  return vec4(straightRgb.mul(alpha) as Tsl, alpha);
}

export function createWebGPUStarMaterial(renderer: WebGPURenderer) {
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  const sprite = new CanvasTexture(createStarSpriteCanvas());
  sprite.colorSpace = NoColorSpace;
  sprite.needsUpdate = true;

  const uTime = uniform(0);
  const uPixelRatio = uniform(
    capDevicePixelRatio(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    )
  );
  const aCenter = attribute('aCenter', 'vec3');
  const aCorner = attribute('aCorner', 'vec2');
  const aColor = attribute('aColor', 'vec3');
  const aSize = attribute('aSize', 'float');
  const aTwinkle = attribute('aTwinkle', 'vec3');

  const vertexNode = Fn(() => {
    const center = modelViewMatrix.mul(vec4(aCenter, i1()));
    const depth = max(center.z.negate(), float(0.001));
    const pointSize = max(
      aSize.mul(uPixelRatio).mul(float(300).div(max(depth, float(80)))),
      uPixelRatio.mul(float(0.9))
    );
    const projY = cameraProjectionMatrix.element(u1).element(u1).abs();
    const onePixel = depth.mul(float(2)).div(projY.mul(max(viewport.w, i1())));
    const offset = aCorner.mul(pointSize).mul(onePixel);
    const mv = center.toVar();
    mv.x.addAssign(offset.x);
    mv.y.addAssign(offset.y);
    return cameraProjectionMatrix.mul(mv);
  })();

  const fragmentNode = Fn(() => {
    const twinkle = float(0.82).add(
      aTwinkle.z.mul(sin(uTime.mul(aTwinkle.y).add(aTwinkle.x)))
    );
    const vAlpha = clamp(twinkle, float(0.45), float(1.25));
    const texel = texture(sprite, aCorner.add(float(0.5)));
    const alpha = texel.a.mul(vAlpha);
    alpha.lessThan(float(0.02)).discard();
    const straight = aColor.mul(texel.rgb).mul(float(2));
    return straightAlphaAdditive(straight, alpha);
  })();

  const material = new NodeMaterial();
  material.vertexNode = vertexNode;
  material.fragmentNode = fragmentNode;
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;
  material.blending = AdditiveBlending;
  material.premultipliedAlpha = false;
  material.toneMapped = false;
  material.fog = false;
  material.side = FrontSide;
  material.forceSinglePass = true;

  return { material, sprite, uTime, uPixelRatio };
}

/**
 * Soft petal. WebGL's straight-alpha page blend multiplies by alpha again,
 * so this writes rgb*alpha and lets SrcAlpha blending multiply once more.
 */
export function createWebGPUPetalMaterial(sprite: CanvasTexture) {
  const uOpacity = uniform(0);
  const fragmentNode = Fn(() => {
    const texel = texture(sprite, uv());
    const alpha = texel.a.mul(uOpacity);
    alpha.lessThan(float(0.02)).discard();
    const tint = texel.rgb.mul(float(1.15));
    return vec4(tint.mul(alpha), alpha);
  })();

  const material = new NodeMaterial();
  material.fragmentNode = fragmentNode;
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;
  material.blending = NormalBlending;
  material.premultipliedAlpha = false;
  material.toneMapped = false;
  material.fog = false;
  material.side = DoubleSide;
  material.forceSinglePass = true;

  return { material, uOpacity };
}

export function createWebGPUMilkyMaterial() {
  const hash2 = fn(([p]) => {
    return fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453123));
  });

  const valueNoise = fn(([p]) => {
    const i = floor(p);
    const f = fract(p);
    const a = hash2(i);
    const b = hash2(i.add(vec2(i1(), float(0))));
    const c = hash2(i.add(vec2(float(0), i1())));
    const d = hash2(i.add(vec2(i1(), i1())));
    const u = f.mul(f).mul(float(3).sub(f.mul(float(2))));
    return mix(a, b, u.x)
      .add(c.sub(a).mul(u.y).mul(i1().sub(u.x)))
      .add(d.sub(b).mul(u.x).mul(u.y));
  });

  const fbm = fn(([pIn]) => {
    const p = vec2(pIn).toVar();
    const value = float(0).toVar();
    let amp = 0.5;
    for (let octave = 0; octave < 5; octave += 1) {
      value.addAssign(valueNoise(p).mul(float(amp)));
      p.mulAssign(float(2.05));
      amp *= 0.55;
    }
    return value;
  });

  const hold = float(MILKY_WAY_HOLD_SECONDS);
  const fragmentNode = Fn(() => {
    const st = uv().mul(float(2)).sub(i1());
    const yCore = st.y.mul(float(2.15));
    const yHalo = st.y.mul(float(0.85));
    const core = exp(yCore.mul(yCore).negate());
    const halo = exp(yHalo.mul(yHalo).negate()).mul(float(0.62));
    const along = fbm(
      vec2(
        st.x.mul(float(2.6)),
        st.y.mul(float(4.2)).add(hold.mul(float(0.012)))
      )
    )
      .mul(float(0.5))
      .add(float(0.5));
    const lanes = smoothstep(
      float(0.22),
      float(0.8),
      fbm(vec2(st.x.mul(float(5.1)).add(float(8)), st.y.mul(float(1.7))))
    );
    const edge = smoothstep(i1(), float(0.28), abs(st.x));
    const glow = core
      .add(halo)
      .mul(along)
      .mul(mix(float(0.5), i1(), lanes))
      .mul(edge);
    const col = mix(
      vec3(0.68, 0.78, 1.0),
      vec3(1.0, 0.86, 0.7),
      smoothstep(float(0.3), float(0.75), along)
    );
    const straight = col.mul(glow).mul(float(1.25));
    const alpha = glow.mul(float(0.48));
    return straightAlphaAdditive(straight, alpha);
  })();

  const material = new NodeMaterial();
  material.fragmentNode = fragmentNode;
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;
  material.blending = AdditiveBlending;
  material.premultipliedAlpha = false;
  material.toneMapped = false;
  material.fog = false;
  material.side = DoubleSide;
  material.forceSinglePass = true;
  return material;
}

export function createWebGPUDnaMaterial(
  particleSize: number,
  particleColor: string
) {
  const color = new Color(particleColor);
  const aCenter = attribute('aCenter', 'vec3');
  const aCorner = attribute('aCorner', 'vec2');

  const vertexNode = Fn(() => {
    const center = modelViewMatrix.mul(vec4(aCenter, i1()));
    const depth = max(center.z.negate(), float(0.001));
    const pointSize = float(particleSize)
      .mul(viewport.w)
      .mul(float(0.5))
      .div(depth);
    const projY = cameraProjectionMatrix.element(u1).element(u1).abs();
    const onePixel = depth.mul(float(2)).div(projY.mul(max(viewport.w, i1())));
    const offset = aCorner.mul(pointSize).mul(onePixel);
    const mv = center.toVar();
    mv.x.addAssign(offset.x);
    mv.y.addAssign(offset.y);
    return cameraProjectionMatrix.mul(mv);
  })();

  const material = new NodeMaterial();
  material.vertexNode = vertexNode;
  material.fragmentNode = vec4(color.r, color.g, color.b, 1);
  material.transparent = false;
  material.depthWrite = false;
  material.depthTest = false;
  material.blending = NormalBlending;
  material.premultipliedAlpha = false;
  material.toneMapped = false;
  material.fog = false;
  material.side = FrontSide;
  return { material, outputColorSpace: SRGBColorSpace };
}
