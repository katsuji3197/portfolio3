type PlaybackFrame = (nowMs: number, dtSec: number) => void;

/**
 * requestAnimationFrame を、タブ非表示または対象が画面外のときは止める。
 * 再開直後の dt は 0 にして、停止中の経過時間でアニメが飛ばないようにする。
 */
export function startWebGLPlayback(
  target: Element,
  frame: PlaybackFrame
): () => void {
  let rafId = 0;
  let running = false;
  let tabVisible = document.visibilityState === 'visible';
  let onscreen = true;
  let lastMs = 0;

  const tick = (nowMs: number) => {
    if (!running) {
      return;
    }

    const dtSec = lastMs === 0 ? 0 : Math.min(0.05, (nowMs - lastMs) / 1000);
    lastMs = nowMs;
    frame(nowMs, dtSec);
    rafId = requestAnimationFrame(tick);
  };

  const sync = () => {
    const shouldRun = tabVisible && onscreen;
    if (shouldRun === running) {
      return;
    }

    if (shouldRun) {
      running = true;
      lastMs = 0;
      rafId = requestAnimationFrame(tick);
      return;
    }

    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const onVisibility = () => {
    tabVisible = document.visibilityState === 'visible';
    sync();
  };

  document.addEventListener('visibilitychange', onVisibility);

  const observer = new IntersectionObserver(
    ([entry]) => {
      onscreen = Boolean(entry?.isIntersecting);
      sync();
    },
    { threshold: 0 }
  );
  observer.observe(target);

  sync();

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', onVisibility);
    observer.disconnect();
  };
}

export function capDevicePixelRatio(devicePixelRatio?: number): number {
  return Math.min(devicePixelRatio || 1, 2);
}
