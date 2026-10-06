import { describe, expect, it } from '@jest/globals';
import { enhanceProjectBodyHtml } from './project-content-html';

const FIGURE = `<figure><img src="https://images.microcms-assets.io/assets/90b1ba256cc64d349cc98ca2aba39a4e/3f208521aa0e407487bb050876fe942c/pf-vm-desktop.webp" alt="ブラウザ上で起動した仮想マシン" width="1440" height="681"><figcaption>ブラウザから起動した演習用の仮想マシン</figcaption></figure>`;

function imgTag(html: string): string {
  const tag = html.match(/<img\b[^>]*>/i);
  if (!tag) throw new Error('img tag not found');
  return tag[0];
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(
    new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`, 'i')
  );
  return match?.[1];
}

describe('enhanceProjectBodyHtml', () => {
  it('adds lazy loading and async decoding to body images', () => {
    const html = enhanceProjectBodyHtml(FIGURE);
    const tag = imgTag(html);

    expect(attr(tag, 'loading')).toBe('lazy');
    expect(attr(tag, 'decoding')).toBe('async');
    expect(html).toContain(
      '<figcaption>ブラウザから起動した演習用の仮想マシン</figcaption>'
    );
  });

  it('does not override an existing loading or decoding attribute', () => {
    const html = enhanceProjectBodyHtml(
      '<img src="https://example.com/a.png" loading="eager" decoding="sync" alt="">'
    );
    const tag = imgTag(html);

    expect(attr(tag, 'loading')).toBe('eager');
    expect(attr(tag, 'decoding')).toBe('sync');
    expect(tag.match(/loading=/gi)).toHaveLength(1);
    expect(tag.match(/decoding=/gi)).toHaveLength(1);
  });

  it('builds a MicroCMS srcset capped at the intrinsic width', () => {
    const tag = imgTag(enhanceProjectBodyHtml(FIGURE));
    const srcset = attr(tag, 'srcset') ?? '';
    const widths = [...srcset.matchAll(/\s(\d+)w/g)].map(match =>
      Number(match[1])
    );

    expect(widths).toEqual([480, 640, 768, 960, 1200, 1440]);
    expect(srcset).toContain('?w=480&amp;fm=webp 480w');
    expect(srcset).not.toContain('1600w');
    expect(srcset).not.toContain('1920w');
    expect(attr(tag, 'sizes')).toContain('calc(100vw - 24rem)');
  });

  it('leaves non-MicroCMS images and existing srcset values alone', () => {
    const external = enhanceProjectBodyHtml(
      '<p><img src="https://example.com/photo.webp" width="1200" height="800"></p>'
    );
    expect(imgTag(external)).not.toContain('srcset=');
    expect(attr(imgTag(external), 'loading')).toBe('lazy');

    const existing = enhanceProjectBodyHtml(
      '<img src="https://images.microcms-assets.io/assets/a/b.webp" srcset="https://images.microcms-assets.io/assets/a/b.webp?w=400 400w" width="800" height="400">'
    );
    expect(attr(imgTag(existing), 'srcset')).toBe(
      'https://images.microcms-assets.io/assets/a/b.webp?w=400 400w'
    );
  });

  it('skips srcset when the source is already width-constrained or not WebP', () => {
    const sized = enhanceProjectBodyHtml(
      '<img src="https://images.microcms-assets.io/assets/a/b.webp?w=640" width="640" height="360">'
    );
    expect(imgTag(sized)).not.toContain('srcset=');

    const jpeg = imgTag(
      enhanceProjectBodyHtml(
        '<img src="https://images.microcms-assets.io/assets/a/photo.jpg" width="1000" height="600">'
      )
    );
    expect(attr(jpeg, 'srcset')).toContain('photo.jpg?w=480 480w');
    expect(attr(jpeg, 'srcset')).not.toContain('fm=webp');
  });

  it('is idempotent and preserves self-closing tags', () => {
    const source =
      '<img src="https://images.microcms-assets.io/assets/a/c.webp" width="800" height="400" alt="図" />';
    const once = enhanceProjectBodyHtml(source);
    const twice = enhanceProjectBodyHtml(once);

    expect(twice).toBe(once);
    expect(once.trimEnd().endsWith('/>')).toBe(true);
    expect(once.match(/loading=/gi)).toHaveLength(1);
    expect(once.match(/srcset=/gi)).toHaveLength(1);
  });
});
