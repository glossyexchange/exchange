import z from 'zod';

export const PaymentCreateSchema = z.object({
  paymentTypeId: z.coerce.number().int().positive(),
  currencyId: z.coerce.number().int(),
  currencyType: z.string(),
  accountId: z.coerce.number().int(),
  payer: z.string().nullable().optional(),
  payerPhone: z.string().nullable().optional(),
  totalAmount: z.coerce.number().positive(),
   note: z.string().optional().default(''),
  createdAt: z.coerce.date(),

   receiptNo: z.coerce.number().int(),
   typeId: z.coerce.number().positive(),
   type: z.string().min(2).max(60),
   debtorId: z.coerce.number().positive(),
   daneId: z.coerce.number().positive(),
})

export const PaymentUpdateSchema = z.object({
  paymentId: z.coerce.number().int().positive().optional(),
  paymentTypeId: z.coerce.number().int().positive().optional(),
  currencyId: z.coerce.number().int().optional(),
  currencyType: z.string().optional(),
  accountId: z.coerce.number().int().optional(),
  payer: z.string().nullable().optional(),
  payerPhone: z.string().nullable().optional(),
  totalAmount: z.coerce.number().positive().optional(),
  note: z.string().optional(),
  createdAt: z.coerce.date().optional(),

   receiptNo: z.coerce.number().int().optional(),
  //  typeId: z.coerce.number().positive().optional(),
   type: z.string().min(2).max(60).optional(),
   debtorId: z.coerce.number().positive().optional(),
   daneId: z.coerce.number().positive().optional(),
})

export const VoucherNoSchema = z.object({
  voucherNo: z.coerce.number().positive(), // Handle string conversion
  formType: z.coerce.number().int().positive(),
})

export const PaymentSingleGetSchema = z.object({
  paymentId: z.coerce.number().int().positive().optional(),
  voucherNo: z.coerce.number().int().positive().optional(),
  fiscalYear: z.coerce.number().int().positive().optional(),
}).refine(
  data => data.paymentId || (data.voucherNo && data.fiscalYear),
  {
    message: 'Either paymentId OR (voucherNo + fiscalYear) must be provided',
  }
);

export const PaymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  currencyId: z.coerce.number().int().positive().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const PaymentDeleteSchema = z.object({
  paymentId: z.coerce.number().int().positive().optional(),
  voucherNo: z.coerce.number().int().positive().optional(),
  fiscalYear: z.coerce.number().int().positive().optional(),
  formType: z.coerce.number().int().positive().optional(),
}).refine(
  data => data.paymentId || (data.voucherNo && data.fiscalYear),
  { message: 'Either paymentId OR (voucherNo + fiscalYear) must be provided' }
);
