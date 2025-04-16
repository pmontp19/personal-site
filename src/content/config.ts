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

// Define a new collection for work experiences
const experience = defineCollection({
	type: 'content', // Ensure this is content, not data
	schema: z.object({
		company: z.string(),
		role: z.string(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date().optional(), // Optional if it's the current job
		description: z.string().optional(), // A brief description of the role/achievements
		tags: z.array(z.string()).optional(), // Optional tags like skills or technologies
	}),
});


export const collections = {
	blog,
	experience, // Add the new collection here
};