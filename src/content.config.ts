import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      lastUpdated: z.coerce.date().optional(),
      draft: z.boolean().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      // figura Hairline destacada (public/hairline/<name>.js) i la seva captura per a l'OG
      hairline: z.object({ name: z.string(), alt: z.string() }).optional(),
    }),
});

// font única de l'experiència: la pàgina /experiencia i els CV (ca/en/es)
const experienceLang = z.object({
  role: z.string(),
  location: z.string(),
  bullets: z.array(z.string()),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experience" }),
  schema: z.object({
    company: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    // el CV mostra només l'any (dates de mes aproximades)
    yearOnly: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    ca: experienceLang,
    en: experienceLang,
    es: experienceLang,
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
    year: z.number(),
    order: z.number(),
    status: z.string().optional(),
    press: z
      .array(z.object({ name: z.string(), url: z.string().url() }))
      .optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const cv = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cv" }),
  schema: z.object({}),
});

export const collections = {
  blog,
  experience,
  projects,
  cv,
};
