import z from 'zod';

export const FirstBalanceCreateSchema = z.object({
  currencyId: z.coerce.number().int(),
  balanceTypeId: z.coerce.number().int().refine(val => val === 1 || val === 2, {
    message: "balanceTypeId must be 1 (debtor) or 2 (creditor)"
  }),
  balanceType: z.string(),
  createdAt: z.coerce.date(),
  accountId: z.coerce.number().int(),
  balance: z.coerce.number().positive(),
  note: z.string().optional().default(''),
  USER_ID: z.coerce.number().int().positive(),
  // These are required for movement creation
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
  fiscalYear: z.coerce.number().int(),
});

export const FirstBalanceUpdateByIdentifierSchema = z.object({
  // Composite key (required, immutable)
  fiscalYear: z.coerce.number().int(),
  voucherNo: z.coerce.number().int(),
  typeId: z.coerce.number().int(),

  // Optional updatable fields
  accountId: z.coerce.number().int().optional(),
  currencyId: z.coerce.number().int().optional(),
  balanceTypeId: z.coerce.number().int()
    .refine(val => val === 1 || val === 2, {
      message: "balanceTypeId must be 1 (debtor) or 2 (creditor)"
    }).optional(),
  balanceType: z.string().optional(),
  balance: z.coerce.number().positive().optional(),
  note: z.string().optional().default(''),
  USER_ID: z.coerce.number().int().positive().optional(),
  createdAt: z.coerce.date().optional(),
});

export const FirstBalanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().max(100).default(10),
  searchValue: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  currencyId: z.coerce.number().int().optional(),
  fiscalYear: z.coerce.number().int().optional(),
  accountId: z.coerce.number().int().optional(),
  balanceTypeId: z.coerce.number().int().min(1).max(2).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const FirstBalanceDeleteSchema = z.object({
  fiscalYear: z.coerce.number().int(),
  voucherNo: z.coerce.number().int(),
  typeId: z.coerce.number().int(),
});