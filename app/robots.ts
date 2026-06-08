import type { MetadataRoute } from 'next';

/**
 * robots.txt — generated automatically by Next.js at build time.
 * Tells search engines what they can and cannot crawl.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/test-flow',
          '/test-simple',
          '/preview-caja',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://collectaproduce.com/sitemap.xml',
    host: 'https://collectaproduce.com',
  };
}
