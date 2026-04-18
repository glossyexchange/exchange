// customerOrder.schema.ts
import z from 'zod'

export const IncomeTransferCreateSchema = z.object({
  currencyId: z.coerce.number().int(),
  ComSender_ID: z.coerce.number().int().positive(),
  HmulafromComSender: z.coerce.number().nonnegative().optional().default(0),
  HmulatoComSender: z.coerce.number().nonnegative().optional().default(0),

  RecieverPerson: z.string().min(1).max(100).optional(),
  RecieverAddress: z.string().min(1).max(100).optional(),
  RecieverPhone: z.string().nullable().optional(),
  SenderPerson: z.string().min(1).max(100).optional(),
  SenderAddress: z.string().min(1).max(100).optional(),
  SenderPhone: z.string().nullable().optional(),
  AmountTransfer: z.coerce.number().positive(),
  HmulafromReceiver: z.coerce.number().nonnegative().optional().default(0),
  TotalTransferToReceiver: z.coerce.number().positive(),
  Notes: z.string().optional().default(''),
  USER_ID: z.coerce.number().int().positive(),

  cancelledIncomeVoucher: z.coerce.number().positive().optional(),

  createdAt: z.coerce.date(),
  Hmula_ID: z.coerce.number().positive(),
  HawalaIncom_ID: z.coerce.number().positive(),
  currencyType: z.string().min(3).max(10),
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
})

export const IncomeTransferUpdateSchema = IncomeTransferCreateSchema.partial().extend({
  id: z.number().int().positive(),
  voucherNo: z.number().int().positive(),
})


export const DeleteIncomeTransferSchema = z.object({
  voucherNo: z.coerce.number().positive(),
  typeId: z.coerce.number().positive(),
})

export const DeletePaidIncomeTransferSchema = z.object({
  voucherNo: z.coerce.number().positive(),
   typeId: z.coerce.number().positive(),
 })

export const IncomeTransferQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  currencyId: z.coerce.number().int().optional(),
  paidId: z.coerce.number().int().optional(), 
  sortBy: z
    .enum(['createdAt', 'totalAmount', 'voucherNo'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});



export const IncomeTransferSingleGetSchema = z.object({
  incomeTransferId:  z.coerce.number().int().positive().optional(),
  voucherNo: z.coerce.number().int().optional(),
  fiscalYear: z.coerce.number().int().optional(),
}).refine(
  (data) => !!(data.incomeTransferId || (data.voucherNo && data.fiscalYear)),
  {
    message: 'Either incomeTransferId or both voucherNo and fiscalYear must be provided',
    path: ['query'],
  }
);

export const PaidIncomeTransferCreateSchema = z.object({
  incomeVoucherNo: z.coerce.number().positive(),
  currencyId: z.coerce.number().int(),
  ComSender_ID: z.coerce.number().int().positive(),
  HmulafromComSender: z.coerce.number().nonnegative().optional().default(0),
  HmulatoComSender: z.coerce.number().nonnegative().optional().default(0),

  RecieverPerson: z.string().min(1).max(100).optional(),
  RecieverAddress: z.string().min(1).max(100).optional(),
  RecieverPhone: z.string().nullable().optional(),
  SenderPerson: z.string().min(1).max(100).optional(),
  SenderAddress: z.string().min(1).max(100).optional(),
  SenderPhone: z.string().nullable().optional(),
  AmountTransfer: z.coerce.number().positive(),
  HmulafromReceiver: z.coerce.number().nonnegative().optional().default(0),
  TotalTransferToReceiver: z.coerce.number().positive(),
  Notes: z.string().optional().default(''),
  USER_ID: z.coerce.number().int().positive(),
  paidDate: z.coerce.date(),
 paidTransferAddressId: z.coerce.number().int().nonnegative().optional(),

 companyName: z.string().max(100).optional(),
address: z.string().max(100).optional(),
  personName: z.string().min(1).max(100),
  phone:z.string().min(7, { message: "ژمارەی مۆبایل هەڵەیە/ رقم الموبایل" }),

  createdAt: z.coerce.date(),
  accountId: z.coerce.number().positive(),
  HawalaIncom_ID: z.coerce.number().positive(),
  currencyType: z.string().min(3).max(10),
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
})
.refine(
  (data) => {
    // Either provide an existing address ID OR provide personName and phone for new address
    return data.paidTransferAddressId || (data.personName && data.phone);
  },
  {
    message: "Either provide an existing address ID or provide personName and phone for a new address",
    path: ["personName"]
  }
)