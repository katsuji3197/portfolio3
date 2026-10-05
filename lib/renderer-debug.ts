export type RendererDebugSlot = 'sky' | 'dna';

type RendererDebugStatus = {
  backend: 'webgpu' | 'webgl';
  fallback: boolean;
};

const status: Partial<Record<RendererDebugSlot, RendererDebugStatus>> = {};

let label: HTMLDivElement | null = null;
let watching = false;

/**
 * `?renderer` または `?renderer=1` のときだけ、実際に描いている
 * バックエンドを画面隅に出す。パラメータが無いときは DOM も
 * history の監視も作らない。
 */
export function isRendererDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).has('renderer');
}

export function reportRendererDebug(
  slot: RendererDebugSlot,
  backend: 'webgpu' | 'webgl',
  fallback: boolean
) {
  if (!isRendererDebugEnabled()) {
    return;
  }
  status[slot] = { backend, fallback };
  renderRendererDebug();
}

export function clearRendererDebug(slot: RendererDebugSlot) {
  if (!status[slot]) {
    return;
  }
  delete status[slot];
  if (isRendererDebugEnabled()) {
    renderRendererDebug();
  } else {
    removeRendererDebug();
  }
}

export function watchRendererDebugUrl() {
  if (watching || typeof window === 'undefined' || !isRendererDebugEnabled()) {
    return;
  }
  watching = true;

  const notify = () => {
    if (isRendererDebugEnabled()) {
      renderRendererDebug();
    } else {
      removeRendererDebug();
    }
  };

  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);
  history.pushState = (...args) => {
    originalPush(...args);
    notify();
  };
  history.replaceState = (...args) => {
    originalReplace(...args);
    notify();
  };
  window.addEventListener('popstate', notify);
}

function renderRendererDebug() {
  const text = debugLabelText();
  if (!text) {
    removeRendererDebug();
    return;
  }
  if (!label) {
    label = document.createElement('div');
    label.setAttribute('data-renderer-debug', 'true');
    label.setAttribute('aria-hidden', 'true');
    label.style.position = 'fixed';
    label.style.right = '10px';
    label.style.bottom = '10px';
    label.style.zIndex = '45';
    label.style.pointerEvents = 'none';
    label.style.margin = '0';
    label.style.padding = '4px 6px';
    label.style.borderRadius = '4px';
    label.style.background = 'rgba(0, 0, 0, 0.4)';
    label.style.color = 'rgba(255, 255, 255, 0.78)';
    label.style.font =
      '11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace';
    label.style.letterSpacing = '0.01em';
    label.style.whiteSpace = 'pre';
    document.body.appendChild(label);
  }
  label.textContent = text;
}

function removeRendererDebug() {
  label?.remove();
  label = null;
}

function debugLabelText(): string {
  const sky = status.sky ? formatBackend(status.sky) : '';
  const dna = status.dna ? formatBackend(status.dna) : '';
  if (sky && dna) {
    return `Sky: ${sky}\nDNA: ${dna}`;
  }
  return sky || (dna ? `DNA: ${dna}` : '');
}

function formatBackend(entry: RendererDebugStatus): string {
  if (entry.backend === 'webgpu') {
    return 'WebGPU';
  }
  return entry.fallback ? 'WebGL (fallback)' : 'WebGL';
}
