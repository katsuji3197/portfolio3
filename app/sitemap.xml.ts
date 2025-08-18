import { PROJECTS } from '@/data/projects';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://folio.paon.dev';

function createUrl(loc: string, lastmod?: string) {
  return `
    <url>
      <loc>${SITE_URL}${loc}</loc>
      ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>
  `;
}

export async function GET() {
  const pages = ['/', '/projects', '/profile', '/contact'];
  const projectUrls = PROJECTS.map(p => `/projects/${p.id}`);

  const urls = [...pages, ...projectUrls].map(path => createUrl(path)).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
