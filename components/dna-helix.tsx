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
  Quaternion,
  Vector3,
  Scene,
  WebGLRenderer,
} from 'three';
import { capDevicePixelRatio, startWebGLPlayback } from '@/lib/webgl-playback';

type DNAHelixProps = {
  className?: string;
  style?: React.CSSProperties;
  radius?: number;
  height?: number;
  turns?: number;
  segmentsPerTurn?: number;
  baseEvery?: number;
  rotationSpeed?: number;
  particleSize?: number;
  particleColor?: string;
  baseSegmentsPerPair?: number;
  /** 画面座標 (0–1, 左上が 0,0)。らせんが見える始点。 */
  startViewport?: { x: number; y: number };
  /** 画面座標 (0–1)。らせんが見える終点。 */
  endViewport?: { x: number; y: number };
};

const DEFAULT_START = { x: 0.02, y: 0.88 };
const DEFAULT_END = { x: 0.9, y: 0.58 };

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
  startViewport = DEFAULT_START,
  endViewport = DEFAULT_END,
}: DNAHelixProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 3s ease';
    requestAnimationFrame(() => {
      void (renderer.domElement as HTMLCanvasElement).offsetWidth;
      renderer.domElement.style.opacity = '1';
    });

    const root = new Group();
    const content = new Group();
    root.add(content);
    scene.add(root);

    const totalSegments = Math.max(4, Math.floor(turns * segmentsPerTurn));
    const totalAngle = turns * Math.PI * 2;
    const yStart = -height / 2;
    const yStep = height / totalSegments;

    const helixPointsCount = (totalSegments + 1) * 2;
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

    for (let i = 0; i <= totalSegments; i += 1) {
      const { y, ax, az, bx, bz } = getBackbonePos(i);
      positions[ptr++] = ax;
      positions[ptr++] = y;
      positions[ptr++] = az;
      positions[ptr++] = bx;
      positions[ptr++] = y;
      positions[ptr++] = bz;
    }

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

    const localYAxis = new Vector3(0, 1, 0);
    const startWorld = new Vector3();
    const endWorld = new Vector3();
    const axisDir = new Vector3();
    const midpoint = new Vector3();
    const alignQuat = new Quaternion();

    // 元と同じカメラ距離（z=0 平面）で、画面上の2点を結ぶ対角に軸を置く。
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

    const frameToViewport = () => {
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

    frameToViewport();

    const renderFrame = (dt: number) => {
      content.rotateOnAxis(localYAxis, rotationSpeed * dt);
      renderer.render(scene, camera);
    };
    renderFrame(0);
    const stopPlayback = startWebGLPlayback(container, (_now, dt) => {
      renderFrame(dt);
    });

    const handleResize = () => {
      setRendererSize();
      frameToViewport();
      renderFrame(0);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      stopPlayback();
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
    startViewport.x,
    startViewport.y,
    endViewport.x,
    endViewport.y,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
