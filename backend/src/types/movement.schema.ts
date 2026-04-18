import { z } from 'zod';

export const MovementCreateSchema = z.object({
  currencyId: z.coerce.number().positive(),
  currencyType: z.string().min(3).max(10),
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(20),
  voucherNo: z.coerce.number().int(),
  receiptNo: z.coerce.number().int(),
  debtorId: z.coerce.number().positive(),
  amountTaking: z.coerce.number().positive(),
  daneId: z.coerce.number().positive(),
  amountPay: z.coerce.number().positive(),
  note: z.string().optional().default(''),
})

export const MovementUpdateSchema = z.object({
  currencyId: z.coerce.number().positive().optional(),
  currencyType: z.string().min(3).max(10).optional(),
  typeId: z.coerce.number().positive().optional(),
  type: z.string().min(2).max(20).optional(),
  debtorId: z.coerce.number().positive().optional(),
  receiptNo: z.coerce.number().int(),
  amountTaking: z.coerce.number().positive().optional(),
  daneId: z.coerce.number().positive().optional(),
  amountPay: z.coerce.number().positive().optional(),
  note: z.string().optional(),
})

export const movementQuerySchema = z.object({
  accountId: z.coerce.number().int().positive(),
  currencyId: z.coerce.number().int().positive(),
  fiscalYear: z.coerce.number().int().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'voucherNo', 'amountTaking', 'amountPay'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const generalBalanceQuerySchema = z.object({
  currencyId: z.coerce.number().int(),
  fiscalYear: z.coerce.number().int().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  searchValue: z.string().optional(),
  includeZero: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['accountId', 'accountName']).default('accountName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// export const querySchema = z
//   .object({
//     page: z.coerce.number().int().positive().default(1),
//     parPage: z.coerce.number().int().positive().default(10),
//     searchValue: z.string().optional(),
//     sortBy: z
//       .enum(['createdAt', 'totalAmount', 'voucherNo'])
//       .default('createdAt'),
//     sortOrder: z.enum(['asc', 'desc']).default('asc'),
//     currencyId: z
//       .string()
//       .transform(Number)
//       .refine((n) => n > 0, 'Invalid currency ID')
//       .optional(),
//     accountId: z
//       .string()
//       .transform(Number)
//       .refine((n) => n > 0, 'Invalid account ID')
//       .optional(),
//     fromDate: z.coerce.date().optional(),
//     toDate: z.coerce.date().optional(),
//   })
//   .refine(
//     (data) => {
//       // If either date is missing, validation passes
//       if (!data.fromDate || !data.toDate) return true;
      
//       // Compare dates without time
//       const fromDateOnly = new Date(data.fromDate);
//       fromDateOnly.setUTCHours(0, 0, 0, 0);
      
//       const toDateOnly = new Date(data.toDate);
//       toDateOnly.setUTCHours(0, 0, 0, 0);
      
//       // Allow same day or fromDate before toDate
//       return fromDateOnly <= toDateOnly;
//     },
//     {
//       message: 'fromDate must be on or before toDate',
//       path: ['fromDate'],
//     }
//   )

export const balanceQuerySchema = z
  .object({
    currencyId: z
      .string()
      .transform(Number)
      .refine((n) => n > 0, 'Invalid currency ID'),
    accountIds: z
      .string() // comma-separated list
      .transform((str) =>
        str
          .split(',')
          .map((id) => Number(id))
          .filter((n) => n > 0)
      )
      .refine((arr) => arr.length > 0, 'No valid account IDs'),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => !(data.fromDate && data.toDate) || data.fromDate <= data.toDate,
    {
      message: 'fromDate must be before or equal to toDate',
      path: ['fromDate'],
    }
  )
