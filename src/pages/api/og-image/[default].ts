import { OGImageRoute } from "../../../lib/og-image";

export const { getStaticPaths, GET } = await OGImageRoute({
  param: "default",
  pages: {
    default: {
      title: "Pere Montpeó",
      description:
        "Enginyer de programari especialitzat en desenvolupament web",
      siteName: "peremontpeo.dev",
    },
  },
  getImageOptions: (key, page) => ({
    title: page.title,
    description: page.description,
    siteName: page.siteName,
    logo: {
      path: "./src/assets/avatar.png",
      size: [96],
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
        size: 80,
        weight: "SemiBold",
        lineHeight: 1.2,
        families: ["Geist"],
      },
      description: {
        color: [156, 163, 175],
        size: 36,
        weight: "Normal",
        lineHeight: 1.4,
        families: ["Geist"],
      },
    },
    fonts: [
      "https://unpkg.com/geist@1.0.0/dist/fonts/geist-sans/Geist-SemiBold.woff2",
      "https://unpkg.com/geist@1.0.0/dist/fonts/geist-sans/Geist-Regular.woff2",
    ],
  }),
});
