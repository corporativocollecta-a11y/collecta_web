import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN-origin requests to /_next/* dev resources (HMR, chunks, RSC).
  // Without this, browsers reaching the dev server via a non-localhost host
  // (e.g. http://192.168.100.7:3000) get blocked by Next.js cross-origin guard.
  allowedDevOrigins: ['192.168.100.7'],
};

export default nextConfig;
