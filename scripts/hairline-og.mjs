// Captura en repòs de cada figura Hairline dels posts, per a la imatge OG.
// Ús: pnpm hairline:og  → src/assets/hairline/<name>.png
// Cal tornar-ho a executar quan canvia una figura de public/hairline/.
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const BLOG = "src/content/blog";
const OUT = "src/assets/hairline";
// colors de la OG (src/pages/api/og-image/[slug].ts): fons #161b22, ambre
const PALETTE = {
  plate: "#161b22",
  hi: "rgb(255 188 13)",
  edge: "color-mix(in oklab, #fff 55%, #161b22)",
  mid: "color-mix(in oklab, #fff 32%, #161b22)",
  lo: "color-mix(in oklab, #fff 16%, #161b22)",
};

const names = new Set();
for (const f of await fs.readdir(BLOG)) {
  const m = (await fs.readFile(path.join(BLOG, f), "utf8")).match(
    /^hairline:\n\s+name:\s*(\S+)/m,
  );
  if (m) names.add(m[1]);
}

const js = (f) => fs.readFile(path.join("public/hairline", f), "utf8");
const [kernel, host] = await Promise.all([js("kernel.js"), js("host.js")]);
const vars =
  Object.entries(PALETTE)
    .map(([k, v]) => `--hairline-${k}:${v};`)
    .join("") + "--hairline-stroke:1.6;";

const browser = await chromium
  .launch({ channel: "chrome" })
  .catch(() => chromium.launch());
const page = await browser.newPage({
  viewport: { width: 640, height: 512 },
  deviceScaleFactor: 2,
});
await page.emulateMedia({ reducedMotion: "reduce" });
await fs.mkdir(OUT, { recursive: true });

for (const name of names) {
  const figure = await js(`${name}.js`);
  await page.setContent(
    `<body style="margin:0;background:${PALETTE.plate}">
      <figure style="margin:0;width:640px">
        <span class="hl-read"></span>
        <div class="hl-stage" style="${vars}"></div>
        <script>${kernel}</script><script>${host}</script><script>${figure}</script>
      </figure></body>`,
  );
  await page.waitForTimeout(1500);
  // retalla el viewBox al dibuix, amb marge
  await page.evaluate(() => {
    const svg = document.querySelector(".hl-stage svg");
    const b = svg.getBBox(),
      m = 8;
    svg.setAttribute(
      "viewBox",
      `${b.x - m} ${b.y - m} ${b.width + 2 * m} ${b.height + 2 * m}`,
    );
    const stage = svg.parentElement;
    stage.style.aspectRatio = `${b.width + 2 * m} / ${b.height + 2 * m}`;
  });
  const file = path.join(OUT, `${name}.png`);
  await page.locator(".hl-stage").screenshot({ path: file });
  console.log("captura", file);
}
await browser.close();
