import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to _next/ instead of .next/ for cPanel Apache compatibility
  // cPanel's Apache cannot access dot-directories, so this ensures
  // /_next/static/* requests match _next/static/* on disk
  distDir: '_next',
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
