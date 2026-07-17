import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@heroui/react"],
  },
  images: {
    unoptimized: true,
  },
  output: "export",
  transpilePackages: ["@catansaga/backend", "@catansaga/game"],
};

export default nextConfig;
