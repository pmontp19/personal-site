// Neteja el cos cru d'un apunt (.md/.mdx) per a mirrors de text pla:
// frontmatter, imports d'MDX i components fora.
export const cleanBody = (content: string): string => {
  let cleaned = content.replace(/---\n([\s\S]*?)\n---/, "");
  // delimitadors de frontmatter solts
  cleaned = cleaned.replace(/^\s*---\s*$/gm, "");
  // imports d'MDX
  cleaned = cleaned.replace(/import\s+.*?from\s+['"].*?['"]\s*;?\s*/g, "");
  // components MDX/HTML
  cleaned = cleaned.replace(/<\s*\/?\s*\w+[^>]*\/?>/g, "");
  // línies buides múltiples
  cleaned = cleaned.replace(/\n{2,}/g, "\n");
  return cleaned.trim();
};
