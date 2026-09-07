import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode in dev to prevent React 18/19 from double-firing all effects & queries
  reactStrictMode: false,

  // Drastically speeds up compilation by importing only used icons from lucide-react
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
