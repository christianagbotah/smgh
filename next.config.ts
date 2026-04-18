import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cPanel deployment: output standalone server
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
