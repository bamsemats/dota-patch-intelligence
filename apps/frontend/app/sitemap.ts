import { MetadataRoute } from 'next';

const BASE_URL = 'https://bamsemats.github.io/dota-patch-intelligence';
const API_BASE = process.env.API_URL || "http://localhost:8080";

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let patches: string[] = [];
  let heroes: string[] = [];

  try {
    const patchRes = await fetch(`${API_BASE}/api/patches`);
    if (patchRes.ok) {
      const data = await patchRes.json();
      patches = data.map((p: any) => p.version);
    }
  } catch (e) {
    console.error("Sitemap: Failed to fetch patches");
  }

  try {
    const heroRes = await fetch(`${API_BASE}/api/heroes`);
    if (heroRes.ok) {
      const data = await heroRes.json();
      heroes = data.map((h: any) => h.name.replace(/[^a-z0-9]/gi, '_').toLowerCase());
    }
  } catch (e) {
    console.error("Sitemap: Failed to fetch heroes");
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  ];

  const patchRoutes: MetadataRoute.Sitemap = patches.flatMap(version => [
    {
      url: `${BASE_URL}/patch/${version}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/patch/${version}/full-notes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }
  ]);

  const heroRoutes: MetadataRoute.Sitemap = heroes.map(name => ({
    url: `${BASE_URL}/hero/${name}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...patchRoutes, ...heroRoutes];
}
