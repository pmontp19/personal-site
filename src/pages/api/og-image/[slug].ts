import { getCollection } from "astro:content";
import fs from "node:fs";
import { OGImageRoute } from "../../../lib/og-image";
import { getSlug } from "../../../utils/date";

const blogEntries = await getCollection("blog");
const pages = Object.fromEntries(
  blogEntries.map(({ id, data }) => [getSlug(id), data]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (slug, page) => {
    // captura de la figura Hairline (pnpm hairline:og); sense captura, OG de sempre
    const shot =
      page.hairline && `./src/assets/hairline/${page.hairline.name}.png`;
    const figure = shot && fs.existsSync(shot) ? { path: shot } : undefined;
    return {
      title: page.title,
      description: figure ? "" : page.description,
      figure,
      siteName: "peremontpeo.dev",
      logo: {
        path: "./src/assets/avatar.png",
        size: [64],
      },
      bgGradient: [[22, 27, 34]],
      border: {
        color: [255, 188, 13],
        width: 8,
        side: "inline-start",
      },
      padding: 80,
      font: {
        title: {
          color: [255, 255, 255],
          size: 64,
          weight: "SemiBold",
          lineHeight: 1.2,
          ...(figure && { size: 52 }),
          families: ["Geist"],
        },
        description: {
          color: [156, 163, 175],
          size: 32,
          weight: "Normal",
          lineHeight: 1.4,
          families: ["Geist"],
        },
      },
      fonts: [
        "https://unpkg.com/geist@1.0.0/dist/fonts/geist-sans/Geist-SemiBold.woff2",
        "https://unpkg.com/geist@1.0.0/dist/fonts/geist-sans/Geist-Regular.woff2",
      ],
    };
  },
});
