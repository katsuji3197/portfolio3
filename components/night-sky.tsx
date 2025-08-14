"use client";

import { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Color,
  FogExp2,
  Group,
  AdditiveBlending,
  Line,
  LineBasicMaterial,
  Vector3,
} from "three";

export default function NightSky() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new Scene();
    scene.background = null;
    scene.fog = new FogExp2(new Color("#0a0f1f"), 0.0004);

    const camera = new PerspectiveCamera(70, 1, 1, 5000);
    camera.position.z = 600;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    const setRendererSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    setRendererSize();
    renderer.setClearColor(0x000000, 0); // 透明
    container.appendChild(renderer.domElement);

    const root = new Group();
    scene.add(root);

    // 星の生成
    const createStars = (
      count: number,
      color: string,
      size: number,
      spread: number
    ) => {
      const geometry = new BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        // 球殻状に分布させる
        const radius = spread * (0.6 + Math.random() * 0.4);
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = 2 * Math.PI * Math.random();
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(theta);
        const idx = i * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;

        // 色を確率で決定: 10% 赤, 10% 青, それ以外はデフォルト色
        let chosen = new Color(color);
        const r = Math.random();
        if (r < 0.05) {
          chosen = new Color("#ff7f50");
        } else if (r < 0.1) {
          chosen = new Color("#6495ed");
        }
        colors[idx] = chosen.r;
        colors[idx + 1] = chosen.g;
        colors[idx + 2] = chosen.b;
      }
      geometry.setAttribute(
        "position",
        new Float32BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

      const material = new PointsMaterial({
        color: new Color(color),
        size,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
        vertexColors: true,
      });

      const points = new Points(geometry, material);
      return { points, geometry, material };
    };

    const layer1 = createStars(6000, "#eaf2ff", 1.8, 1100);
    const layer2 = createStars(3600, "#d9e6ff", 2.2, 1400);
    const layer3 = createStars(2600, "#ffffff", 2.8, 1700);
    root.add(layer1.points);
    root.add(layer2.points);
    root.add(layer3.points);

    // 流れ星（Shooting Stars）
    type ShootingStar = {
      group: Group;
      head: Points;
      headMaterial: PointsMaterial;
      tail: Line;
      tailMaterial: LineBasicMaterial;
      tailPositions: Vector3[];
      velocity: Vector3;
      age: number;
      life: number;
      active: boolean;
    };

    const maxShootingStars = 64;
    const tailSegments = 1024;
    const shootingStars: ShootingStar[] = [];

    const makeShootingStar = (): ShootingStar => {
      // head
      const headGeometry = new BufferGeometry();
      headGeometry.setAttribute(
        "position",
        new Float32BufferAttribute(new Float32Array([0, 0, 0]), 3)
      );
      const headMaterial = new PointsMaterial({
        color: new Color("#ffffff"),
        size: 3,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
      });
      const head = new Points(headGeometry, headMaterial);

      // tail
      const tailGeometry = new BufferGeometry();
      // 初期は全て同一点
      const initialTail = new Float32Array(tailSegments * 3).fill(0);
      tailGeometry.setAttribute(
        "position",
        new Float32BufferAttribute(initialTail, 3)
      );
      // 頂点カラー（減衰）でモーションブラー風の残像を表現
      const initialColors = new Float32Array(tailSegments * 3);
      for (let i = 0; i < tailSegments; i += 1) {
        const attenuation = Math.pow(0.85, i);
        const idx = i * 3;
        initialColors[idx] = attenuation;
        initialColors[idx + 1] = attenuation;
        initialColors[idx + 2] = attenuation;
      }
      tailGeometry.setAttribute(
        "color",
        new Float32BufferAttribute(initialColors, 3)
      );
      const tailMaterial = new LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.0,
        blending: AdditiveBlending,
        vertexColors: true,
      });
      const tail = new Line(tailGeometry, tailMaterial);

      const group = new Group();
      group.add(tail);
      group.add(head);

      return {
        group,
        head,
        headMaterial,
        tail,
        tailMaterial,
        tailPositions: Array.from(
          { length: tailSegments },
          () => new Vector3(0, 0, 0)
        ),
        velocity: new Vector3(0, 0, 0),
        age: 0,
        life: 8,
        active: false,
      };
    };

    const activateShootingStar = (star: ShootingStar) => {
      // 画面右上付近から左下方向へ
      const startX = 900 + Math.random() * 400;
      const startY = 500 + Math.random() * 400;
      const startZ = -100 + Math.random() * 200;
      star.group.position.set(startX, startY, startZ);
      star.velocity.set(
        -600 - Math.random() * 400,
        -400 - Math.random() * 300,
        0
      );
      star.age = 0;
      star.life = 1.6 + Math.random() * 0.8;
      star.active = true;
      star.headMaterial.opacity = 0.9;
      star.tailMaterial.opacity = 0.7;
      // テール初期化（現在位置に沿って並べる）
      star.tailPositions = Array.from(
        { length: tailSegments },
        (_, i) =>
          new Vector3(
            -i * star.velocity.x * 0.01,
            -i * star.velocity.y * 0.01,
            0
          )
      );
      updateTailGeometry(star, 1.0);
      if ((root as Group).children.indexOf(star.group) === -1) {
        root.add(star.group);
      }
    };

    const deactivateShootingStar = (star: ShootingStar) => {
      star.active = false;
      star.headMaterial.opacity = 0.0;
      star.tailMaterial.opacity = 0.0;
      if ((root as Group).children.indexOf(star.group) !== -1) {
        root.remove(star.group);
      }
    };

    const updateTailGeometry = (star: ShootingStar, fade: number) => {
      const positionAttr = (star.tail.geometry as BufferGeometry).getAttribute(
        "position"
      ) as Float32BufferAttribute;
      const colorAttr = (star.tail.geometry as BufferGeometry).getAttribute(
        "color"
      ) as Float32BufferAttribute;
      for (let i = 0; i < tailSegments; i += 1) {
        const p = star.tailPositions[i];
        positionAttr.setXYZ(i, p.x, p.y, p.z);
        const attenuation = fade * Math.pow(0.85, i);
        colorAttr.setXYZ(i, attenuation, attenuation, attenuation);
      }
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    };

    // プールを準備
    for (let i = 0; i < maxShootingStars; i += 1) {
      shootingStars.push(makeShootingStar());
    }

    // アニメーション
    const startTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const prev = prevTimeRef.current;
      const dt = prev === null ? 0 : Math.min(0.05, (now - prev) / 1000);
      prevTimeRef.current = now;

      // ゆっくりと回転
      root.rotation.y = elapsed * 0.01;
      root.rotation.x = Math.sin(elapsed * 0.08) * 0.05;

      // パララックス風に各レイヤーを微妙に動かす
      layer1.points.rotation.y += 0.0003;
      layer2.points.rotation.y += 0.0001;
      layer3.points.rotation.y += 0.00005;

      // カメラのゆるいドリフト
      camera.position.x = Math.sin(elapsed * 0.15) * 20;
      camera.position.y = Math.cos(elapsed * 0.12) * 12;
      camera.lookAt(0, 0, 0);

      // 流れ星のスポーン（確率的）
      if (dt > 0) {
        const shouldSpawn = Math.random() < 0.25 * dt; // 平均4秒に1回程度
        if (shouldSpawn) {
          const candidate = shootingStars.find((s) => !s.active);
          if (candidate) {
            activateShootingStar(candidate);
          }
        }
      }

      // 流れ星の更新
      for (const star of shootingStars) {
        if (!star.active || dt === 0) continue;
        star.age += dt;
        // 位置更新
        star.group.position.x += star.velocity.x * dt;
        star.group.position.y += star.velocity.y * dt;
        // テール更新（先頭に現在位置、末尾を落とす）
        star.tailPositions.pop();
        star.tailPositions.unshift(new Vector3(0, 0, 0));
        // ローカル→ワールド不要。group原点にheadがあるため、テールはローカル座標でOK
        // ageに応じてフェードアウト
        const fade = Math.max(0, 1 - star.age / star.life);
        star.headMaterial.opacity = 0.9 * fade;
        star.tailMaterial.opacity = 0.8 * fade;
        updateTailGeometry(star, fade);

        // 画面外 or 寿命で終了
        const outOfBounds =
          star.group.position.x < -1200 ||
          star.group.position.y < -900 ||
          star.group.position.x > 1500 ||
          star.group.position.y > 1200;
        if (star.age > star.life || outOfBounds) {
          deactivateShootingStar(star);
        }
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animationFrameIdRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      setRendererSize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener("resize", onResize);
      // 流れ星の破棄
      for (const star of shootingStars) {
        if ((root as Group).children.indexOf(star.group) !== -1) {
          root.remove(star.group);
        }
        (star.head.geometry as BufferGeometry).dispose();
        star.headMaterial.dispose();
        (star.tail.geometry as BufferGeometry).dispose();
        star.tailMaterial.dispose();
      }
      layer1.geometry.dispose();
      layer1.material.dispose();
      layer2.geometry.dispose();
      layer2.material.dispose();
      layer3.geometry.dispose();
      layer3.material.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(1000px 600px at 50% 120%, #0b1226 0%, #070b18 35%, #050912 70%, #03060d 100%)",
      }}
    />
  );
}
