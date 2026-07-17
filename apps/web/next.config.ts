import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["@catansaga/backend", "@catansaga/game"],
};

export default nextConfig;
