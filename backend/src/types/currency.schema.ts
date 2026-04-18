import { z } from 'zod';

// Zod Schemas
export const CurrencyCreateSchema = z.object({
  currencyId: z.coerce.number().int().positive(),
  currencySymbol: z.string().min(1).max(10),
  currency: z.string().min(2).max(20),
  CurrencyPrice: z.coerce.number().min(0).optional().default(0),
  currencyAction: z.enum(['MULTIPLY', 'DIVIDE']).default('MULTIPLY'),
})

export const CurrencyUpdateSchema = z
  .object({

    currencyId: z.coerce.number().int().positive().optional(),
    currencySymbol: z.string().min(1).max(10).optional(),
    currency: z.string().min(2).max(20).optional(),
    CurrencyPrice: z.coerce.number().min(0).optional(),
    currencyAction: z.enum(['MULTIPLY', 'DIVIDE']).optional(),
  })
  .refine(
    (data) => 
      data.currencyId !== undefined || 
      data.currency !== undefined || 
      data.currencySymbol !== undefined ||
      data.CurrencyPrice !== undefined ||
      data.currencyAction !== undefined,
    {
      message: 'At least one field must be provided for update',
    }
  )

export const CurrencyDeleteSchema = z.object({
  id: z.coerce.number().int().positive({
    message: 'ID must be a positive integer',
  }),
})

export const CurrencyGetSchema = z.object({
    currencyId: z.coerce.number().int().positive({
      message: "Currency ID must be a positive integer"
    })
  });
