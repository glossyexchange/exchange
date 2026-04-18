import z from 'zod';

export const ReceiptCreateSchema = z.object({
  receiptTypeId: z.coerce.number().int().positive(),
   currencyId: z.coerce.number().int(),
  currencyType: z.string(),
  accountId: z.coerce.number().int(),
  payer: z.string().nullable().optional(),
  payerPhone: z.string().nullable().optional(),
  totalAmount: z.coerce.number().positive(),
  
  note: z.string().optional().default(''),
  createdAt: z.coerce.date(),

receiptNo: z.coerce.number().int().optional().default(0),
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
  debtorId: z.coerce.number().positive(),
  daneId: z.coerce.number().positive(),
})

export const ReceiptUpdateSchema = z.object({
  receiptId: z.coerce.number().int().positive(), 
  // ... all other updatable fields
  currencyId: z.coerce.number().int().optional(),
  currencyType: z.string().optional(),
  accountId: z.coerce.number().int().optional(),
  payer: z.string().nullable().optional(),
  payerPhone: z.string().nullable().optional(),
  totalAmount: z.coerce.number().positive().optional(),
  note: z.string().optional(),
  debtorId: z.coerce.number().positive().optional(),
  daneId: z.coerce.number().positive().optional(),
  // Do NOT include createdAt, fiscalYear, receiptTypeId – they are immutable
});

export const ReceiptSingleGetSchema = z.object({
  receiptId: z.coerce.number().int().positive().optional(),
  voucherNo: z.coerce.number().int().positive().optional(),
  fiscalYear: z.coerce.number().int().positive().optional(),
}).refine(
  data => data.receiptId || (data.voucherNo && data.fiscalYear),
  { message: 'Either receiptId OR (voucherNo + fiscalYear) must be provided' }
);

// For DELETE – flexible identifier
export const ReceiptDeleteSchema = z.object({
  receiptId: z.coerce.number().int().positive().optional(),
  voucherNo: z.coerce.number().int().positive().optional(),
  fiscalYear: z.coerce.number().int().positive().optional(),
  formType: z.coerce.number().int().positive(), // from movement.typeId
}).refine(
  data => data.receiptId || (data.voucherNo && data.fiscalYear),
  { message: 'Either receiptId OR (voucherNo + fiscalYear) must be provided' }
);

export interface BatchSumRequestBody {
  voucherNos: (number | null)[];
}

export interface BatchSumResponse {
  paymentsAllSum: Record<number, number>;
  message: string;
}


export const ReceiptQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1), // Coerce from string
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'voucherNo']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  accountId: z.coerce.number().optional(),
  currencyId: z.coerce.number().int().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
})
