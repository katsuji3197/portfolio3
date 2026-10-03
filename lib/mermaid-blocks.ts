const MERMAID_DIAGRAM_TYPES = new Set([
  'architecture',
  'architecture-beta',
  'block',
  'block-beta',
  'C4Component',
  'C4Container',
  'C4Context',
  'C4Deployment',
  'C4Dynamic',
  'flowchart',
  'flowchart-elk',
  'gantt',
  'gitGraph',
  'graph',
  'erDiagram',
  'eventmodeling',
  'eventmodeling-beta',
  'fishbone',
  'ishikawa',
  'journey',
  'kanban',
  'classDiagram',
  'mindmap',
  'packet',
  'packet-beta',
  'pie',
  'quadrantChart',
  'radar',
  'radar-beta',
  'requirementDiagram',
  'sankey',
  'sankey-beta',
  'sequenceDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'swimlane-beta',
  'timeline',
  'treeView',
  'treemap',
  'treemap-beta',
  'venn',
  'venn-beta',
  'wardley',
  'wardley-beta',
  'xychart',
  'xychart-beta',
  'zenuml',
]);

const PRE_MERMAID_CLASS_RE =
  /<pre\b[^>]*\bclass\s*=\s*(["']?)[^"'>\n]*\bmermaid\b[^"'>]*\1/i;
const PRE_CODE_RE =
  /<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;

export type MermaidBlock = {
  element: HTMLElement;
  source: string;
};

export function getFirstNonEmptyLine(text: string): string {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

export function isMermaidDiagramHeader(line: string): boolean {
  const match = line.trim().match(/^([A-Za-z][A-Za-z0-9-]*)(?=$|[\s:])/);
  return Boolean(match && MERMAID_DIAGRAM_TYPES.has(match[1]));
}

export function isMermaidSource(text: string): boolean {
  return isMermaidDiagramHeader(getFirstNonEmptyLine(text));
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCharCode(Number(value))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCharCode(parseInt(value, 16))
    )
    .replace(/&amp;/gi, '&');
}

function htmlFragmentToText(html: string): string {
  return decodeBasicHtmlEntities(html.replace(/<[^>]+>/g, ''));
}

export function htmlContainsMermaidBlock(html: string): boolean {
  if (PRE_MERMAID_CLASS_RE.test(html)) return true;

  PRE_CODE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PRE_CODE_RE.exec(html))) {
    if (isMermaidSource(htmlFragmentToText(match[1]))) return true;
  }
  return false;
}

function sourceFromPre(pre: HTMLElement): string {
  const code = pre.querySelector(':scope > code');
  return (code?.textContent ?? pre.textContent ?? '').replace(/^\uFEFF/, '');
}

export function collectMermaidBlocks(root: ParentNode): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  const seen = new Set<HTMLElement>();

  root.querySelectorAll('pre.mermaid').forEach(node => {
    const pre = node as HTMLElement;
    const source = sourceFromPre(pre);
    if (!source.trim()) return;
    seen.add(pre);
    blocks.push({ element: pre, source });
  });

  root.querySelectorAll('pre > code').forEach(node => {
    const code = node as HTMLElement;
    const pre = code.parentElement;
    if (!pre || pre.tagName !== 'PRE' || seen.has(pre)) return;
    const source = code.textContent ?? '';
    if (!isMermaidSource(source)) return;
    seen.add(pre);
    blocks.push({ element: pre, source });
  });

  return blocks;
}
