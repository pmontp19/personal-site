import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { CanvasKit as CanvasKitType, FontMgr } from "canvaskit-wasm";

/**
 * Open Graph image generation, reproducing the subset of `astro-og-canvas` this
 * site uses, drawn directly with `canvaskit-wasm`. Kept in-repo because
 * `astro-og-canvas` does not yet declare Astro 7 support.
 *
 * Output dimensions and layout match the previous package: a 1200×630 canvas
 * with a vertical background gradient, an inline-start accent border, a logo in
 * the top inline-start corner, and a title + description paragraph anchored to
 * the bottom inline-start.
 */

// A single tuple type (rather than a union) so `CanvasKit.Color(...rgb)` spreads
// cleanly; the alpha channel is optional and defaults to opaque in CanvasKit.
type RGB = [number, number, number, number?];

export interface OGFontStyle {
  color?: RGB;
  size?: number;
  lineHeight?: number;
  weight?:
    | "Normal"
    | "Bold"
    | "SemiBold"
    | "Medium"
    | "Light"
    | "Thin"
    | "Black";
  families?: string[];
}

export interface OGImageOptions {
  title: string;
  description?: string;
  /**
   * Accepted for call-site compatibility (and parity with astro-og-canvas), but
   * not drawn — the rendered image only shows the logo, title and description.
   */
  siteName?: string;
  dir?: "ltr" | "rtl";
  bgGradient?: RGB[];
  border?: {
    color?: RGB;
    width?: number;
    side?: "block-start" | "block-end" | "inline-start" | "inline-end";
  };
  padding?: number;
  logo?: { path: string; size?: [number] | [number, number] };
  font?: { title?: OGFontStyle; description?: OGFontStyle };
  fonts?: string[];
  format?: "PNG" | "JPEG" | "WEBP";
  quality?: number;
  /** Directory for the on-disk render cache, or `false` to disable. */
  cacheDir?: string | false;
}

const [WIDTH, HEIGHT] = [1200, 630];

/** A line as `[x0, y0, x1, y1]`, spreadable into `canvas.drawLine`. */
type Line = [number, number, number, number];

const edges: Record<"block-start" | "block-end" | "left" | "right", Line> = {
  "block-start": [0, 0, WIDTH, 0],
  "block-end": [0, HEIGHT, WIDTH, HEIGHT],
  left: [0, 0, 0, HEIGHT],
  right: [WIDTH, 0, WIDTH, HEIGHT],
};

const require = createRequire(import.meta.url);

// --- CanvasKit singleton -----------------------------------------------------

let canvasKitPromise: Promise<CanvasKitType> | undefined;
function getCanvasKit(): Promise<CanvasKitType> {
  if (!canvasKitPromise) {
    canvasKitPromise = import("canvaskit-wasm/full").then(({ default: init }) =>
      init({
        locateFile: (file: string) =>
          require.resolve(`canvaskit-wasm/bin/full/${file}`),
      }),
    );
  }
  return canvasKitPromise;
}

// --- Font + image loading (cached across renders) ----------------------------

const fontCache = new Map<string, ArrayBuffer | undefined>();
let fontMgr: FontMgr | null = null;
let fontMgrKey = "";

async function getFontManager(fontUrls: string[]): Promise<FontMgr | null> {
  for (const url of fontUrls) {
    if (fontCache.has(url)) continue;
    if (/^https?:\/\//.test(url)) {
      const response = await fetch(url);
      if (response.ok) {
        fontCache.set(url, await response.arrayBuffer());
      } else {
        fontCache.set(url, undefined);
        console.error(
          "[og-image]",
          response.status,
          response.statusText,
          "—",
          url,
        );
      }
    } else {
      const file = await fs.readFile(url);
      fontCache.set(
        url,
        file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
      );
    }
  }

  const key = fontUrls.join("|");
  if (fontMgr && fontMgrKey === key) return fontMgr;

  const CanvasKit = await getCanvasKit();
  const data = fontUrls
    .map((url) => fontCache.get(url))
    .filter((b): b is ArrayBuffer => !!b);
  if (data.length === 0) return null;
  fontMgr = CanvasKit.FontMgr.FromData(...data);
  fontMgrKey = key;
  return fontMgr;
}

const imageCache = new Map<string, Buffer>();
async function loadImage(p: string): Promise<Buffer> {
  let buf = imageCache.get(p);
  if (!buf) {
    buf = await fs.readFile(p);
    imageCache.set(p, buf);
  }
  return buf;
}

// --- On-disk render cache ----------------------------------------------------

