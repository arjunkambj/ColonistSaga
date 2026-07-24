import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  output: "export",
  reactCompiler: true,
  transpilePackages: ["@colonistsaga/backend", "@colonistsaga/game"],
};

export default nextConfig;
