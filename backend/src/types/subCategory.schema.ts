import { z } from 'zod'
export const SubCategoryCreateSchema = z
  .object({
    name: z.string().min(2).max(50),
    categoryId: z.number().int().positive(),
  })
  .transform((data) => ({
    name: data.name,
    categoryId: data.categoryId,
  }))

export const SubCategoryUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),
    categoryId: z
      .number()
      .int('Category ID must be an integer')
      .positive('Category ID must be positive')
      .optional(),
  })
  .refine(
    (data) => !!data.name || !!data.categoryId,
    'At least one field (name or categoryId) must be provided'
  )

export const SubCategoryIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid SubCategory ID'),
})