const ensuredDirs = new Set<string>();
async function ensureDir(dir: string) {
  if (ensuredDirs.has(dir)) return;
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
  ensuredDirs.add(dir);
}

// --- Renderer ----------------------------------------------------------------

const defaults = {
  border: {
    color: [255, 255, 255] as RGB,
    width: 0,
    side: "inline-start" as const,
  },
  font: {
    title: {
      color: [255, 255, 255] as RGB,
      size: 70,
      lineHeight: 1,
      weight: "Normal" as const,
      families: ["Noto Sans"],
    },
    description: {
      color: [255, 255, 255] as RGB,
      size: 40,
      lineHeight: 1.3,
      weight: "Normal" as const,
      families: ["Noto Sans"],
    },
  },
};

export async function generateOgImage(
  options: OGImageOptions,
): Promise<Buffer> {
  const {
    title,
    description = "",
    dir = "ltr",
    bgGradient = [[0, 0, 0]],
    padding = 60,
    logo,
    fonts = [
      "https://api.fontsource.org/v1/fonts/noto-sans/latin-400-normal.ttf",
    ],
    format = "PNG",
    quality = 90,
    cacheDir = "./node_modules/.cache/og-image",
  } = options;

  const border = { ...defaults.border, ...options.border };
  const font = {
    title: { ...defaults.font.title, ...options.font?.title },
    description: { ...defaults.font.description, ...options.font?.description },
  };

  const loadedLogo = logo && (await loadImage(logo.path));

  // Cache lookup keyed by a hash of every input that affects the output.
  let cacheFilePath: string | undefined;
  if (cacheDir) {
    const hash = createHash("sha1")
      .update(
        JSON.stringify({
          title,
          description,
          dir,
          bgGradient,
          border,
          padding,
          logo,
          font,
          fonts,
          format,
          quality,
        }),
      )
      .update(loadedLogo ?? Buffer.alloc(0))
      .digest("hex")
      .slice(0, 16);
    cacheFilePath = path.join(cacheDir, `${hash}.${format.toLowerCase()}`);
    await ensureDir(path.dirname(cacheFilePath));
    const cached = await fs.readFile(cacheFilePath).catch(() => undefined);
    if (cached) return cached;
  }

  const CanvasKit = await getCanvasKit();
  const fontMgrInstance = await getFontManager(fonts);

  const isRtl = dir === "rtl";
  const margin = {
    "block-start": padding,
    "block-end": padding,
    "inline-start": padding,
    "inline-end": padding,
  };
  margin[border.side] += border.width;

  const surface = CanvasKit.MakeSurface(WIDTH, HEIGHT)!;
  const canvas = surface.getCanvas();

  // Background gradient (top → bottom).
  const bgPaint = new CanvasKit.Paint();
  bgPaint.setShader(
    CanvasKit.Shader.MakeLinearGradient(
      [0, 0],
      [0, HEIGHT],
      bgGradient.map((rgb) => CanvasKit.Color(...rgb)),
      null,
      CanvasKit.TileMode.Clamp,
    ),
  );
  canvas.drawRect(CanvasKit.XYWHRect(0, 0, WIDTH, HEIGHT), bgPaint);

  // Accent border drawn as a line along the chosen edge.
  if (border.width) {
    const borderPaint = new CanvasKit.Paint();
    borderPaint.setStyle(CanvasKit.PaintStyle.Stroke);
    borderPaint.setColor(CanvasKit.Color(...border.color));
    borderPaint.setStrokeWidth(border.width * 2);
    const borders = {
      "block-start": edges["block-start"],
      "block-end": edges["block-end"],
      "inline-start": isRtl ? edges.right : edges.left,
      "inline-end": isRtl ? edges.left : edges.right,
    };
    canvas.drawLine(...borders[border.side], borderPaint);
  }

  // Logo in the top inline-start corner, scaled via a matrix image filter.
  let logoHeight = 0;
  if (logo && loadedLogo) {
    const img = CanvasKit.MakeImageFromEncoded(loadedLogo);
    if (img) {
      const logoW = img.width();
      const logoH = img.height();
      const targetW = logo.size?.[0] ?? logoW;
      const targetH = logo.size?.[1] ?? (targetW / logoW) * logoH;
      const xRatio = targetW / logoW;
      const yRatio = targetH / logoH;
      logoHeight = targetH;
      const imagePaint = new CanvasKit.Paint();
      imagePaint.setImageFilter(
        CanvasKit.ImageFilter.MakeMatrixTransform(
          CanvasKit.Matrix.scaled(xRatio, yRatio),
          { filter: CanvasKit.FilterMode.Linear },
          null,
        ),
      );
      const imageLeft = isRtl
        ? (1 / xRatio) * (WIDTH - margin["inline-start"]) - logoW
        : (1 / xRatio) * margin["inline-start"];
      canvas.drawImage(
        img,
        imageLeft,
        (1 / yRatio) * margin["block-start"],
        imagePaint,
      );
    }
  }

  // Title + description paragraph.
  if (fontMgrInstance) {
    const textStyle = (f: Required<OGFontStyle>) => ({
      color: CanvasKit.Color(...f.color),
      fontFamilies: f.families,
      fontSize: f.size,
      fontStyle: { weight: CanvasKit.FontWeight[f.weight] },
      heightMultiplier: f.lineHeight,
    });

    const paragraphStyle = new CanvasKit.ParagraphStyle({
      textAlign: isRtl ? CanvasKit.TextAlign.Right : CanvasKit.TextAlign.Left,
      textStyle: textStyle(font.title as Required<OGFontStyle>),
      textDirection: isRtl
        ? CanvasKit.TextDirection.RTL
        : CanvasKit.TextDirection.LTR,
    });
    const builder = CanvasKit.ParagraphBuilder.Make(
      paragraphStyle,
      fontMgrInstance,
    );
    builder.addText(title);
    builder.pushStyle(
      new CanvasKit.TextStyle({ fontSize: padding / 3, heightMultiplier: 1 }),
    );
    builder.addText("\n\n");
    builder.pushStyle(
      new CanvasKit.TextStyle(
        textStyle(font.description as Required<OGFontStyle>),
      ),
    );
    builder.addText(description);

    const para = builder.build();
    const paraWidth =
      WIDTH - margin["inline-start"] - margin["inline-end"] - padding;
    para.layout(paraWidth);
    const paraLeft = isRtl
      ? WIDTH - margin["inline-start"] - para.getMaxWidth()
      : margin["inline-start"];
    const minTop =
      margin["block-start"] + logoHeight + (logoHeight ? padding : 0);
    const maxTop = minTop + (logoHeight ? padding : 0);
    const naturalTop = HEIGHT - margin["block-end"] - para.getHeight();
    const paraTop = Math.max(minTop, Math.min(maxTop, naturalTop));
    canvas.drawParagraph(para, paraLeft, paraTop);
  }

  const snapshot = surface.makeImageSnapshot();
  const bytes =
    snapshot.encodeToBytes(CanvasKit.ImageFormat[format], quality) ||
    new Uint8Array();
  surface.dispose();

  const buffer = Buffer.from(bytes);
  if (cacheFilePath) await fs.writeFile(cacheFilePath, buffer).catch(() => {});
  return buffer;
}

