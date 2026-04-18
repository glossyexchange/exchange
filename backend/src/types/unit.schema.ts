import { z } from 'zod'

// Zod Schemas
export const UnitCreateSchema = z.object({
  unitName: z.string().min(2).max(50),
})

export const UnitUpdateSchema = z
  .object({
    unitName: z.string().min(2).max(50).optional(),
  })
  .refine((data) => !!data.unitName, {
    message: 'At least one field must be provided',
  })
