// customerOrder.schema.ts
import z from 'zod';


export const QaidCreateSchema = z.object({
  currencyId: z.coerce.number().int(),
  ComSender_ID: z.coerce.number().int().positive(),
   ComeReciever_ID: z.coerce.number().int().positive(),
   AmountTransfer: z.coerce.number().positive(),
   Notes: z.string().optional().default(''),
  USER_ID: z.coerce.number().int().positive(),
   createdAt: z.coerce.date(),
  
  typeId: z.coerce.number().positive(),
  type: z.string().min(2).max(60),
})

export const QaidUpdateSchema = QaidCreateSchema.partial().extend({
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


