import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getSlug } from "../utils/date";

// Índex concís segons llmstxt.org: fets, pàgines clau i llista d'apunts.
// El contingut complet viu a /llms-full.txt i /blog/<slug>.md.
const SITE = "https://peremontpeo.dev";

export const GET: APIRoute = async () => {
  try {
    const posts = (
      await getCollection("blog", ({ data }) => data.draft !== true)
    ).sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );

    const lines = [
      "# Pere Montpeó",
      "",
      "> Enginyer de programari especialitzat en tot i en res. Actualment, fent que els ordinadors facin coses sols. Si no estic programant, segurament em trobaràs sobre la bicicleta, a la cuina o llegint.",
      "",
      "El lloc és estàtic i no depèn de JavaScript: tot el contingut és a l'HTML inicial.",
      "",
      "## Pàgines",
      "",
      `- [Inici](${SITE}/): presentació, estat actual, darrer apunt, experiència i contacte`,
      `- [Apunts](${SITE}/blog/): bloc sobre enginyeria de programari i IA, en català`,
      `- [Experiència](${SITE}/experiencia/): trajectòria professional`,
      `- [Projectes](${SITE}/projectes/): projectes personals`,
      `- [Contacte](${SITE}/contact/): com trobar-me`,
      `- [CV en català](${SITE}/cv/ca/): currículum complet`,
      `- [CV in English](${SITE}/cv/en/): full resume`,
      `- [CV en español](${SITE}/cv/es/): currículum completo`,
      `- [RSS](${SITE}/feed.xml): canal de novetats del bloc`,
      `- [Text complet](${SITE}/llms-full.txt): tots els apunts sencers en text pla`,
      "",
      "## Apunts",
      "",
      ...posts.map(
        (p) =>
          `- [${p.data.title}](${SITE}/blog/${getSlug(p.id)}/): ${p.data.description} (${p.data.date.toISOString().slice(0, 10)})`,
      ),
      "",
    ];

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating LLM index:", error);
    return new Response("Internal Server Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
};
