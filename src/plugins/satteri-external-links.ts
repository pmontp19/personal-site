import { defineHastPlugin } from "satteri";
import type { Element } from "hast";

const SITE_HOST = "peremontpeo.dev";

/**
 * Sätteri hast plugin: flags external links with `target`/`rel`, an
 * `external-link` class, and an appended icon. Replaces the previous
 * unist-util-visit based rehype plugin now that Astro 7 uses Sätteri.
 */
export default function externalLinks() {
  return defineHastPlugin({
    name: "external-links",
    element: {
      filter: ["a"],
      visit(node: Element, ctx) {
        const href = node.properties?.href;
        if (typeof href !== "string") return;

        // Skip anchors, mailto, and tel links
        if (
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        )
          return;

        let url: URL;
        try {
          url = new URL(href, `https://${SITE_HOST}`);
        } catch {
          return; // Invalid URL, skip
        }

        const isExternal =
          url.hostname !== SITE_HOST && !url.hostname.endsWith(`.${SITE_HOST}`);
        if (!isExternal) return;

        ctx.setProperty(node, "target", "_blank");
        ctx.setProperty(node, "rel", "noopener noreferrer");

        const existing = node.properties?.className;
        const className = Array.isArray(existing)
          ? [...existing, "external-link"]
          : existing
            ? [String(existing), "external-link"]
            : ["external-link"];
        ctx.setProperty(node, "className", className);

        ctx.appendChild(node, {
          type: "element",
          tagName: "span",
          properties: { className: ["external-link-icon-wrapper"] },
          children: [
            {
              type: "element",
              tagName: "svg",
              properties: {
                xmlns: "http://www.w3.org/2000/svg",
                width: "1em",
                height: "1em",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: ["external-link-icon"],
                "aria-hidden": "true",
              },
              children: [
                {
                  type: "element",
                  tagName: "path",
                  properties: {
                    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
                  },
                  children: [],
                },
                {
                  type: "element",
                  tagName: "polyline",
                  properties: { points: "15 3 21 3 21 9" },
                  children: [],
                },
                {
                  type: "element",
                  tagName: "line",
                  properties: { x1: "10", y1: "14", x2: "21", y2: "3" },
                  children: [],
                },
              ],
            },
          ],
        });
      },
    },
  });
}
