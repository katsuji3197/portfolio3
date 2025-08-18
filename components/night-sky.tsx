'use client';

import { useEffect, useRef } from 'react';

export default function NightSky() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let renderer: any = null;
    let scene: any = null;
    let layer1: any = null;
    let layer2: any = null;
    let layer3: any = null;
    let milkyWay: any = null;
    let circularTexture: any = null;
    let shootingStars: any[] = [];
    let onResize: any = null;

    (async () => {
      const THREE = await import('three');
      const {
        Scene,
        PerspectiveCamera,
        WebGLRenderer,
        BufferGeometry,
        Float32BufferAttribute,
        Points,
        PointsMaterial,
        ShaderMaterial,
        Color,
        FogExp2,
        Group,
        AdditiveBlending,
        Line,
        LineBasicMaterial,
        Vector3,
        Texture,
      } = THREE;

      scene = new Scene();
      scene.background = null;
      scene.fog = new FogExp2(new Color('#0a0f1f'), 0.0004);

      const camera = new PerspectiveCamera(70, 1, 1, 5000);
      camera.position.z = 600;

      renderer = new WebGLRenderer({ antialias: true, alpha: true });
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

      // 円形のテクスチャを作成
      const createCircularTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        // 背景を透明にする
        ctx.clearRect(0, 0, 64, 64);

        // グラデーションで円形を作成
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new Texture(canvas);
        texture.needsUpdate = true;
        return texture;
      };

      circularTexture = createCircularTexture();

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
        const starts = new Float32Array(count);
        const maxDelay = 3.0; // 各星のフェードイン最大遅延（秒）
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

          // 色を確率で決定: 5% コーラル, 5% コーンフラワーブルー, それ以外はデフォルト色
          let chosen = new Color(color);
          const r = Math.random();
          if (r < 0.05) {
            chosen = new Color('#ff7f50');
          } else if (r < 0.1) {
            chosen = new Color('#6495ed');
          }
          colors[idx] = chosen.r;
          colors[idx + 1] = chosen.g;
          colors[idx + 2] = chosen.b;

          // 各星のフェードイン開始時刻をランダム化
          starts[i] = Math.random() * maxDelay;
        }
        geometry.setAttribute(
          'position',
          new Float32BufferAttribute(positions, 3)
        );
        geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
        geometry.setAttribute('aStart', new Float32BufferAttribute(starts, 1));

        // シェーダで個別にフェードインさせる
        const material = new ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uFadeDuration: { value: 1.2 },
            // サイズを3倍に
            uSize: { value: size * 1.2 * 2 },
            map: { value: circularTexture },
          },
          vertexShader: `
            attribute vec3 aColor;
            attribute float aStart;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform float uFadeDuration;
            uniform float uSize;
            void main() {
              vColor = aColor;
              float t = clamp((uTime - aStart) / uFadeDuration, 0.0, 1.0);
              vAlpha = pow(t, 1.2);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = uSize * (300.0 / -mvPosition.z);
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
              if (alpha < 0.01) discard;
              // 明るさを3倍に
              gl_FragColor = vec4(vColor * tex.rgb * 2.0, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          alphaTest: 0.01,
        });

        const points = new Points(geometry, material as any);
        return { points, geometry, material };
      };

      // --- ここから天の川の生成 ---
      const createMilkyWay = (count: number, color: string, size: number) => {
        const geometry = new BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const starts = new Float32Array(count);

        const bandWidth = 200;
        const bandLength = 12000;
        const thickness = 600; // 太さを150から50に変更
        const maxDelay = 4.0;

        for (let i = 0; i < count; i++) {
          // 帯状の領域に星を配置
          const x = (Math.random() - 0.5) * bandLength;
          // yとzで楕円形の断面を表現し、中心部の密度を高くする
          const u = Math.random() * 1 * Math.PI;
          const r = Math.sqrt(Math.random()); // 中心に寄せるための平方根
          const y = r * Math.cos(u) * (bandWidth / 2);
          const z = r * Math.sin(u) * (thickness / 2);

          const idx = i * 3;
          positions[idx] = x;
          positions[idx + 1] = y;
          positions[idx + 2] = z;

          // 天の川の色合いを調整（青白く、時々黄色）
          let chosen = new Color(color);
          const rand = Math.random();
          if (rand < 0.1) {
            chosen = new Color('#a2b8ff'); // 淡い青
          } else if (rand < 0.15) {
            chosen = new Color('#fff4d8'); // 淡い黄
          }
          colors[idx] = chosen.r;
          colors[idx + 1] = chosen.g;
          colors[idx + 2] = chosen.b;

          starts[i] = Math.random() * maxDelay;
        }

        geometry.setAttribute(
          'position',
          new Float32BufferAttribute(positions, 3)
        );
        geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
        geometry.setAttribute('aStart', new Float32BufferAttribute(starts, 1));

        const material = new ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uFadeDuration: { value: 2.2 },
            uSize: { value: size * 1.1 * 2 },
            map: { value: circularTexture },
          },
          vertexShader: `
            attribute vec3 aColor;
            attribute float aStart;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform float uFadeDuration;
            uniform float uSize;
            void main() {
              vColor = aColor;
              float t = clamp((uTime - aStart) / uFadeDuration, 0.0, 1.0);
              vAlpha = pow(t, 1.1);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = uSize * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            uniform sampler2D map;
            void main() {
              vec4 tex = texture2D(map, gl_PointCoord);
              float alpha = tex.a * vAlpha * 0.9;
              if (alpha < 0.01) discard;
              // 明るさを3倍に
              gl_FragColor = vec4(vColor * tex.rgb * 2.0, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          alphaTest: 0.01,
        });

        const points = new Points(geometry, material as any);
        return { points, geometry, material };
      };
      // --- ここまで天の川の生成 ---

      layer1 = createStars(7000, '#eaf2ff', 2.0, 950);
      layer2 = createStars(5600, '#d9e6ff', 3.0, 1400);
      layer3 = createStars(4600, '#ffffff', 4.0, 1700);

      // ShaderMaterial の uniform を初期化
      const initLayerUniforms = (layer: any, fadeDuration = 1.2) => {
        if (layer && layer.material && (layer.material as any).uniforms) {
          (layer.material as any).uniforms.uTime.value = 0;
          (layer.material as any).uniforms.uFadeDuration.value = fadeDuration;
          (layer.material as any).uniforms.map.value = circularTexture;
        }
      };
      initLayerUniforms(layer1, 0.9);
      initLayerUniforms(layer2, 1.4);
      initLayerUniforms(layer3, 2.0);

      // 天の川を生成してシーンに追加
      milkyWay = createMilkyWay(43000, '#ffffff', 1.0);
      // 天の川を斜めに傾ける
      milkyWay.points.rotation.x = Math.PI / 6;
      milkyWay.points.rotation.z = Math.PI / 6;

      root.add(layer1.points);
      root.add(layer2.points);
      root.add(layer3.points);
      root.add(milkyWay.points); // シーンに天の川を追加

      // 流れ星（Shooting Stars）
      type ShootingStar = {
        group: any;
        head: any;
        headMaterial: any;
        tail: any;
        tailMaterial: any;
        tailPositions: any[];
        velocity: any;
        age: number;
        life: number;
        active: boolean;
      };

      const maxShootingStars = 1024;
      const tailSegments = 30;
      shootingStars = [];

      const makeShootingStar = (): ShootingStar => {
        // head
        const headGeometry = new BufferGeometry();
        headGeometry.setAttribute(
          'position',
          new Float32BufferAttribute(new Float32Array([0, 0, 0]), 3)
        );
        const headMaterial = new PointsMaterial({
          color: new Color('#a2b8ff'),
          // 流れ星の頭を大きく明るく（サイズと不透明度を3倍）
          size: 2.0 * 2.0,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
          blending: AdditiveBlending,
          sizeAttenuation: true,
          map: circularTexture,
          alphaTest: 0.1,
        });
        const head = new Points(headGeometry, headMaterial);

        // tail
        const tailGeometry = new BufferGeometry();
        const initialTail = new Float32Array(tailSegments * 3).fill(0);
        tailGeometry.setAttribute(
          'position',
          new Float32BufferAttribute(initialTail, 3)
        );
        const initialColors = new Float32Array(tailSegments * 3);
        for (let i = 0; i < tailSegments; i += 1) {
          const attenuation = Math.pow(0.85, i);
          const idx = i * 3;
          initialColors[idx] = attenuation;
          initialColors[idx + 1] = attenuation;
          initialColors[idx + 2] = attenuation;
        }
        tailGeometry.setAttribute(
          'color',
          new Float32BufferAttribute(initialColors, 3)
        );
        const tailMaterial = new LineBasicMaterial({
          color: 0xa2b8ff,
          transparent: true,
          opacity: 0.1,
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
          life: 48,
          active: false,
        };
      };

      const activateShootingStar = (star: ShootingStar) => {
        // 画面右上付近から左下方向へ
        const startX = 900 + Math.random() * 400;
        const startY = 700 + Math.random() * 400;
        const startZ = -100 + Math.random() * 200;
        star.group.position.set(startX, startY, startZ);
        star.velocity.set(
          -200 - Math.random() * 10,
          -133 - Math.random() * 5,
          0
        );
        star.age = 0;
        star.life = 8 + Math.random() * 41;
        star.active = true;
        star.headMaterial.opacity = 0.8;
        star.tailMaterial.opacity = 0.7;

        star.tailPositions.forEach((p: any) => p.set(0, 0, 0));
        updateTailGeometry(star, 1.0);

        if (scene.children.indexOf(star.group) === -1) {
          scene.add(star.group);
        }
      };

      const deactivateShootingStar = (star: ShootingStar) => {
        star.active = false;
        star.headMaterial.opacity = 0.2;
        star.tailMaterial.opacity = 0.2;
        if (scene.children.indexOf(star.group) !== -1) {
          scene.remove(star.group);
        }
      };

      const updateTailGeometry = (star: ShootingStar, fade: number) => {
        const positionAttr = star.tail.geometry.getAttribute('position') as any;
        const colorAttr = star.tail.geometry.getAttribute('color') as any;
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
        milkyWay.points.rotation.x += 0.00008; // 天の川もゆっくり回転

        // カメラのゆるいドリフト
        camera.position.x = Math.sin(elapsed * 0.15) * 20;
        camera.position.y = Math.cos(elapsed * 0.12) * 12;
        camera.lookAt(0, 0, 0);

        // 流れ星のスポーン（確率的）
        if (dt > 0) {
          const shouldSpawn = Math.random() < 1.2 * dt; // 平均1秒に1回程度
          if (shouldSpawn) {
            const candidate = shootingStars.find(s => !s.active);
            if (candidate) {
              activateShootingStar(candidate);
            }
          }
        }

        // 流れ星の更新
        for (const star of shootingStars) {
          if (!star.active || dt === 0) continue;
          star.age += dt;

          const deltaMove = star.velocity.clone().multiplyScalar(dt);
          star.group.position.add(deltaMove);
          star.tailPositions.forEach((p: any) => p.sub(deltaMove));
          star.tailPositions.pop();
          star.tailPositions.unshift(new Vector3(0, 0, 0));

          const fade = Math.max(0, 1 - star.age / star.life);
          star.headMaterial.opacity = 0.9 * fade;
          star.tailMaterial.opacity = 0.8 * fade;

          updateTailGeometry(star, fade);

          const outOfBounds =
            star.group.position.x < -1500 ||
            star.group.position.y < -1200 ||
            star.group.position.x > 1500 ||
            star.group.position.y > 1200;
          if (star.age > star.life || outOfBounds) {
            deactivateShootingStar(star);
          }
        }

        // シェーダを使っている各レイヤーの時間を更新
        try {
          if (layer1 && layer1.material && (layer1.material as any).uniforms) {
            (layer1.material as any).uniforms.uTime.value = elapsed;
          }
          if (layer2 && layer2.material && (layer2.material as any).uniforms) {
            (layer2.material as any).uniforms.uTime.value = elapsed;
          }
          if (layer3 && layer3.material && (layer3.material as any).uniforms) {
            (layer3.material as any).uniforms.uTime.value = elapsed;
          }
          if (
            milkyWay &&
            milkyWay.material &&
            (milkyWay.material as any).uniforms
          ) {
            (milkyWay.material as any).uniforms.uTime.value = elapsed;
          }
        } catch (e) {
          // ignore
        }

        renderer.render(scene, camera);
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };
      animationFrameIdRef.current = requestAnimationFrame(animate);

      onResize = () => {
        setRendererSize();
      };
      window.addEventListener('resize', onResize);
    })();

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (onResize) window.removeEventListener('resize', onResize);
      // 流れ星の破棄
      try {
        for (const star of shootingStars) {
          if (
            scene &&
            scene.children &&
            scene.children.indexOf(star.group) !== -1
          ) {
            scene.remove(star.group);
          }
          if (star.head && star.head.geometry) star.head.geometry.dispose();
          if (star.headMaterial) star.headMaterial.dispose();
          if (star.tail && star.tail.geometry) star.tail.geometry.dispose();
          if (star.tailMaterial) star.tailMaterial.dispose();
        }
        if (layer1) {
          layer1.geometry.dispose();
          layer1.material.dispose();
        }
        if (layer2) {
          layer2.geometry.dispose();
          layer2.material.dispose();
        }
        if (layer3) {
          layer3.geometry.dispose();
          layer3.material.dispose();
        }
        if (milkyWay) {
          milkyWay.geometry.dispose();
          milkyWay.material.dispose();
        }
        if (circularTexture) circularTexture.dispose();
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        }
      } catch (e) {
        // safe cleanup
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          'radial-gradient(1000px 600px at 50% 120%, #0b1226 0%, #070b18 35%, #050912 70%, #03060d 100%)',
      }}
    />
  );
}
