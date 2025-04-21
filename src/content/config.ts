import { defineCollection, z } from "astro:content";

const blog = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        draft: z.boolean().optional()
    }),
});

const experience = defineCollection({
	type: 'content',
	schema: z.object({
		company: z.string(),
		role: z.string(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date().optional(),
		description: z.string().optional(), 
		tags: z.array(z.string()).optional(),
	}),
});


export const collections = {
	blog,
	experience, 
};