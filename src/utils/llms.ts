// Neteja el cos cru d'un apunt (.md/.mdx) per a mirrors de text pla.
// El body de les col·leccions d'Astro ja ve sense frontmatter.
// Només es toquen les línies fora de blocs de codi delimitats (```):
// dins d'un fence, els exemples (tags VTT, XML, imports...) són contingut.
export const cleanBody = (content: string): string => {
  let inFence = false;
  const lines = content.split("\n").map((line) => {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    // imports d'MDX
    if (/^import\s/.test(line)) return "";
    // components MDX (inicial majúscula): <Note>..</Note>, <TincMemFigure .. />
    return line.replace(/<\/?[A-Z][A-Za-z0-9]*[^<>]*>/g, "");
  });
  // línies buides múltiples
  return lines
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

export const SITE: string = import.meta.env.SITE || "https://peremontpeo.dev";
