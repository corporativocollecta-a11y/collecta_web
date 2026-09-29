import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // English is the default language and is served at the root; Spanish lives at /es
  async rewrites() {
    return [
      { source: "/", destination: "/en" },
      // the agri-food map is a standalone static page in public/, reachable only by direct link
      { source: "/mapa-agroalimentario", destination: "/mapa-agroalimentario/index.html" },
      { source: "/mapa-agroalimentario/reporte", destination: "/mapa-agroalimentario/reporte/index.html" },
    ];
  },
  async headers() {
    // keep the unlisted map out of search engines
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    // map assets: files referenced by index.html carry ?v=<content hash>, so they can be cached for a year;
    // files the map loads later (region shapes, history) are cached for a day and revalidated in the background
    const assets = "/mapa-agroalimentario/:dir(js|css|data|img)/:path*";
    return [
      { source: "/mapa-agroalimentario", headers: noindex },
      { source: "/mapa-agroalimentario/:path*", headers: noindex },
      { source: assets, headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      {
        source: assets,
        has: [{ type: "query", key: "v" }],
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      // the old site's link to the COS platform keeps working
      { source: "/plataforma", destination: "https://app.collectaproduce.com/", permanent: false },
    ];
  },
};

export default nextConfig;
