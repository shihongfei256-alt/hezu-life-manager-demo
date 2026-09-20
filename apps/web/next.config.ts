import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryBasePath = "/hezu-life-manager-demo";

const nextConfig: NextConfig = {
  transpilePackages: ["@daziwu/domain"],
  devIndicators: false,
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? repositoryBasePath : undefined,
  assetPrefix: isGitHubPages ? repositoryBasePath : undefined,
  trailingSlash: isGitHubPages,
};

export default nextConfig;
