import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import path from 'path'
import {
  IncomeTransferCreateSchema,
  IncomeTransferQuerySchema,
  IncomeTransferSingleGetSchema,
  IncomeTransferUpdateSchema,
  PaidIncomeTransferCreateSchema,
} from '../types/incomeTransfer.schema'

import moment from 'moment'
import z from 'zod'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'

// const prisma = new PrismaClient()

const rootDir = process.cwd()
const uploadsDir = path.join(rootDir, 'uploads')
const orderDir = path.join(uploadsDir, 'orders')
type IncomeTransferData = z.infer<typeof IncomeTransferCreateSchema>



class IncomeTransferController {
  createIncomeTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const importValidation = IncomeTransferCreateSchema.safeParse(req.body)

      if (!importValidation.success) {
        console.error('Validation failed:', importValidation.error.format())
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: importValidation.error.errors,
        })
      }

      const {
        createdAt,
        currencyId,
        ComSender_ID,
        HmulafromComSender,
        HmulatoComSender,
        RecieverPerson,
        RecieverAddress,
        RecieverPhone,
        SenderPerson,
        SenderAddress,
        SenderPhone,
        AmountTransfer,
        HmulafromReceiver,
        TotalTransferToReceiver,
        Notes,
        USER_ID,
        cancelledIncomeVoucher, // Extract this from request
        Hmula_ID,
        HawalaIncom_ID,
        typeId,
        type,
        currencyType,
      } = importValidation.data

      // Validate amounts
      if (TotalTransferToReceiver <= 0) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          message: 'Total amount must be greater than 0',
        })
      }

      if (AmountTransfer <= 0) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          message: 'Transfer amount must be greater than 0',
        })
      }

      // Check foreign keys
      const [mainAccount, debtorAccount, daneAccount] = await Promise.all([
        prisma.accounts.findUnique({
          where: { accountId: ComSender_ID },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: HawalaIncom_ID },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: Hmula_ID },
          select: { accountId: true },
        }),
      ])

      if (!mainAccount || !debtorAccount || !daneAccount) {
        const missingAccount = !mainAccount
          ? `ComSender account with id ${ComSender_ID}`
          : !debtorAccount
          ? `HawalaIncom account with id ${HawalaIncom_ID}`
          : `Hmula account with id ${Hmula_ID}`

        return responseReturn(res, 404, {
          error: 'Not found',
          message: `${missingAccount} not found`,
        })
      }

     

      const newIncomeTransfer = await prisma.incomeTransfer.create({
  data: {
    // Do NOT include voucherNo or fiscalYear
    createdAt,
    currencyId,
    ComSender_ID,
    HmulafromComSender,
    HmulatoComSender,
    RecieverPerson,
    RecieverAddress,
    RecieverPhone,
    SenderPerson,
    SenderAddress,
    SenderPhone,
    AmountTransfer,
    HmulafromReceiver,
    TotalTransferToReceiver,
    Notes,
    USER_ID,
    // ✅ NEW columns
    HawalaIncom_ID: HawalaIncom_ID,
    Hmula_ID: Hmula_ID,
    typeId,
    type,
    currencyType,
  }
});

// if (cancelledIncomeVoucher) {
//   await prisma.cancelledIncomeTransfer.delete({
//     where: { voucherNo: cancelledIncomeVoucher }
//   }).catch(() => {}); // ignore if not found
// }

