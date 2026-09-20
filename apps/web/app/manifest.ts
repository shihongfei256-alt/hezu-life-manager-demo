import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "搭子屋｜合租生活管家",
    short_name: "搭子屋",
    description: "费用、家务和共用品的合租协作空间。",
    start_url: `${basePath}/`,
    display: "standalone",
    background_color: "#F7F8F3",
    theme_color: "#F7F8F3",
    orientation: "portrait-primary",
    icons: [
      {
        src: `${basePath}/brand-mark.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
