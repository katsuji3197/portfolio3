const IMG_TAG_RE = /<img\b([^>]*?)>/gi;

/** Column width of the project detail page (`px-4 sm:px-24 xl:px-48`). */
const IMAGE_SIZES =
  '(min-width: 1280px) calc(100vw - 24rem), (min-width: 640px) calc(100vw - 12rem), calc(100vw - 2rem)';

const SRCSET_WIDTHS = [480, 640, 768, 960, 1200, 1440, 1600, 1920];

function hasAttr(attrs: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}\\s*=`, 'i').test(attrs);
}

function readAttr(attrs: string, name: string): string | undefined {
  const match = attrs.match(
    new RegExp(
      `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`,
      'i'
    )
  );
  if (!match) return undefined;
  return decodeAttr(match[1] ?? match[2] ?? match[3] ?? '');
}

function decodeAttr(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function microcmsSrcset(attrs: string): string | null {
  const src = readAttr(attrs, 'src');
  if (!src) return null;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }

  if (url.hostname !== 'images.microcms-assets.io') return null;
  if (url.searchParams.has('w') || hasAttr(attrs, 'srcset')) return null;

  const widthRaw = readAttr(attrs, 'width');
  if (!widthRaw || !/^\d+$/.test(widthRaw)) return null;
  const intrinsic = Number(widthRaw);
  if (intrinsic < 1) return null;

  const widths = SRCSET_WIDTHS.filter(width => width < intrinsic);
  if (widths.length === 0) return null;
  widths.push(intrinsic);

  const pathname = url.pathname.toLowerCase();
  const keepWebp = pathname.endsWith('.webp') && !url.searchParams.has('fm');

  const srcset = widths
    .map(width => {
      const sized = new URL(url.href);
      sized.searchParams.set('w', String(width));
      // `?w=` alone is served as JPEG. Keep the original WebP.
      if (keepWebp) sized.searchParams.set('fm', 'webp');
      return `${escapeAttr(sized.href)} ${width}w`;
    })
    .join(', ');

  return ` srcset="${srcset}" sizes="${IMAGE_SIZES}"`;
}

function enhanceImgTag(rawAttrs: string): string {
  const selfClosing = /\/\s*$/.test(rawAttrs);
  let attrs = selfClosing ? rawAttrs.replace(/\s*\/\s*$/, '') : rawAttrs;
  const additions: string[] = [];

  if (!hasAttr(attrs, 'loading')) additions.push('loading="lazy"');
  if (!hasAttr(attrs, 'decoding')) additions.push('decoding="async"');

  const srcset = microcmsSrcset(attrs);
  if (srcset) additions.push(srcset.trim());

  if (additions.length > 0) {
    if (attrs.length > 0 && !/\s$/.test(attrs)) attrs += ' ';
    attrs += additions.join(' ');
  }

  return selfClosing ? `<img${attrs} />` : `<img${attrs}>`;
}

/**
 * Prepare MicroCMS rich-text HTML before it is injected into the project body.
 * Images without `loading` lazy-load, decode off the main thread, and MicroCMS
 * assets gain a width-capped `srcset`.
 */
export function enhanceProjectBodyHtml(html: string): string {
  IMG_TAG_RE.lastIndex = 0;
  return html.replace(IMG_TAG_RE, (_match, rawAttrs: string) =>
    enhanceImgTag(rawAttrs)
  );
}
