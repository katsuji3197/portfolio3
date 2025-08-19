'use client';

import { useEffect, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Vector3,
  Scene,
  WebGLRenderer,
} from 'three';

type DNAHelixProps = {
  className?: string;
  style?: React.CSSProperties;
  radius?: number; // らせん半径
  height?: number; // 全高（y方向）
  turns?: number; // 巻き数
  segmentsPerTurn?: number; // 1回転あたりの分割数
  baseEvery?: number; // 何セグメントごとに塩基（横棒）を描画するか
  rotationSpeed?: number; // 回転速度(rad/sec)
  particleSize?: number; // 粒子サイズ（px）
  particleColor?: string; // 粒子色
  baseSegmentsPerPair?: number; // 各塩基対を粒子で分割表示する数
  tiltDeg?: number; // 右傾き（度）
};

export default function DNAHelix({
  className,
  style,
  radius = 3.2,
  height = 1600,
  turns = 100,
  segmentsPerTurn = 90,
  baseEvery = 32,
  rotationSpeed = -0.6,
  particleSize = 0.25,
  particleColor = '#aeaeff',
  baseSegmentsPerPair = 0,
  tiltDeg = -100,
}: DNAHelixProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new Scene();
    scene.background = null;

    const camera = new PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.set(0, 0, 34);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);

    const setRendererSize = () => {
      const width = container.clientWidth || window.innerWidth;
      const heightPx = container.clientHeight || window.innerHeight;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    setRendererSize();
    container.appendChild(renderer.domElement);

    // 初期は透明にしておき、読み込み時に3秒かけてフェードインさせる
    // CSS トランジションで実装（canvas 要素の style を直接操作）
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 3s ease';
    requestAnimationFrame(() => {
      // reflow を強制してから opacity を 1 にする
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      void (renderer.domElement as HTMLCanvasElement).offsetWidth;
      renderer.domElement.style.opacity = '1';
    });

    // 二重らせんを構築
    const root = new Group();
    const content = new Group();
    root.add(content);
    scene.add(root);

    const totalSegments = Math.max(4, Math.floor(turns * segmentsPerTurn));
    const totalAngle = turns * Math.PI * 2; // 0..2π*turns

    // yを- height/2 .. + height/2 に割り当て
    const yStart = -height / 2;
    const yStep = height / totalSegments;

    // 全粒子座標をまとめて生成
    const helixPointsCount = (totalSegments + 1) * 2; // A/Bバックボーン
    const pairCount = Math.floor(totalSegments / Math.max(1, baseEvery));
    const baseDotsPerPair = Math.max(1, Math.floor(baseSegmentsPerPair));
    const pairDotsCount = pairCount * (baseDotsPerPair + 1);
    const totalDots = helixPointsCount + pairDotsCount;

    const positions = new Float32Array(totalDots * 3);
    let ptr = 0;

    const getBackbonePos = (i: number) => {
      const t = (i / totalSegments) * totalAngle;
      const y = yStart + i * yStep;
      const ax = radius * Math.cos(t);
      const az = radius * Math.sin(t);
      const bx = radius * Math.cos(t + Math.PI);
      const bz = radius * Math.sin(t + Math.PI);
      return { y, ax, az, bx, bz };
    };

    // バックボーンA/B
    for (let i = 0; i <= totalSegments; i += 1) {
      const { y, ax, az, bx, bz } = getBackbonePos(i);
      positions[ptr++] = ax; // A
      positions[ptr++] = y;
      positions[ptr++] = az;
      positions[ptr++] = bx; // B
      positions[ptr++] = y;
      positions[ptr++] = bz;
    }

    // 塩基対を粒子で（A→Bを分割）
    for (let i = 0; i < totalSegments; i += baseEvery) {
      const { y, ax, az, bx, bz } = getBackbonePos(i);
      for (let s = 0; s <= baseDotsPerPair; s += 1) {
        const t = s / (baseDotsPerPair || 1);
        positions[ptr++] = ax + (bx - ax) * t;
        positions[ptr++] = y;
        positions[ptr++] = az + (bz - az) * t;
      }
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: new Color(particleColor),
      size: particleSize,
      sizeAttenuation: true,
    });
    const dots = new Points(geom, material);
    content.add(dots);

    // 初期傾き（右に傾ける）: コンテンツ自体を傾ける
    content.rotation.z = -(tiltDeg * Math.PI) / 180;

    // アニメーション
    const t0 = performance.now();
    let last = t0;
    const localYAxis = new Vector3(0, 1, 0);
    const animate = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;

      // らせんの中心軸（傾け後のローカルY）で回転
      content.rotateOnAxis(localYAxis, rotationSpeed * dt);

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animationFrameIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => setRendererSize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current !== null)
        cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      geom.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    radius,
    height,
    turns,
    segmentsPerTurn,
    baseEvery,
    rotationSpeed,
    particleSize,
    particleColor,
    baseSegmentsPerPair,
    tiltDeg,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
