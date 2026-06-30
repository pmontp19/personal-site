// Ambient declarations for packages that ship no TypeScript types.

// `htmldiff-js` ships only a minified bundle with no `.d.ts`. The script in
// scripts/generate-git-history.ts reads its default export's `execute` method.
declare module "htmldiff-js" {
  const htmldiff: {
    execute(oldHtml: string, newHtml: string): string;
  };
  export default htmldiff;
}

// `@fontsource/*` packages are imported only for their CSS side effects and
// expose no module shape.
declare module "@fontsource/geist-sans";
declare module "@fontsource/geist-mono";
