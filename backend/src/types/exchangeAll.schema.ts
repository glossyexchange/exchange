// customerOrder.schema.ts
import z from 'zod';

export const ExchangeAllCreateSchema = z.object({
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
  ExchangeAll_ID: z.coerce.number().positive(),
  Hmula_ID: z.coerce.number().positive(),
})

export const ExchangeAllUpdateSchema = ExchangeAllCreateSchema.partial().extend({
  id: z.coerce.number().int(),
  voucherNo: z.coerce.number().int(),
});


export const CustomerLastPayOrderUpdateSchema = z.object({
  lastPayDate: z.coerce.date(),
})

export const DailyImportStatusUpdateSchema = z.object({
  incomeStatus: z.string().optional(),
  // totalRemain: z.coerce.number().positive(),
  // orderStatus: z.string().optional(), // optional in case you want to update the status
})

export const DeleteExchangeCurrencySchema = z.object({
  voucherNo: z.coerce.number().positive(),
  typeId: z.coerce.number().positive(),
});

export const ExchangeAllQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  exchangeTypeId: z.coerce.number().int().optional(),
  currencyId: z.coerce.number().int().optional(),
  sortBy: z.enum(['createdAt', 'voucherNo', 'amountUsd', 'amountIqd']).default('createdAt'), // adjusted
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  accountId: z.coerce.number().int().optional(),

  // Handle empty strings by converting to undefined
  fromDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  toDate: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
});