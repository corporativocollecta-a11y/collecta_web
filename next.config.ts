import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // English is the default language and is served at the root; Spanish lives at /es
  async rewrites() {
    return [{ source: "/", destination: "/en" }];
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
