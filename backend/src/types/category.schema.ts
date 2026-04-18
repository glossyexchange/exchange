import { z } from 'zod'

export const CategoryCreateSchema = z
  .object({
    Name: z.string().min(2).max(100),
    // image: z.string().optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/), // Basic slug validation
    status: z.enum(['active', 'inactive']).optional().default('inactive'),
  })
  .transform((data) => ({
    ...data,
    // Ensure slug is lowercase and trimmed
    slug: data.slug.toLowerCase().trim(),
  }))

  export const CategoryUpdateSchema = z.object({
    Name: z.string().min(2),
    slug: z.string(),
    status: z.enum(['active', 'inactive'])
  }).strict()

  export const CategoryIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid ID format'),
})
