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
    return [
      { source: "/mapa-agroalimentario", headers: noindex },
      { source: "/mapa-agroalimentario/:path*", headers: noindex },
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
