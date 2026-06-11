import { MetadataRoute } from 'next';
import { promises as fs } from "node:fs";
import path from "node:path";

const BASE_URL = 'https://bamsemats.github.io/dota-patch-intelligence';
const researchDir = path.resolve(process.cwd(), "../../research-output");

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const patchesDir = path.join(researchDir, "classified-patches");
  const historyDir = path.join(researchDir, "hero-history");

  // Get Patches
  const patchFiles = await fs.readdir(patchesDir).catch(() => []);
  const patches = patchFiles
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));

  // Get Heroes
  const heroFiles = await fs.readdir(historyDir).catch(() => []);
  const heroes = heroFiles
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));

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
