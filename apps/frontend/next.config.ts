import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/dota-patch-intelligence",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
