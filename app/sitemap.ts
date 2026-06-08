import type { MetadataRoute } from 'next';

const BASE_URL = 'https://collectaproduce.com';

/**
 * sitemap.xml — generated automatically by Next.js at build time.
 * Lists all public pages so search engines can discover and prioritize them.
 *
 * NOTE: /plataforma redirects to app.collectaproduce.com (out of scope here).
 * NOTE: /test-* and /preview-caja are excluded via robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-06-08');

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/terminos`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacidad`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];
}
