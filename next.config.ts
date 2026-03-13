import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview environment
  allowedDevOrigins: [
    '.space.z.ai',
    'space.z.ai',
    'localhost',
    '.z.ai',
  ],
};

export default nextConfig;
