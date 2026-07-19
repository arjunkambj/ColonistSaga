import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@heroui/react"],
  },
  images: {
    unoptimized: true,
  },
  output: "export",
  transpilePackages: ["@colonistsaga/backend", "@colonistsaga/game"],
};

export default nextConfig;
