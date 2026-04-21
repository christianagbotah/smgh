import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*"],
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "mysql2"],
};

export default nextConfig;
