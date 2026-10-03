'use client';

import { useEffect, useRef } from 'react';
import { collectMermaidBlocks } from '@/lib/mermaid-blocks';

type ProjectHtmlContentProps = {
  html: string;
};

let mermaidLoader: Promise<typeof import('mermaid').default> | null = null;

function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then(module => {
      const mermaid = module.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        look: 'classic',
        securityLevel: 'strict',
        fontFamily:
          'var(--font-noto-sans-jp), ui-sans-serif, system-ui, sans-serif',
        themeVariables: {
          darkMode: true,
          background: 'transparent',
          primaryColor: '#262626',
          primaryTextColor: '#e5e5e5',
          primaryBorderColor: '#737373',
          lineColor: '#a3a3a3',
          secondaryColor: '#171717',
          tertiaryColor: '#0a0a0a',
          mainBkg: '#262626',
          secondBkg: '#171717',
          nodeBorder: '#737373',
          clusterBkg: '#171717',
          clusterBorder: '#404040',
          titleColor: '#f5f5f5',
          edgeLabelBackground: '#0a0a0a',
          tertiaryTextColor: '#d4d4d4',
          textColor: '#e5e5e5',
        },
      });
      return mermaid;
    });
  }
  return mermaidLoader;
}

function replaceWithDiagram(element: HTMLElement, svg: string) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mermaid-diagram';
  wrapper.innerHTML = svg;
  element.replaceWith(wrapper);
}

export default function ProjectHtmlContent({ html }: ProjectHtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const blocks = collectMermaidBlocks(root);
    if (blocks.length === 0) return;

    let cancelled = false;

    const renderBlocks = async () => {
      const mermaid = await loadMermaid();
      if (cancelled) return;

      for (const [index, block] of blocks.entries()) {
        if (cancelled || !block.element.isConnected) return;

        const renderId = `projectMermaid${index}${Math.random()
          .toString(36)
          .slice(2, 10)}`;

        try {
          const { svg } = await mermaid.render(renderId, block.source);
          if (cancelled || !block.element.isConnected) return;
          replaceWithDiagram(block.element, svg);
        } catch {
          document.getElementById(renderId)?.remove();
          document.getElementById(`d${renderId}`)?.remove();
        }
      }
    };

    void renderBlocks();

    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
