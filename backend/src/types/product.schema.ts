import { z } from 'zod'
export const ProductCreateSchema = z.object({
  productCode: z.string(),
  description: z.string(),
  warehouse: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  categoryId: z.coerce.number().int(),
  subCategoryId: z.coerce.number().int().optional().nullable(),
  unitId: z.coerce.number().int().optional().nullable(),
  colors: z.string().optional().nullable(),
  quantity: z.coerce.number(),
  buyPrice: z.coerce.number(),
  salePrice: z.coerce.number(),
  discount: z.coerce.number().optional().default(0),
  totalCost: z.coerce.number(),
  reorderQuantity: z.coerce.number().optional().nullable(),
  expireDate: z
    .string()
    .refine((value) => !isNaN(Date.parse(value)), {
      message:
        'Invalid date format, use ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)',
    })
    .transform((value) => new Date(value))
    .optional()
    .nullable(),
  productStatus: z.string().default('active').optional(),
  accountId: z.coerce.number().int().optional().nullable(),
  
})

export const ProductUpdateSchema = z.object({
  productCode: z.string().optional(),
  description: z.string().optional(),
  warehouse: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().optional(),
  subCategoryId: z.coerce.number().int().optional().nullable(),
  unitId: z.coerce.number().int().optional().nullable(),
  colors: z.string().optional().nullable(),
  quantity: z.coerce.number().optional(),
  buyPrice: z.coerce.number().optional(),
  salePrice: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  totalCost: z.coerce.number().optional(),
  reorderQuantity: z.coerce.number().optional().nullable(),
  expireDate: z.coerce.date().optional().nullable(),
  productStatus: z.string().optional(),
  accountId: z.coerce.number().int().optional().nullable(),

})

export const ProductQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  parPage: z.string().optional().default('20').transform(Number),
  sortBy: z
    .enum(['createdAt', 'productCode', 'salePrice', 'quantity'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  searchValue: z.string().optional(),
  categoryId: z.string().optional().pipe(z.coerce.number().optional()),
  minPrice: z.string().optional().pipe(z.coerce.number().optional()),
  maxPrice: z.string().optional().pipe(z.coerce.number().optional()),
  status: z.enum(['active', 'inactive']).optional(),
  fields: z.string().optional(),
})
