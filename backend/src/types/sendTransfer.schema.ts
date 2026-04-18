// customerOrder.schema.ts
import z from 'zod';


export const SendTransferCreateSchema = z.object({
  currencyId: z.coerce.number().int(),
  ComSender_ID: z.coerce.number().int().positive(),
  HmulafromComSender: z.coerce.number().nonnegative().optional().default(0),
  ComeReciever_ID: z.coerce.number().int().positive(),
  HmulafromComReciever: z.coerce.number().nonnegative().optional().default(0),
  HmulatoComReciever: z.coerce.number().nonnegative().optional().default(0),
  RecieverPerson: z.string().min(1).max(100).optional(),
  RecieverAddress: z.string().min(1).max(100).optional(),
  RecieverPhone: z.string().nullable().optional(),
  SenderPerson: z.string().min(1).max(100).optional(),
  SenderAddress: z.string().min(1).max(100).optional(),
  SenderPhone: z.string().nullable().optional(),
  AmountTransfer: z.coerce.number().positive(),
  HmulatoComSender: z.coerce.number().nonnegative().optional().default(0),
  TotalTransferToReceiver: z.coerce.number().positive(),
  Notes: z.string().optional().default(''),
  USER_ID: z.coerce.number().int().positive(),
  addressID: z.coerce.number().int().positive().optional(),
  transferTypeId: z.coerce.number().int().positive(),
  createdAt: z.coerce.date(),
  Hmula_ID: z.coerce.number().positive(),
  currencyType: z.string().min(3).max(10),
  // typeReceiptId: z.coerce.number().positive(),
  // receiptNo: z.coerce.number().int(),
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
})

export const SendTransferUpdateSchema = SendTransferCreateSchema.partial().extend({
  id: z.number().int().positive(),
  voucherNo: z.number().int().positive(),
})



export const DeleteSendTransferSchema = z.object({
  voucherNo: z.coerce.number().positive(),
  typeId: z.coerce.number().positive(),
});

export const SendTransferQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(10),
  searchValue: z.string().optional(),
  currencyId: z.coerce.number().int().optional(),
  sortBy: z
    .enum(['createdAt', 'totalAmount', 'voucherNo'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const SendTransferSingleGetSchema = z
  .object({
    sendTransferId: z.coerce.number().int().positive().optional(),
    voucherNo: z.coerce.number().int().positive().optional(),
    fiscalYear: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (data) => data.sendTransferId || (data.voucherNo && data.fiscalYear),
    {
      message: 'Either sendTransferId OR (voucherNo + fiscalYear) must be provided',
    }
  );