// --- Route helper (mirrors astro-og-canvas's OGImageRoute) --------------------

type PageEntry = Record<string, unknown>;

function defaultSlug(pagePath: string, format: string): string {
  const extension = "." + format.toLowerCase();
  let slug = pagePath.replace(/^\/src\/pages\//, "");
  slug = slug.replace(/\.[^.]*$/, "") + extension;
  slug = slug.replace(/\/index\.(png|jpeg|webp)$/, extension);
  return slug;
}

export interface OGImageRouteOptions<P extends PageEntry = PageEntry> {
  param: string;
  pages: Record<string, P>;
  getImageOptions: (
    path: string,
    page: P,
  ) => OGImageOptions | Promise<OGImageOptions>;
  getSlug?: (path: string, page: P, imageOptions: OGImageOptions) => string;
}

const CONTENT_TYPE: Record<NonNullable<OGImageOptions["format"]>, string> = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
};

export async function OGImageRoute<P extends PageEntry = PageEntry>(
  opts: OGImageRouteOptions<P>,
) {
  const { param, pages, getImageOptions, getSlug } = opts;

  const entries = await Promise.all(
    Object.entries(pages).map(async ([pagePath, page]) => {
      const imageOptions = await getImageOptions(pagePath, page);
      const slug = getSlug
        ? getSlug(pagePath, page, imageOptions)
        : defaultSlug(pagePath, imageOptions.format ?? "PNG");
      return { slug, imageOptions };
    }),
  );

  const paths = entries.map(({ slug, imageOptions }) => ({
    params: { [param]: slug },
    props: { imageOptions },
  }));

  return {
    getStaticPaths: () => paths,
    GET: async ({ props }: { props: { imageOptions: OGImageOptions } }) => {
      const { imageOptions } = props;
      const body = await generateOgImage(imageOptions);
      return new Response(body as BodyInit, {
        headers: { "Content-Type": CONTENT_TYPE[imageOptions.format ?? "PNG"] },
      });
    },
  };
}
