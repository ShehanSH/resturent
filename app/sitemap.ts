import type { MetadataRoute } from "next";

import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { listPublicSlugs } from "@/lib/services/catalog.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/menu`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  if (!isSupabaseConfigured) return staticRoutes;

  const { categories, foodItems } = await listPublicSlugs();
  return [
    ...staticRoutes,
    ...categories.map((category) => ({
      url: `${base}/menu/${category.slug}`,
      lastModified: category.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...foodItems.map((item) => ({
      url: `${base}/products/${item.slug}`,
      lastModified: item.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
