import z from 'zod'
export const ReturnProductCreateSchema = z.object({
  productCode: z.string(),
  quantity: z.number().positive(),
  salePrice: z.number().positive(),
  description: z.string().optional().default(''), // Add description
  unitId: z.number().optional(),
  accountId: z.number().optional(),
})

export const ReturnProductUpdateSchema = z.object({
  quantity: z.number().positive(),
  salePrice: z.number().positive(),
  description: z.string().optional(),
  unitId: z.number().optional(),
  accountId: z.number().optional(),
})

export const ReturnProductQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform(Number)
      .refine((n) => n > 0, 'Page must be greater than 0'),
    parPage: z
      .string()
      .optional()
      .default('20')
      .transform(Number)
      .refine(
        (n) => n > 0 && n <= 100,
        'Results per page must be between 1-100'
      ),
    sortBy: z
      .enum(['createdAt', 'voucherNo', 'productCode', 'salePrice', 'quantity'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    searchValue: z.string().optional(),
    productCode: z.string().optional(),
    accountId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    unitId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    startDate: z
      .string()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        'Invalid start date format'
      )
      .optional(),
    endDate: z
      .string()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        'Invalid end date format'
      )
      .optional(),
    fields: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : undefined)),
  })
  .refine(
    (data) => {
      if (
        data.startDate &&
        data.endDate &&
        new Date(data.startDate) > new Date(data.endDate)
      ) {
        return false
      }
      return true
    },
    {
      message: 'Start date must be before end date',
      path: ['dateRange'],
    }
  )

  export const ReturnProductVoucherSchema = z.object({
    voucherNo: z.string().transform(Number).refine(
      n => n > 0 && Number.isInteger(n),
      'Voucher number must be a positive integer'
    )
  })

  export const DeleteReturnProductSchema = z.object({
    voucherNo: z.string().transform(Number).refine(
      n => n > 0 && Number.isInteger(n),
      'Voucher number must be a positive integer'
    )
  })
