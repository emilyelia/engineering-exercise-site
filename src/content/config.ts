import { defineCollection, z } from 'astro:content';

/**
 * "videos" collection — one markdown file per video write-up.
 * The file slug (filename without .md) must equal the YouTube video ID.
 * Example: src/content/videos/dQw4w9WgXcQ.md
 *
 * Managed via Decap CMS at /admin.
 */
const videos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    videoId: z.string(),
    description: z.string().optional(), // Used as SEO meta description
    publishedAt: z.coerce.date().optional(),
  }),
});

/**
 * "blog" collection — one markdown file per blog post.
 * Managed via Decap CMS at /admin.
 */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { videos, blog };
