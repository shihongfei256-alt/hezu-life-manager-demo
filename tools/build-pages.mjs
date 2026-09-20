import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const nextCli = path.resolve("apps/web/node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, "build", "apps/web"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    GITHUB_PAGES: "true",
    NEXT_PUBLIC_BASE_PATH: "/hezu-life-manager-demo",
  },
  stdio: "inherit",
});

if (result.status !== 0) process.exit(result.status ?? 1);

await fs.writeFile(path.resolve("apps/web/out/.nojekyll"), "", "utf8");
