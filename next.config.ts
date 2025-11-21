import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',

  async rewrites() {
    // In production, API requests are handled by this FastAPI server
    // Since we're only using production configuration, we don't need any rewrites
    return [];
  },
};

export default nextConfig;
