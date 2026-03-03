import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained build for Docker (no full node_modules needed in runner stage)
  output: "standalone",
};

export default nextConfig;
