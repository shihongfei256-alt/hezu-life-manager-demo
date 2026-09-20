import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@daziwu/domain"],
  devIndicators: false,
};

export default nextConfig;
