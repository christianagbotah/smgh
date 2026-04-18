import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "_next",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