return responseReturn(res, 201, {
  incomeTransfer: newIncomeTransfer,
  transferVoucherNo: newIncomeTransfer.voucherNo,
  transferId: newIncomeTransfer.id,
  message: 'Income Transfer created successfully',
});

      // return responseReturn(res, 201, {
      //   incomeTransfer: result.newIncomeTransfer,
      //   transferId: result.newIncomeTransfer.id,
      //   transferVoucherNo: result.newVoucherNo,
      //   message: cancelledIncomeVoucher
      //     ? 'Income Transfer restored successfully from cancelled transfer'
      //     : 'Income Transfer created successfully',
      // })
    } catch (error: any) {
      console.error('Income Transfer creation error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Duplicate voucher',
              message: 'Voucher number conflict, please try again',
            })
          case 'P2003':
            return responseReturn(res, 404, {
              error: 'Reference error',
              message: 'Linked account not found',
            })
          case 'P2025':
            // Record to delete not found
            return responseReturn(res, 404, {
              error: 'Cancelled transfer not found',
              message:
                'The cancelled transfer you are trying to restore was not found',
            })
        }
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  updateIncomeTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voucherNo } = req.params;
    const voucherNoInt = parseInt(voucherNo);

    const validationResult = IncomeTransferUpdateSchema.safeParse({
      ...req.body,
      voucherNo: voucherNoInt,
    });
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const {
      id,
      createdAt,
      currencyId,
      ComSender_ID,
      HmulafromComSender,
      HmulatoComSender,
      RecieverPerson,
      RecieverAddress,
      RecieverPhone,
      SenderPerson,
      SenderAddress,
      SenderPhone,
      AmountTransfer,
      HmulafromReceiver,
      TotalTransferToReceiver,
      Notes,
      USER_ID,
      HawalaIncom_ID,
      Hmula_ID,
      typeId,
      type,
      currencyType,
    } = validationResult.data;

    // -----------------------------------------------------------------
    // 1. Fetch existing income transfer
    // -----------------------------------------------------------------
    const existing = await prisma.incomeTransfer.findFirst({
      where: { id, voucherNo: voucherNoInt },
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        createdAt: true,
        currencyId: true,
        ComSender_ID: true,
        HmulafromComSender: true,
        HmulatoComSender: true,
        RecieverPerson: true,
        RecieverAddress: true,
        RecieverPhone: true,
        SenderPerson: true,
        SenderAddress: true,
        SenderPhone: true,
        AmountTransfer: true,
        HmulafromReceiver: true,
        TotalTransferToReceiver: true,
        Notes: true,
        USER_ID: true,
        HawalaIncom_ID: true,
        Hmula_ID: true,
        typeId: true,
        type: true,
        currencyType: true,
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Income transfer not found',
        message: `Income transfer with id ${id} and voucherNo ${voucherNo} not found`,
      });
    }

    // -----------------------------------------------------------------
    // 2. Validate foreign keys if they are being updated
    // -----------------------------------------------------------------
    const checks: Promise<any>[] = [];
    if (ComSender_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: ComSender_ID },
          select: { accountId: true },
        })
      );
    }
    if (HawalaIncom_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: HawalaIncom_ID },
          select: { accountId: true },
        })
      );
    }
    if (Hmula_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: Hmula_ID },
          select: { accountId: true },
        })
      );
    }

    const results = await Promise.all(checks);
    let idx = 0;
    if (ComSender_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Sender account ${ComSender_ID} not found`,
      });
    }
    if (HawalaIncom_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Hawala account ${HawalaIncom_ID} not found`,
      });
    }
    if (Hmula_ID !== undefined && !results[idx]) {
      return responseReturn(res, 404, {
        error: `Commission account ${Hmula_ID} not found`,
      });
    }

    // -----------------------------------------------------------------
    // 3. Build update payload for income_transfer (only provided fields)
    // -----------------------------------------------------------------
    const updatePayload: any = {};
    if (createdAt !== undefined) updatePayload.createdAt = createdAt;
    if (currencyId !== undefined) updatePayload.currencyId = currencyId;
    if (ComSender_ID !== undefined) updatePayload.ComSender_ID = ComSender_ID;
    if (HmulafromComSender !== undefined) updatePayload.HmulafromComSender = HmulafromComSender;
    if (HmulatoComSender !== undefined) updatePayload.HmulatoComSender = HmulatoComSender;
    if (RecieverPerson !== undefined) updatePayload.RecieverPerson = RecieverPerson;
    if (RecieverAddress !== undefined) updatePayload.RecieverAddress = RecieverAddress;
    if (RecieverPhone !== undefined) updatePayload.RecieverPhone = RecieverPhone;
    if (SenderPerson !== undefined) updatePayload.SenderPerson = SenderPerson;
    if (SenderAddress !== undefined) updatePayload.SenderAddress = SenderAddress;
    if (SenderPhone !== undefined) updatePayload.SenderPhone = SenderPhone;
    if (AmountTransfer !== undefined) updatePayload.AmountTransfer = AmountTransfer;
    if (HmulafromReceiver !== undefined) updatePayload.HmulafromReceiver = HmulafromReceiver;
    if (TotalTransferToReceiver !== undefined) updatePayload.TotalTransferToReceiver = TotalTransferToReceiver;
    if (Notes !== undefined) updatePayload.Notes = Notes;
    if (USER_ID !== undefined) updatePayload.USER_ID = USER_ID;
    if (HawalaIncom_ID !== undefined) updatePayload.HawalaIncom_ID = HawalaIncom_ID;
    if (Hmula_ID !== undefined) updatePayload.Hmula_ID = Hmula_ID;
    if (typeId !== undefined) updatePayload.typeId = typeId;
    if (type !== undefined) updatePayload.type = type;
    if (currencyType !== undefined) updatePayload.currencyType = currencyType;

    // -----------------------------------------------------------------
    // 4. Helper to safely convert any value to number (null/undefined → 0)
    // -----------------------------------------------------------------
    const toNumber = (val: any): number => (val == null ? 0 : Number(val));

    // Determine final values (using updated if provided, else existing, converted to number)
    const finalCreatedAt = createdAt ?? existing.createdAt;
    const finalCurrencyId = currencyId ?? existing.currencyId;
    const finalComSender = ComSender_ID ?? existing.ComSender_ID;
    const finalHawala = HawalaIncom_ID ?? existing.HawalaIncom_ID;
    const finalHmula = Hmula_ID ?? existing.Hmula_ID;
    const finalAmountTransferNum = toNumber(AmountTransfer ?? existing.AmountTransfer);
    const finalHmulatoComSenderNum = toNumber(HmulatoComSender ?? existing.HmulatoComSender);
    const finalHmulafromComSenderNum = toNumber(HmulafromComSender ?? existing.HmulafromComSender);
    const finalHmulafromReceiverNum = toNumber(HmulafromReceiver ?? existing.HmulafromReceiver);
    const finalNotes = Notes ?? existing.Notes ?? '';
    const finalTypeId = typeId ?? existing.typeId;
    const finalType = type ?? existing.type;
    const finalCurrencyType = currencyType ?? existing.currencyType;
    const finalRecieverPerson = RecieverPerson ?? existing.RecieverPerson ?? '';
    const finalRecieverPhone = RecieverPhone ?? existing.RecieverPhone ?? '';

    // -----------------------------------------------------------------
    // 5. Transaction: update income_transfer + replace movement entries
    // -----------------------------------------------------------------
    const updated = await prisma.$transaction(async (tx) => {
      // 5a. Update income_transfer
      const updatedTransfer = await tx.incomeTransfer.update({
        where: { id: existing.id },
        data: updatePayload,
      });

      // 5b. Delete all existing movements for this voucher and fiscal year
      await tx.movement.deleteMany({
        where: {
          voucherNo: voucherNoInt,
          fiscalYear: existing.fiscalYear!,
          typeId: finalTypeId,
        },
      });

      // 5c. Helper to insert a movement row
      const createMovement = async (
        typeStr: string,
        debtorId: number,
        creditorId: number,
        amount: number,
        note: string
      ) => {
        return tx.movement.create({
          data: {
            fiscalYear: existing.fiscalYear!,
            voucherNo: voucherNoInt,
            createdAt: finalCreatedAt,
            debtorId,
            creditorId,
            amountTaking: amount,
            amountPay: amount,
            currencyId: finalCurrencyId,
            note,
            typeId: finalTypeId,
            type: typeStr,
            receiptNo: 0,
          },
        });
      };

      // Main transfer movement
      await createMovement(
        'حەوالەی هاتوو/حوالة واردة',
        finalComSender,
        finalHawala,
        finalAmountTransferNum,
        `${finalRecieverPerson} ${finalRecieverPhone}`.trim()
      );

      // Commission to sender (hmula pays sender)
      if (finalHmulatoComSenderNum > 0) {
        await createMovement(
         'عمولە بۆ نێردەر/عمولة (للمرسل)',
          finalHmula,
          finalComSender,
          finalHmulatoComSenderNum,
          'عمولە بۆ نێردەر/عمولة للمرسل'
        );
      }

      // Commission from sender (sender pays hmula)
      if (finalHmulafromComSenderNum > 0) {
        await createMovement(
          'عمولة الحوالة (من المرسل)/عمولە لەسەر نێردەر',
          finalComSender,
          finalHmula,
          finalHmulafromComSenderNum,
          'عمولە لەسەر نێردەر/ عمولة من المرسل'
        );
      }

      // Commission from receiver (hawala pays hmula)
      if (finalHmulafromReceiverNum > 0) {
        await createMovement(
          'عمولة الحوالة (من المستلم)/عمولە لەسەر وەرگر',
          finalHawala,
          finalHmula,
          finalHmulafromReceiverNum,
          'عمولە لەسەر وەرگر'
        );
      }

      return updatedTransfer;
    });

    return responseReturn(res, 200, {
      incomeTransfer: updated,
      transferVoucherNo: voucherNo,
      message: 'Income Transfer updated successfully',
    });
  } catch (error: any) {
    console.error('Income Transfer update error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate entry',
            message: 'A unique constraint would be violated. Please check your data.',
          });
        case 'P2003':
          return responseReturn(res, 404, {
            error: 'Reference error',
            message: 'Linked account not found',
          });
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Record not found',
            message: 'Transfer record not found',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

