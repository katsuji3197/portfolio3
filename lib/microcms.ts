import { createClient } from 'microcms-js-sdk';
import type { Project } from '@/data/projects';

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

if (!serviceDomain || !apiKey) {
  throw new Error('MICROCMS_SERVICE_DOMAIN or MICROCMS_API_KEY is not set');
}

export const microcmsClient = createClient({
  serviceDomain,
  apiKey,
});

function mapCmsItemToProject(item: any): Project {
  return {
    id: item.slug ?? item.id,
    imageSrc: item.thumbnail?.url ?? item.image?.url ?? item.imageSrc ?? '',
    title: item.title ?? item.name ?? '',
    tags: Array.isArray(item.tags)
      ? item.tags
          .map((t: any) => (typeof t === 'string' ? t : (t.name ?? t)))
          .filter(Boolean)
      : (item.stack ?? []),
    description: item.description ?? item.summary ?? '',
    createdAt: item.date ?? '',
  } as Project;
}

export async function getProjects(limit = 100) {
  const res = await microcmsClient.get({
    endpoint: 'projects',
    queries: { limit },
  });
  return (res.contents ?? []).map(mapCmsItemToProject);
}

export async function getProjectBySlug(slug: string) {
  const res = await microcmsClient.get({
    endpoint: 'projects',
    queries: { filters: `slug[equals]${slug}` },
  });
  const item = res.contents?.[0] ?? null;
  return item ? mapCmsItemToProject(item) : null;
}
