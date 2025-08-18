'use client';

import { useEffect, useRef } from 'react';
import { useCursor } from '@/contexts/cursor-context';

interface CursorTrail {
  el: HTMLDivElement;
  x: number;
  y: number;
}

export default function CustomCursor() {
  const { isCustomCursorEnabled } = useCursor();
  const coordsRef = useRef({ x: 0, y: 0 });
  const trailElementsRef = useRef<CursorTrail[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  const TRAIL_COUNT = 16;

  useEffect(() => {
    // カスタムカーソルが無効な場合は通常のカーソルを表示
    if (!isCustomCursorEnabled) {
      document.body.style.cursor = 'auto';
      return;
    }

    // カスタムカーソル有効時はデフォルトカーソルを非表示
    document.body.style.cursor = 'none';

    // 軌跡要素を生成してDOMに追加
    const trailElements: CursorTrail[] = [];

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const el = document.createElement('div');
      el.classList.add('cursor-trail');
      document.body.appendChild(el);
      trailElements.push({
        el: el,
        x: 0,
        y: 0,
      });
    }

    trailElementsRef.current = trailElements;

    // マウス座標を記録
    const handleMouseMove = (e: MouseEvent) => {
      coordsRef.current = { x: e.clientX, y: e.clientY };
    };

    // クリック時の波動エフェクト
    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement('div');
      ripple.classList.add('cursor-ripple');
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);

      // アニメーション完了後に要素を削除
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // アニメーションループ
    const animate = () => {
      const currentCoords = coordsRef.current;
      let x = currentCoords.x;
      let y = currentCoords.y;

      // 各軌跡要素の位置を更新
      trailElements.forEach((trail, index) => {
        // 現在の要素の位置を更新（前の要素の位置に追従）
        trail.x += (x - trail.x) * 0.99;
        trail.y += (y - trail.y) * 0.99;

        // スケールと透明度を計算（尾に行くほど小さく、透明に）
        const scale = (TRAIL_COUNT - index) / TRAIL_COUNT;
        const finalScale = scale * 0.99;

        trail.el.style.transform = `translate(${trail.x}px, ${trail.y}px) translate(-50%, -50%) scale(${finalScale})`;
        trail.el.style.opacity = scale.toString();

        // 次の要素が追従するための座標を更新
        x = trail.x;
        y = trail.y;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // クリーンアップ
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);

      trailElements.forEach(trail => {
        if (trail.el.parentNode) {
          trail.el.parentNode.removeChild(trail.el);
        }
      });

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // カーソルを通常に戻す
      document.body.style.cursor = 'auto';
    };
  }, [isCustomCursorEnabled]);

  return null; // このコンポーネントはDOM要素を直接操作するため、何もレンダリングしない
}
