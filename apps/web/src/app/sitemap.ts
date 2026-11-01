import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ['', '/listings', '/discover', '/pricing', '/about', '/safety'].map((p) => ({
    url: `${SITE}${p}`,
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.7,
  }));
  try {
    const res = await fetch(`${API_URL}/api/v1/listings?limit=48`, { next: { revalidate: 3600 } });
    const data = (await res.json()) as { items: { id: string; bumpedAt: string }[] };
    return [
      ...statics,
      ...data.items.map((l) => ({ url: `${SITE}/listings/${l.id}`, lastModified: new Date(l.bumpedAt), priority: 0.6 })),
    ];
  } catch {
    return statics;
  }
}