getIncomeTransfers = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = IncomeTransferQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      console.error('Query validation failed:', queryValidation.error.format());
      return responseReturn(res, 400, {
        error: 'Invalid query parameters',
        details: queryValidation.error.errors,
      });
    }

    const {
      page,
      parPage,
      searchValue,
      currencyId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromDate,
      toDate,
      paidId, // 0 = unpaid, 1 = paid
    } = queryValidation.data;

    // -----------------------------------------------------------------
    // Build filter conditions
    // -----------------------------------------------------------------
    const whereConditions: Prisma.IncomeTransferWhereInput = {
      ...(currencyId && { currencyId }),
      ...(paidId !== undefined && { paidId }),
    };

    // Date filtering: if fromDate/toDate provided, use them; otherwise default to current year
    if (fromDate || toDate) {
      whereConditions.createdAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      };
    } else {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfYear   = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // Search conditions
    if (searchValue) {
      const searchConditions: Prisma.IncomeTransferWhereInput[] = [];

      // Numeric search (voucherNo)
      const numericSearch = !isNaN(Number(searchValue)) ? Number(searchValue) : null;
      if (numericSearch !== null) {
        searchConditions.push({ voucherNo: numericSearch });
      }

      // Text searches with case‑insensitive mode
      const textFilter = {
        contains: searchValue,
        mode: Prisma.QueryMode.insensitive,
      };

      searchConditions.push({ RecieverPerson: textFilter });
      searchConditions.push({ SenderPerson: textFilter });
      searchConditions.push({ sender: { name: textFilter } });
      // Optionally search in notes if desired (the original version had Notes)
      searchConditions.push({ Notes: textFilter });

      if (searchConditions.length > 0) {
        whereConditions.OR = searchConditions;
      }
    }

    // -----------------------------------------------------------------
    // Execute queries in parallel
    // -----------------------------------------------------------------
    const [incomeTransfers, totalCount] = await Promise.all([
      prisma.incomeTransfer.findMany({
        skip: (page - 1) * parPage,
        take: parPage,
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sender: {
            select: {
              accountId: true,
              name: true,
              phone: true,
            },
          },
          currency: {
            select: {
              id: true,
              currencyId: true,
              currency: true,
              currencySymbol: true,
              currencyPrice: true,
              currencyAction: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.incomeTransfer.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      incomeTransfers,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'Income transfers retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get income transfers error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve income transfers',
    });
  }
};

getIncomeTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate query parameters
    const queryValidation = IncomeTransferSingleGetSchema.safeParse(req.query);
    if (!queryValidation.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: queryValidation.error.errors,
      });
    }

    const { incomeTransferId, voucherNo, fiscalYear } = queryValidation.data;

    // 2. Build the Prisma where condition
    let whereCondition: Prisma.IncomeTransferWhereUniqueInput;

    if (incomeTransferId) {
      whereCondition = { id: incomeTransferId };
    } else {
      // Use the composite unique constraint (fiscalYear + voucherNo)
      // Assumes your IncomeTransfer model has @@unique([fiscalYear, voucherNo])
      whereCondition = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYear!,
          voucherNo: voucherNo!,
        },
      };
    }

    // 3. Fetch the income transfer with selected relations
    const incomeTransfer = await prisma.incomeTransfer.findUnique({
      where: whereCondition,
      include: {
        sender: {
          select: {
            accountId: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        // If IncomeTransfer has a receiver field, include it similarly.
        // If not, omit this block.
        // receiver: {
        //   select: {
        //     accountId: true,
        //     name: true,
        //     phone: true,
        //     address: true,
        //   },
        // },
        admin: {
          select: {
            id: true,
            name: true,
          },
        },
        currency: {
          select: {
            currencyId: true,
            currencySymbol: true,
            currency: true,
            currencyPrice: true, // Note: was CurrencyPrice in your version
          },
        },
        // Include address only if IncomeTransfer has a direct relation to an Address model
        // address: true,
      },
    });

    if (!incomeTransfer) {
      return responseReturn(res, 404, {
        error: 'Income transfer not found',
        message: 'No income transfer matches the provided identifier',
      });
    }

    return responseReturn(res, 200, {
      incomeTransfer,
      message: 'Income transfer retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get income transfer error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error',
    });
  }
};
  
  
 deleteIncomeTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, voucherNo, fiscalYear } = req.query;

    // --- 1. Validate identifier combination ---
    const hasId = id !== undefined && id !== '';
    const hasVoucher = voucherNo !== undefined && voucherNo !== '';
    const hasFiscal = fiscalYear !== undefined && fiscalYear !== '';

    const useId = hasId && !hasVoucher && !hasFiscal;
    const useVoucherFiscal = !hasId && hasVoucher && hasFiscal;

    if (!useId && !useVoucherFiscal) {
      return responseReturn(res, 400, {
        error: 'Invalid identifier',
        message: 'Provide either "id" alone, or both "voucherNo" and "fiscalYear".',
      });
    }

    // --- 2. Build Prisma `where` clause for fetching the original income transfer ---
    let whereClause: any;
    if (useId) {
      const idInt = parseInt(id as string, 10);
      if (isNaN(idInt)) {
        return responseReturn(res, 400, {
          error: 'Invalid id',
          message: 'id must be a number',
        });
      }
      whereClause = { id: idInt };
    } else {
      const voucherNoInt = parseInt(voucherNo as string, 10);
      const fiscalYearInt = parseInt(fiscalYear as string, 10);
      if (isNaN(voucherNoInt) || isNaN(fiscalYearInt)) {
        return responseReturn(res, 400, {
          error: 'Invalid parameters',
          message: 'voucherNo and fiscalYear must be numbers',
        });
      }
      // Use the composite unique key (generated from @@unique([fiscalYear, voucherNo]))
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- 3. Fetch the existing income transfer with all fields needed for cancellation ---
    const existing = await prisma.incomeTransfer.findUnique({
      where: whereClause,
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        createdAt: true,
        currencyId: true,
        ComSender_ID: true,               // maps to comSenderId
        HmulafromComSender: true,          // maps to hmulaFromComSender
        HmulatoComSender: true,            // maps to hmulaToComSender
        RecieverPerson: true,               // maps to receiverPerson
        RecieverAddress: true,              // maps to receiverAddress
        RecieverPhone: true,                // maps to receiverPhone
        SenderPerson: true,                  // maps to senderPerson
        SenderAddress: true,                 // maps to senderAddress
        SenderPhone: true,                   // maps to senderPhone
        AmountTransfer: true,                // maps to amountTransfer
        HmulafromReceiver: true,             // maps to hmulaFromReceiver
        TotalTransferToReceiver: true,        // maps to totalTransferToReceiver
        Notes: true,                          // maps to notes
        USER_ID: true,                        // maps to userId
        typeId: true,                         // needed for movement deletion
        // If the following fields exist in your IncomeTransfer model, include them;
        // otherwise adjust accordingly.
        // HawalaIncom_ID: true,   // not needed for cancelled record
        // Hmula_ID: true,         // not needed
        // type: true,             // not needed
        // currencyType: true,      // not needed
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Income transfer record not found',
      });
    }

    // --- 4. Prepare data for the cancelled record (camelCase as expected by CancelledIncomeTransfer) ---
    const cancelledData = {
      voucherNo: existing.voucherNo!,
      fiscalYear: existing.fiscalYear!,
      createdAt: existing.createdAt,
      currencyId: existing.currencyId,
      comSenderId: existing.ComSender_ID,
      hmulaFromComSender: existing.HmulafromComSender,
      hmulaToComSender: existing.HmulatoComSender,
      receiverPerson: existing.RecieverPerson ?? '',
      receiverAddress: existing.RecieverAddress ?? '',
      receiverPhone: existing.RecieverPhone ?? '',
      senderPerson: existing.SenderPerson ?? '',
      senderAddress: existing.SenderAddress ?? '',
      senderPhone: existing.SenderPhone ?? '',
      amountTransfer: existing.AmountTransfer,
      hmulaFromReceiver: existing.HmulafromReceiver,
      totalTransferToReceiver: existing.TotalTransferToReceiver,
      notes: existing.Notes ?? '',
      userId: existing.USER_ID,
    };

    // --- 5. Transaction: archive, delete movements, delete original ---
    const [cancelledRecord, deletedMovements, deletedTransfer] = await prisma.$transaction([
      prisma.cancelledIncomeTransfer.create({ data: cancelledData }),
      prisma.movement.deleteMany({
        where: {
          voucherNo: existing.voucherNo!,
          fiscalYear: existing.fiscalYear!,
          typeId: existing.typeId,   // filter by typeId to only remove movements of this transfer type
        },
      }),
      prisma.incomeTransfer.delete({
        where: { id: existing.id },
      }),
    ]);

    return responseReturn(res, 200, {
      cancelledRecord,
      deletedMovements: deletedMovements.count,
      deletedTransfer,
      message: 'Income transfer cancelled successfully',
    });
  } catch (error: any) {
    console.error('Income transfer deletion error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Not found',
            message: 'Record does not exist',
          });
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate',
            message: 'Cancelled record already exists for this voucher',
          });
        case 'P2003':
          return responseReturn(res, 409, {
            error: 'Conflict',
            message: 'Cannot delete due to existing dependencies',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

getCancelledIncomeTransfers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryValidation = IncomeTransferQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      console.error('Query validation failed:', queryValidation.error.format());
      return responseReturn(res, 400, {
        error: 'Invalid query parameters',
        details: queryValidation.error.errors,
      });
    }

    const {
      page,
      parPage,
      searchValue,
      currencyId,
      sortBy,
      sortOrder = 'desc',
      fromDate,
      toDate,
    } = queryValidation.data;

    const fromDateAdjusted = fromDate
      ? moment.utc(fromDate).utcOffset('+03:00').startOf('day').toDate()
      : null;
    const toDateAdjusted = toDate
      ? moment.utc(toDate).utcOffset('+03:00').endOf('day').toDate()
      : null;

    // Build base conditions
    const whereConditions: Prisma.CancelledIncomeTransferWhereInput = {
      ...(currencyId && { currencyId }),
    };

    // Date filtering logic:
    // - If fromDate/toDate are provided, use them exactly.
    // - Otherwise, if there is NO searchValue, default to current year.
    // - If there IS a searchValue, do NOT apply any default date filter (search across all years).
    if (fromDateAdjusted || toDateAdjusted) {
      whereConditions.createdAt = {
        ...(fromDateAdjusted && { gte: fromDateAdjusted }),
        ...(toDateAdjusted && { lte: toDateAdjusted }),
      };
    } else if (!searchValue) {
      // No explicit dates and no search → default to current year
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfYear   = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }
    // If searchValue exists and no explicit dates, we leave createdAt undefined → search all years

    // Add search conditions if searchValue exists
    if (searchValue) {
      const searchNumber = Number(searchValue);
      const isNumber = !isNaN(searchNumber) && isFinite(searchNumber);

      const searchOR: Prisma.CancelledIncomeTransferWhereInput[] = [];

      if (isNumber) {
        searchOR.push({ voucherNo: searchNumber });
      }

      searchOR.push({
        receiverPerson: {
          contains: searchValue,
          mode: Prisma.QueryMode.insensitive,
        },
      });
      // Optionally also search senderPerson
      // searchOR.push({
      //   senderPerson: {
      //     contains: searchValue,
      //     mode: Prisma.QueryMode.insensitive,
      //   },
      // });

      whereConditions.OR = searchOR;
    }

    const effectiveSortBy = sortBy === 'totalAmount' ? 'amountTransfer' : sortBy;

    const [cancelledIncomeTransfers, totalCount] = await Promise.all([
      prisma.cancelledIncomeTransfer.findMany({
        skip: (page - 1) * parPage,
        take: parPage,
        where: whereConditions,
        orderBy: { [effectiveSortBy]: sortOrder },
        include: {
          sender: {
            select: {
             accountId: true,
              name: true,
              phone: true,
              address: true,
            },
          },
          currency: {
            select: {
              id: true,
              currencyId: true,
              currency: true,
              currencySymbol: true,
              currencyPrice: true,
              currencyAction: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.cancelledIncomeTransfer.count({ where: whereConditions }),
    ]);

    // Map camelCase DB fields to PascalCase names expected by the frontend
    const transformedTransfers = cancelledIncomeTransfers.map((item) => ({
      ...item,
      RecieverPerson: item.receiverPerson,
      RecieverAddress: item.receiverAddress,
      RecieverPhone: item.receiverPhone,
      SenderPerson: item.senderPerson,
      SenderAddress: item.senderAddress,
      SenderPhone: item.senderPhone,
      AmountTransfer: item.amountTransfer,
    }));

    const totalPages = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      cancelledIncomeTransfers: transformedTransfers,
      pagination: {
        total: totalCount,
        totalPage: totalPages,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: 'Cancelled income transfers retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get cancelled income transfers error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve cancelled income transfers',
    });
  }
};

deleteCancelledIncomeTransfer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, voucherNo, fiscalYear } = req.query;

    // --- Validate identifier ---
    const hasId = id !== undefined && id !== '';
    const hasVoucher = voucherNo !== undefined && voucherNo !== '';
    const hasFiscal = fiscalYear !== undefined && fiscalYear !== '';

    const useId = hasId && !hasVoucher && !hasFiscal;
    const useVoucherFiscal = !hasId && hasVoucher && hasFiscal;

    if (!useId && !useVoucherFiscal) {
      return responseReturn(res, 400, {
        error: 'Invalid identifier',
        message: 'Provide either "id" alone, or both "voucherNo" and "fiscalYear".',
      });
    }

    // --- Parse numbers and build the correct unique where clause ---
    let whereClause: any;
    if (useId) {
      const idInt = parseInt(id as string, 10);
      if (isNaN(idInt)) {
        return responseReturn(res, 400, {
          error: 'Invalid id',
          message: 'id must be a number',
        });
      }
      whereClause = { id: idInt };
    } else {
      const voucherNoInt = parseInt(voucherNo as string, 10);
      const fiscalYearInt = parseInt(fiscalYear as string, 10);
      if (isNaN(voucherNoInt) || isNaN(fiscalYearInt)) {
        return responseReturn(res, 400, {
          error: 'Invalid parameters',
          message: 'voucherNo and fiscalYear must be numbers',
        });
      }
      // Use the composite unique key (generated from @@unique([fiscalYear, voucherNo]))
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- Fetch the existing cancelled income transfer (optional, but useful for response) ---
    const existing = await prisma.cancelledIncomeTransfer.findUnique({
      where: whereClause,
      include: {
        currency: true,
        sender: true,
        admin: true,
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Cancelled income transfer record not found',
      });
    }

    // --- Delete the record using its primary key ---
    const deletedRecord = await prisma.cancelledIncomeTransfer.delete({
      where: { id: existing.id },
    });

    return responseReturn(res, 200, {
      deletedRecord,
      message: 'Cancelled income transfer deleted successfully',
    });
  } catch (error: any) {
    console.error('Cancelled income transfer deletion error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Not found',
            message: 'Record does not exist',
          });
        case 'P2003':
          return responseReturn(res, 409, {
            error: 'Conflict',
            message: 'Cannot delete due to existing dependencies',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

 createPaidTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const importValidation = PaidIncomeTransferCreateSchema.safeParse(req.body);
    if (!importValidation.success) {
  const fieldErrors = importValidation.error.flatten().fieldErrors;
  return responseReturn(res, 400, {
    error: 'Validation error',
    fieldErrors, // e.g. { phone: ["Phone number must be at least 7..."] }
  });
}
      // return responseReturn(res, 400, {
      //   error: 'Validation error',
      //   details: importValidation.error.errors,
      // });
    // }

    const data = importValidation.data;

    // Validate amounts (redundant with zod but safe)
    if (data.TotalTransferToReceiver <= 0 || data.AmountTransfer <= 0) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        message: 'Amounts must be greater than 0',
      });
    }

    // Use a transaction for atomicity
   const result = await prisma.$transaction(async (tx) => {
  // 1. Verify all referenced accounts exist (your existing code)
  const [mainAccount, debtorAccount, payerAccount] = await Promise.all([
    tx.accounts.findUnique({ where: { accountId: data.ComSender_ID } }),
    tx.accounts.findUnique({ where: { accountId: data.HawalaIncom_ID } }),
    tx.accounts.findUnique({ where: { accountId: data.accountId } }),
  ]);
  if (!mainAccount) throw new Error(`Account ${data.ComSender_ID} not found`);
  if (!debtorAccount) throw new Error(`Debtor account ${data.HawalaIncom_ID} not found`);
  if (!payerAccount) throw new Error(`Payer account ${data.accountId} not found`);

  // 2. Handle address (existing code)
  let finalAddressId: number;
  if (data.paidTransferAddressId) {
    const existingAddress = await tx.paidTransferAddress.findUnique({
      where: { id: data.paidTransferAddressId },
    });
    if (!existingAddress) {
      throw new Error(`Address with id ${data.paidTransferAddressId} not found`);
    }
    finalAddressId = data.paidTransferAddressId;
  } else {
    const newAddress = await tx.paidTransferAddress.create({
      data: {
        companyName: data.companyName || null,
        personName: data.personName,
        address: data.address || null,
        phone: data.phone,
      },
    });
    finalAddressId = newAddress.id;
  }

  // 3. Check income transfer existence and payment status
  const income = await tx.incomeTransfer.findUnique({
    where: {
      fiscalYear_voucherNo: {
        fiscalYear: data.createdAt.getFullYear(),
        voucherNo: data.incomeVoucherNo,
      },
    },
    select: { paidId: true },
  });

  if (!income) {
    throw new Error(`Income transfer with voucher ${data.incomeVoucherNo} not found`);
  }

  if (income.paidId === 1) {
    throw new Error(`Income transfer ${data.incomeVoucherNo} is already paid`);
  }

  // 4. Prevent duplicate paid transfer (respecting the unique constraint)
  const existingPaid = await tx.paidTransfer.findFirst({
    where: {
      voucherNo: data.incomeVoucherNo,
      fiscalYear: data.createdAt.getFullYear(),
      type: data.type,  // 👈 include type because the unique key includes it
    },
  });

  if (existingPaid) {
    throw new Error(
      `A paid transfer already exists for voucher ${data.incomeVoucherNo} ` +
      `with type "${data.type}". Duplicate not allowed.`
    );
  }

  

  // 5. Create the paid transfer record (trigger will insert movement(s))
  const newPaidTransfer = await tx.paidTransfer.create({
    data: {
      incomeVoucherNo: data.incomeVoucherNo,
      voucherNo: data.incomeVoucherNo,
      fiscalYear: data.createdAt.getFullYear(),
      createdAt: data.createdAt,
      currencyId: data.currencyId,
      ComSender_ID: data.ComSender_ID,
      HmulafromComSender: data.HmulafromComSender,
      HmulatoComSender: data.HmulatoComSender,
      RecieverPerson: data.RecieverPerson,
      RecieverAddress: data.RecieverAddress,
      RecieverPhone: data.RecieverPhone,
      SenderPerson: data.SenderPerson,
      SenderAddress: data.SenderAddress,
      SenderPhone: data.SenderPhone,
      AmountTransfer: data.AmountTransfer,
      HmulafromReceiver: data.HmulafromReceiver,
      TotalTransferToReceiver: data.TotalTransferToReceiver,
      Notes: data.Notes,
      USER_ID: data.USER_ID,
      paidDate: data.paidDate,
      accountId: data.accountId,
      paidTransferAddressId: finalAddressId,
      HawalaIncom_ID: data.HawalaIncom_ID,
      typeId: data.typeId,
      type: data.type,
      currencyType: data.currencyType,
    },
  });

  // 6. Mark the original income transfer as paid
  await tx.incomeTransfer.update({
    where: {
      fiscalYear_voucherNo: {
        fiscalYear: data.createdAt.getFullYear(),
        voucherNo: data.incomeVoucherNo,
      },
    },
    data: { paidId: 1 },
  });

  return newPaidTransfer;
}, {
  maxWait: 5000,
  timeout: 10000,
});

    return responseReturn(res, 201, {
      paidIncomeTransfer: result,
      paidIncomeVoucherNo: result.voucherNo,
      message: 'Paid Income Transfer created successfully',
    });
  } catch (error: any) {
    console.error('Paid Income Transfer creation error:', error);

    // Handle specific known errors
    if (error.message.includes('Account with id')) {
      return responseReturn(res, 404, {
        error: 'Account not found',
        message: error.message,
      });
    }
    if (error.message.includes('Address with id')) {
      return responseReturn(res, 404, {
        error: 'Address not found',
        message: error.message,
      });
    }

    // Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate voucher',
            message: 'Voucher number conflict, please try again',
          });
        case 'P2003':
          return responseReturn(res, 404, {
            error: 'Foreign key constraint',
            message: 'Linked record not found',
          });
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Record not found',
            message: 'The referenced address was not found',
          });
        case 'P2034':
          return responseReturn(res, 409, {
            error: 'Transaction conflict',
            message: 'Please try again',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
}

getPaidIncomeTransfers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryValidation = IncomeTransferQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      console.error(
        'Query validation failed:',
        queryValidation.error.format()
      );
      return responseReturn(res, 400, {
        error: 'Invalid query parameters',
        details: queryValidation.error.errors,
      });
    }

    const {
      page,
      parPage,
      searchValue,
      currencyId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromDate,
      toDate,
        // paidId is ignored for paid transfers – they are all paid by definition
    } = queryValidation.data;

    // Build base where conditions
    const whereConditions: Prisma.PaidTransferWhereInput = {
      ...(currencyId && { currencyId }),
    };

    // Date filtering
    if (fromDate || toDate) {
      whereConditions.createdAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      };
    } else {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfYear   = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // Search logic
    if (searchValue) {
      const searchConditions: Prisma.PaidTransferWhereInput[] = [];

      // Numeric search on voucherNo
      const numericSearch = !isNaN(Number(searchValue)) ? Number(searchValue) : null;
      if (numericSearch !== null) {
        searchConditions.push({ voucherNo: numericSearch });
      }

      // Text search with case‑insensitive mode
      const textFilter = {
        contains: searchValue,
        mode: Prisma.QueryMode.insensitive,
      };

      searchConditions.push({ RecieverPerson: textFilter });
      searchConditions.push({ SenderPerson: textFilter });

      // Search in related account names
      searchConditions.push({
        sender: { name: textFilter },        // the sender account (ComSender_ID)
      });
      searchConditions.push({
        account: { name: textFilter },       // the paying account (accountId)
      });

      // Optionally search in notes
      searchConditions.push({ Notes: textFilter });

      if (searchConditions.length > 0) {
        whereConditions.OR = searchConditions;
      }
    }

    // Execute queries in parallel
    const [paidIncomeTransfers, totalCount] = await Promise.all([
      prisma.paidTransfer.findMany({
        skip: (page - 1) * parPage,
        take: parPage,
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sender: {
            select: {
              accountId: true,
              name: true,
              phone: true,
            },
          },
          account: {
            select: {
              accountId: true,
              name: true,
              phone: true,
            },
          },
          paidTransferAddress: true,
          currency: {
            select: {
              id: true,
              currencyId: true,
              currency: true,
              currencySymbol: true,
              currencyPrice: true,      // adjust field name if different
              currencyAction: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.paidTransfer.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      paidIncomeTransfers,
      pagination: {
        total: totalCount,
        totalPage: totalPages,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: 'Paid Income Transfers retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get paid income transfers error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve paid income transfers',
    });
  }
};

deletePaidIncomeTransferByVoucherNo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, voucherNo, fiscalYear } = req.query;

    // --- 1. Validate identifier combination ---
    const hasId = id !== undefined && id !== '';
    const hasVoucher = voucherNo !== undefined && voucherNo !== '';
    const hasFiscal = fiscalYear !== undefined && fiscalYear !== '';

    const useId = hasId && !hasVoucher && !hasFiscal;
    const useVoucherFiscal = !hasId && hasVoucher && hasFiscal;

    if (!useId && !useVoucherFiscal) {
      return responseReturn(res, 400, {
        error: 'Invalid identifier',
        message: 'Provide either "id" alone, or both "voucherNo" and "fiscalYear".',
      });
    }

    // --- 2. Build Prisma `where` clause for the paid transfer ---
    let whereClause: Prisma.PaidTransferWhereUniqueInput;
    if (useId) {
      const idInt = parseInt(id as string, 10);
      if (isNaN(idInt)) {
        return responseReturn(res, 400, {
          error: 'Invalid id',
          message: 'id must be a number',
        });
      }
      whereClause = { id: idInt };
    } else {
      const voucherNoInt = parseInt(voucherNo as string, 10);
      const fiscalYearInt = parseInt(fiscalYear as string, 10);
      if (isNaN(voucherNoInt) || isNaN(fiscalYearInt)) {
        return responseReturn(res, 400, {
          error: 'Invalid parameters',
          message: 'voucherNo and fiscalYear must be numbers',
        });
      }
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- 3. Fetch the existing paid transfer with all needed data ---
    const existingPaid = await prisma.paidTransfer.findUnique({
      where: whereClause,
      include: {
        // Include the address to potentially delete it later
        paidTransferAddress: true,
      },
    });

    if (!existingPaid) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Paid income transfer record not found',
      });
    }

    // Extract the identifying fields for later use
    const voucherNoInt = existingPaid.voucherNo;
    const fiscalYearInt = existingPaid.fiscalYear;
    const typeId = existingPaid.typeId; // needed for movement deletion
    const addressId = existingPaid.paidTransferAddressId;

    // --- 4. Transaction: revert income transfer, delete movements, delete paid transfer, clean up address ---
    const result = await prisma.$transaction(async (tx) => {
      // 4a. Update the original income transfer to unpaid (paidId = 0)
      const updatedIncome = await tx.incomeTransfer.update({
        
        where: {
          fiscalYear_voucherNo: {
            fiscalYear: fiscalYearInt,
            voucherNo: existingPaid.incomeVoucherNo,
          },
        },
        data: { paidId: 0 },
      });

      // 4b. Delete movements associated with this paid transfer
      const deletedMovements = await tx.movement.deleteMany({
        where: {
          voucherNo: voucherNoInt,
          fiscalYear: fiscalYearInt,
          typeId: typeId,
        },
      });

      // 4c. Delete the paid transfer itself
      const deletedPaid = await tx.paidTransfer.delete({
        where: { id: existingPaid.id }, // use the primary key for safety
      });

      // 4d. Clean up the address if it is no longer referenced by any other paid transfer
      if (addressId) {
        const otherPaidWithSameAddress = await tx.paidTransfer.count({
          where: {
            paidTransferAddressId: addressId,
            NOT: { id: existingPaid.id },
          },
        });
        if (otherPaidWithSameAddress === 0) {
          await tx.paidTransferAddress.delete({
            where: { id: addressId },
          });
        }
      }

      return {
        updatedIncome,
        deletedMovements: deletedMovements.count,
        deletedPaid,
      };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    return responseReturn(res, 200, {
      updatedIncomeTransfer: result.updatedIncome,
      deletedMovements: result.deletedMovements,
      deletedPaidTransfer: result.deletedPaid,
      message: 'Paid income transfer deleted and income transfer reverted to unpaid successfully',
    });
  } catch (error: any) {
    console.error('Paid income transfer deletion error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Not found',
            message: 'Record does not exist (maybe already deleted)',
          });
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate',
            message: 'Cannot delete due to unique constraint conflict',
          });
        case 'P2003':
          return responseReturn(res, 409, {
            error: 'Conflict',
            message: 'Cannot delete due to existing dependencies',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

}

export default new IncomeTransferController()
