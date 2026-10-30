import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default tseslint.config(
  // Build output, generated types, static assets and vendored agent skills
  // (.agents/, installed from skills-lock.json) are never linted.
  {
    ignores: ["dist/", ".astro/", "public/", "pnpm-lock.yaml", ".agents/"],
  },

  // Base JS + TypeScript rules. typescript-eslint registers the
  // `@typescript-eslint` plugin (used both here and for .astro frontmatter).
  eslint.configs.recommended,
  tseslint.configs.recommended,

  // Astro component rules (also lints the frontmatter + client <script>).
  ...astro.configs.recommended,

  // Shared language options: this project runs in both Node (build/scripts,
  // Astro frontmatter) and the browser (client <script> blocks).
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Allow intentionally-unused identifiers when prefixed with `_`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
