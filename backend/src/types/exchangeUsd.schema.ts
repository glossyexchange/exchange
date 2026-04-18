// customerOrder.schema.ts
import { format, parseISO } from 'date-fns';
import z from 'zod';

export const ExchangeUSDCreateSchema = z.object({
  exchangeTypeId: z.coerce.number().int(),
   exchangeType: z.string().min(1, "Exchange type is required"),
  accountId: z.coerce.number().int(),
  amountUsd: z.coerce.number().positive(),
price: z.coerce.number().positive(),
amountIqd: z.coerce.number().positive(),
createdAt: z.coerce.date(),
note: z.string().optional().default(''),
adminId: z.coerce.number().int(),

currencyId: z.coerce.number().int(),
  currencyType: z.string().min(2).max(10),
  // voucherNo: z.coerce.number().int(),
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
  ExchangeUsd_ID: z.coerce.number().positive(),
  Hmula_ID: z.coerce.number().positive(),
})

export const ExchangeUSDUpdateSchema = ExchangeUSDCreateSchema.partial().extend({
  id: z.coerce.number().int(),
  voucherNo: z.coerce.number().int(),
});

// export const ExchangeUSDUpdateSchema  = z.object({
//   id: z.coerce.number().positive(),
//   voucherNo: z.coerce.number().positive(),
//   exchangeTypeId: z.coerce.number().int().optional(),
//    exchangeType: z.string().min(1, "Exchange type is required"),
//   accountId: z.coerce.number().int(),
//   amountUsd: z.coerce.number().positive().optional(),
// price: z.coerce.number().positive().optional(),
// amountIqd: z.coerce.number().positive().optional(),
// createdAt: z.coerce.date().optional(),
// note: z.string().optional().default('').optional(),
// adminId: z.coerce.number().int().optional(),

// currencyId: z.coerce.number().int().optional(),
//   currencyType: z.string().min(2).max(10).optional(),
//   // voucherNo: z.coerce.number().int(),
//   typeId: z.coerce.number().positive(),
//   type: z.string().min(2).max(60),
//   ExchangeUsd_ID: z.coerce.number().positive(),
//   Hmula_ID: z.coerce.number().positive(),
// })

export const CustomerLastPayOrderUpdateSchema = z.object({
  lastPayDate: z.coerce.date(),
})

export const DeleteExchangeUsdSchema = z.object({
  voucherNo: z.coerce.number().positive(),
  typeId: z.coerce.number().positive(),
});

export const ExchangeUSDQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  exchangeTypeId:z.coerce.number().int().optional(),
  sortBy: z
    .enum(['createdAt', 'amountUsd', 'voucherNo'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  accountId: z.coerce.number().int().optional(),
  fromDate: z.coerce
    .string()
    .transform((val) => {
      try {
        // Handle both yyyy-MM-dd and ISO formats
        const date = val.includes('T') ? parseISO(val) : new Date(val)
        return format(date, 'yyyy-MM-dd')
      } catch {
        return val // Let refinement catch invalid format
      }
    })
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Invalid fromDate format, expected yyyy-MM-dd',
    })
    .optional(),
  toDate: z.coerce
    .string()
    .transform((val) => {
      try {
        // Handle both yyyy-MM-dd and ISO formats
        const date = val.includes('T') ? parseISO(val) : new Date(val)
        return format(date, 'yyyy-MM-dd')
      } catch {
        return val // Let refinement catch invalid format
      }
    })
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Invalid toDate format, expected yyyy-MM-dd',
    })
    .optional(),
    // carType: z.string().optional(),
})
