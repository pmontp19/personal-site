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
    }),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/experience" }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    logo: z.string().optional(),
  }),
});

const cv = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cv" }),
  schema: z.object({}),
});

export const collections = {
  blog,
  experience,
  cv,
};
