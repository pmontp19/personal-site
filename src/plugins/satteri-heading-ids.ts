import { defineHastPlugin } from "satteri";

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
// Matches a trailing `{#custom-id}` at the end of a heading's text.
const CUSTOM_ID_RE = /^(.*?)[ \t]*\{#([A-Za-z0-9_-]+)\}[ \t]*$/;

/**
 * Sätteri hast plugin reproducing `remark-heading-id`: a trailing `{#id}` in a
 * heading sets that heading's `id` and is stripped from the visible text.
 *
 * Runs before Sätteri's built-in heading-ids plugin, which keeps an existing
 * `id` and otherwise falls back to slugging the text — so headings without a
 * `{#id}` still get an auto-generated slug.
 */
export default function headingIds() {
  return defineHastPlugin({
    name: "custom-heading-ids",
    text(node, ctx) {
      const parent = ctx.parent(node);
      if (
        !parent ||
        parent.type !== "element" ||
        !HEADING_TAGS.has(parent.tagName)
      )
        return;

      const match = CUSTOM_ID_RE.exec(node.value);
      if (!match) return;

      ctx.setProperty(parent, "id", match[2]);
      ctx.setProperty(node, "value", match[1]);
    },
  });
}
