import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import moment from 'moment'
import {
  ExchangeAllCreateSchema,
  ExchangeAllQuerySchema,
  ExchangeAllUpdateSchema
} from '../types/exchangeAll.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
// const prisma = new PrismaClient()

class ExchangeAllController {
  createExchangeAll = async (req: Request, res: Response): Promise<void> => {
    try {
   

      const importValidation = ExchangeAllCreateSchema.safeParse(req.body)
      if (!importValidation.success) {
        console.error('Validation failed:', importValidation.error.format())
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: importValidation.error.errors,
        })
      }

      const {
        exchangeTypeId,
        exchangeType,
        accountId,
        amountUsd,
        price,
        amountIqd,
        createdAt,
        note,
        adminId,
        ExchangeAll_ID,
        Hmula_ID,
        typeId,
        type,
        currencyId,
        currencyType,
        ...rest
      } = importValidation.data

      // Generate shared voucherNo
      const lastOrder = await prisma.exchangeAllCurrency.findFirst({
        orderBy: { voucherNo: 'desc' },
        select: { voucherNo: true },
      })
      const newVoucherNo = (lastOrder?.voucherNo || 100) + 1

      const USD = 2
      const currencyTypeUSD = 'دولار'

      const currencyAllPrice = (await prisma.currency.findUnique({
        where: { currencyId: currencyId },
        select: { currencyPrice: true },
      })) as any

      const different = currencyAllPrice.CurrencyPrice * amountUsd - amountIqd

      // Check foreign keys
      const [mainAccount, debtorAccount, daneAccount, admin] =
        await Promise.all([
          prisma.accounts.findUnique({
            where: { accountId: accountId },
            select: { accountId: true },
          }),
          prisma.accounts.findUnique({
            where: { accountId: ExchangeAll_ID },
            select: { accountId: true },
          }),
          prisma.accounts.findUnique({
            where: { accountId: Hmula_ID },
            select: { accountId: true },
          }),
          prisma.admin.findUnique({
            // Check admin existence
            where: { id: adminId },
            select: { id: true },
          }),
        ])

      if (!mainAccount) {
        return responseReturn(res, 404, {
          error: `Not found 1 ${accountId}`,
          message: `Account with id ${accountId} not found`,
        })
      }

      if (!debtorAccount) {
        return responseReturn(res, 404, {
          error: `Not found 2 ${ExchangeAll_ID}`,
          message: `Debtor account with id ${ExchangeAll_ID} not found`,
        })
      }

      if (!daneAccount) {
        return responseReturn(res, 404, {
          error: `Not found 3 ${Hmula_ID}`,
          message: `Dane account with id ${Hmula_ID} not found`,
        })
      }

      if (!admin) {
        return responseReturn(res, 404, {
          error: `Not found 4 ${adminId}`,
          message: `Admin with id ${adminId} not found`,
        })
      }

      const newExchange = await prisma.exchangeAllCurrency.create({
  data: {
    // Do NOT include voucherNo or fiscalYear
    currencyId,
    exchangeTypeId,
    exchangeType,
    accountId,
    amountUsd,
    price,
    amountIqd,
    createdAt,
    note,
    adminId,
    // ✅ NEW columns
    ExchangeAll_ID: ExchangeAll_ID,
    Hmula_ID: Hmula_ID,
    typeId,
    type,
    currencyType,
  }
});

return responseReturn(res, 201, {
  exchangeAll: newExchange,
  allVoucherNo: newExchange.voucherNo,
  exchangeAllId: newExchange.id,
  message: 'Exchange done successfully',
});

     
    } catch (error: any) {
      console.error('Exchange creation error:', error)

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
        }
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  updateExchangeAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voucherNo } = req.params;
    const voucherNoInt = parseInt(voucherNo);

    // 1. Validate input
    const updateValidation = ExchangeAllUpdateSchema.safeParse({
      ...req.body,
      voucherNo: voucherNoInt,
    });
    if (!updateValidation.success) {
      console.error('Validation failed:', updateValidation.error.format());
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: updateValidation.error.errors,
      });
    }

    const {
      id,
      exchangeTypeId,
      exchangeType,
      accountId,
      amountUsd,
      price,
      amountIqd,
      createdAt,
      note,
      adminId,
      ExchangeAll_ID,
      Hmula_ID,
      typeId,
      type,
      currencyId,
      currencyType,
    } = updateValidation.data;

    // 2. Fetch existing exchange (include fiscalYear)
    const existing = await prisma.exchangeAllCurrency.findFirst({
      where: { id, voucherNo: voucherNoInt },
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        exchangeTypeId: true,
        exchangeType: true,
        accountId: true,
        amountUsd: true,
        price: true,
        amountIqd: true,
        createdAt: true,
        note: true,
        adminId: true,
        ExchangeAll_ID: true,
        Hmula_ID: true,
        typeId: true,
        type: true,
        currencyId: true,
        currencyType: true,
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Exchange record not found',
        message: `Exchange with id ${id} and voucherNo ${voucherNo} not found`,
      });
    }

    // 3. Validate foreign keys if they are being updated
    const checks: Promise<any>[] = [];
    if (accountId !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId },
          select: { accountId: true },
        })
      );
    }
    if (ExchangeAll_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: ExchangeAll_ID },
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
    if (adminId !== undefined) {
      checks.push(
        prisma.admin.findUnique({
          where: { id: adminId },
          select: { id: true },
        })
      );
    }

    const results = await Promise.all(checks);
    let idx = 0;
    if (accountId !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Account ${accountId} not found`,
      });
    }
    if (ExchangeAll_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Exchange account ${ExchangeAll_ID} not found`,
      });
    }
    if (Hmula_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Commission account ${Hmula_ID} not found`,
      });
    }
    if (adminId !== undefined && !results[idx]) {
      return responseReturn(res, 404, {
        error: `Admin ${adminId} not found`,
      });
    }

    // 4. Build update payload (only provided fields)
    const updatePayload: any = {};
    if (exchangeTypeId !== undefined) updatePayload.exchangeTypeId = exchangeTypeId;
    if (exchangeType !== undefined) updatePayload.exchangeType = exchangeType;
    if (accountId !== undefined) updatePayload.accountId = accountId;
    if (amountUsd !== undefined) updatePayload.amountUsd = amountUsd;
    if (price !== undefined) updatePayload.price = price;
    if (amountIqd !== undefined) updatePayload.amountIqd = amountIqd;
    if (createdAt !== undefined) updatePayload.createdAt = createdAt;
    if (note !== undefined) updatePayload.note = note;
    if (adminId !== undefined) updatePayload.adminId = adminId;
    if (ExchangeAll_ID !== undefined) updatePayload.ExchangeAll_ID = ExchangeAll_ID;
    if (Hmula_ID !== undefined) updatePayload.Hmula_ID = Hmula_ID;
    if (typeId !== undefined) updatePayload.typeId = typeId;
    if (type !== undefined) updatePayload.type = type;
    if (currencyId !== undefined) updatePayload.currencyId = currencyId;
    if (currencyType !== undefined) updatePayload.currencyType = currencyType;

    // 5. Prepare final values (merge existing with provided)
    const toNumber = (val: any): number => (val == null ? 0 : Number(val));

    const finalExchangeTypeId = exchangeTypeId ?? existing.exchangeTypeId;
    const finalExchangeType = exchangeType ?? existing.exchangeType;
    const finalAccountId = accountId ?? existing.accountId;
    const finalAmountUsd = toNumber(amountUsd ?? existing.amountUsd);
    const finalAmountIqd = toNumber(amountIqd ?? existing.amountIqd);
    const finalPrice = toNumber(price ?? existing.price);
    const finalCreatedAt = createdAt ?? existing.createdAt;
    const finalNote = note ?? existing.note ?? '';
    const finalAdminId = adminId ?? existing.adminId;
    const finalExchangeAll_ID = ExchangeAll_ID ?? existing.ExchangeAll_ID;
    const finalHmula_ID = Hmula_ID ?? existing.Hmula_ID;
    const finalTypeId = typeId ?? existing.typeId;
    const finalType = type ?? existing.type;
    const finalCurrencyId = currencyId ?? existing.currencyId;
    const finalCurrencyType = currencyType ?? existing.currencyType;

    // 6. Fetch currency price for the (final) currency (to compute diff)
    const IQD_CURRENCY_ID = 2; // IQD is always 2

    const currencyRecord = await prisma.currency.findUnique({
      where: { currencyId: finalCurrencyId },
      select: { currencyPrice: true, currency: true },
    });
    if (!currencyRecord || currencyRecord.currencyPrice === null) {
      return responseReturn(res, 500, {
        error: `Currency price for currencyId ${finalCurrencyId} not found or is null`,
      });
    }
    const currencyPrice = Number(currencyRecord.currencyPrice);

    // 7. Compute difference (same as trigger: diff = amountIqd - (currencyPrice * amountUsd))
    const diff = finalAmountIqd - (currencyPrice * finalAmountUsd);

    // 8. Transaction: update exchange + replace movements
    const updated = await prisma.$transaction(async (tx) => {
      // 8a. Update the exchange record
      const updatedExchange = await tx.exchangeAllCurrency.update({
        where: { id: existing.id },
        data: updatePayload,
      });

      // 8b. Delete all existing movements for this voucher and fiscal year
      // (The trigger only creates movements for this exchange, so we can safely delete all movements with this voucherNo+fiscalYear)
      await tx.movement.deleteMany({
        where: {
          voucherNo: voucherNoInt,
          fiscalYear: existing.fiscalYear!, 
          typeId: finalTypeId, 
        },
      });

      // 8c. Helper to create a movement
      const createMovement = async (
        typeStr: string,
        debtorId: number,
        creditorId: number,
        amount: number,
        currencyId: number,
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
            currencyId,
            note,
            typeId: finalTypeId,
            type: typeStr,
            receiptNo: 0, // or voucherNoInt if you prefer
          },
        });
      };

      // Strings matching the PostgreSQL trigger for exchangeAllCurrency
      const TYPE_USD = `ئاڵوگۆڕی دراوەکان/تصريف العملات - بە ${currencyRecord.currency}`;
      const TYPE_IQD = 'ئاڵوگۆڕی دراوەکان/تصريف العملات - بە دۆلار';
      const TYPE_DIFF = 'جیاوازی نرخ/فرق السعر';

      if (finalExchangeTypeId === 1) {
        // Main USD movement (using the exchanged currency, not USD)
        await createMovement(
          TYPE_USD,
          finalAccountId,
          finalExchangeAll_ID,
          finalAmountUsd,
          finalCurrencyId,      // currency of the USD amount
          finalNote
        );
        // Main IQD movement
        await createMovement(
          TYPE_IQD,
          finalExchangeAll_ID,
          finalAccountId,
          finalAmountIqd,
          IQD_CURRENCY_ID,
          finalNote
        );

        if (diff < 0) {
          // amountIqd < currencyPrice * amountUsd → Hmula pays ExchangeAll
          await createMovement(
            TYPE_DIFF,
            finalHmula_ID,
            finalExchangeAll_ID,
            Math.abs(diff),
            IQD_CURRENCY_ID,
            'فرق سعر'
          );
        } else if (diff > 0) {
          // amountIqd > currencyPrice * amountUsd → ExchangeAll pays Hmula
          await createMovement(
            TYPE_DIFF,
            finalExchangeAll_ID,
            finalHmula_ID,
            diff,
            IQD_CURRENCY_ID,
            'فرق سعر'
          );
        }
      } else if (finalExchangeTypeId === 2) {
        // Main USD movement (reverse direction)
        await createMovement(
          TYPE_USD,
          finalExchangeAll_ID,
          finalAccountId,
          finalAmountUsd,
          finalCurrencyId,
          finalNote
        );
        // Main IQD movement (reverse direction)
        await createMovement(
          TYPE_IQD,
          finalAccountId,
          finalExchangeAll_ID,
          finalAmountIqd,
          IQD_CURRENCY_ID,
          finalNote
        );

        if (diff < 0) {
          // amountIqd < currencyPrice * amountUsd → ExchangeAll pays Hmula
          await createMovement(
            TYPE_DIFF,
            finalExchangeAll_ID,
            finalHmula_ID,
            Math.abs(diff),
            IQD_CURRENCY_ID,
            'فرق سعر'
          );
        } else if (diff > 0) {
          // amountIqd > currencyPrice * amountUsd → Hmula pays ExchangeAll
          await createMovement(
            TYPE_DIFF,
            finalHmula_ID,
            finalExchangeAll_ID,
            diff,
            IQD_CURRENCY_ID,
            'فرق سعر'
          );
        }
      }

      return updatedExchange;
    });

    return responseReturn(res, 200, {
      exchangeAll: updated,
      voucherNo,
      message: 'Exchange updated successfully',
    });
  } catch (error: any) {
    console.error('Exchange update error:', error);

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
            message: 'Exchange record not found',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

 getExchangeAllByVoucherNo = async (
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

    // --- Parse numbers ---
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
      // Use the composite unique key (assumes @@unique([fiscalYear, voucherNo]) on ExchangeAllCurrency)
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- Fetch the exchange All record with related data ---
    const exchangeAll = await prisma.exchangeAllCurrency.findUnique({
      where: whereClause,
      include: {
        account: {
          select: {
            accountId: true,
            name: true,
            phone: true,
            address: true,
          },
        },
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
            currencyPrice: true,
          },
        },
      },
    });

    if (!exchangeAll) {
      return responseReturn(res, 404, {
        error: 'Exchange All not found',
        message: `Exchange All record with provided identifier not found`,
      });
    }

    return responseReturn(res, 200, {
      exchangeAll,
      message: 'Exchange All retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get exchange All error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve exchange All',
    });
  }
};


 getAllExchanges = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = ExchangeAllQuerySchema.safeParse(req.query);
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
      exchangeTypeId,
      currencyId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      accountId,
      fromDate,
      toDate,
    } = queryValidation.data;

    // -----------------------------------------------------------------
    // Build filter conditions
    // -----------------------------------------------------------------
    const whereConditions: Prisma.ExchangeAllCurrencyWhereInput = {};

    // Specific filters
    if (exchangeTypeId) whereConditions.exchangeTypeId = exchangeTypeId;
    if (currencyId) whereConditions.currencyId = currencyId;
    if (accountId) whereConditions.accountId = accountId;

    // Date filtering
    if (fromDate || toDate) {
      if (fromDate) {
        const fromDateAdjusted = moment
          .utc(fromDate)
          .utcOffset('+03:00')
          .startOf('day')
          .toDate();
        whereConditions.createdAt = {
          ...(whereConditions.createdAt as any),
          gte: fromDateAdjusted,
        };
      }
      if (toDate) {
        const toDateAdjusted = moment
          .utc(toDate)
          .utcOffset('+03:00')
          .endOf('day')
          .toDate();
        whereConditions.createdAt = {
          ...(whereConditions.createdAt as any),
          lte: toDateAdjusted,
        };
      }
    } else {
      // Default to current fiscal year (or calendar year) if no date range provided
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // Search conditions
    if (searchValue) {
      const searchConditions: Prisma.ExchangeAllCurrencyWhereInput[] = [];

      // Numeric search (voucherNo)
      const numericSearch = !isNaN(Number(searchValue)) ? Number(searchValue) : null;
      if (numericSearch !== null) {
        searchConditions.push({ voucherNo: numericSearch });
      }

      // Text search on account name (case‑insensitive)
      searchConditions.push({
        account: {
          name: {
            contains: searchValue,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      });

      // Optional: search on note
      searchConditions.push({
        note: {
          contains: searchValue,
          mode: Prisma.QueryMode.insensitive,
        },
      });

      if (searchConditions.length > 0) {
        whereConditions.OR = searchConditions;
      }
    }

    // -----------------------------------------------------------------
    // Execute queries in parallel
    // -----------------------------------------------------------------
    const [exchangeAllCurrencies, totalCount] = await Promise.all([
      prisma.exchangeAllCurrency.findMany({
        skip: (page - 1) * parPage,
        take: parPage,
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
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
      prisma.exchangeAllCurrency.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      exchangeAllCurrencies,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'Exchange All retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get all exchange All error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve exchange All records',
    });
  }
};
  
deleteExchangeAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, voucherNo, fiscalYear } = req.query;

    // --- Validate identifier combination ---
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

    // --- Parse numbers ---
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
      // Use the composite unique key (generated by Prisma from @@unique([fiscalYear, voucherNo]))
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- Fetch the existing exchange All record (include all fields needed for archiving) ---
    const existing = await prisma.exchangeAllCurrency.findUnique({
      where: whereClause,
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        createdAt: true,
        exchangeTypeId: true,
        exchangeType: true,
        accountId: true,
        amountUsd: true,
        price: true,
        amountIqd: true,
        note: true,
        adminId: true,
        ExchangeAll_ID: true,
        Hmula_ID: true,
        typeId: true,
        type: true,
        currencyId: true,
        currencyType: true,
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Exchange All record not found',
      });
    }

    // --- Prepare data for the cancelled exchange record (if you have a CancelledExchangeAll model) ---
    // Uncomment and adjust field names if archiving is required
    /*
    const cancelledData = {
      voucherNo: existing.voucherNo,
      fiscalYear: existing.fiscalYear,
      createdAt: existing.createdAt,
      exchangeTypeId: existing.exchangeTypeId,
      exchangeType: existing.exchangeType,
      accountId: existing.accountId,
      amountUsd: existing.amountUsd,
      price: existing.price,
      amountIqd: existing.amountIqd,
      note: existing.note ?? '',
      adminId: existing.adminId,
      ExchangeAll_ID: existing.ExchangeAll_ID,
      Hmula_ID: existing.Hmula_ID,
      typeId: existing.typeId,
      type: existing.type,
      currencyId: existing.currencyId,
      currencyType: existing.currencyType,
    };
    */

    // --- Transaction: delete movements, delete original ---
    const [deletedMovements, deletedExchange] = await prisma.$transaction([
      // prisma.cancelledExchangeAll.create({ data: cancelledData }), // uncomment if archiving
      prisma.movement.deleteMany({
        where: {
          voucherNo: existing.voucherNo!,
          fiscalYear: existing.fiscalYear!,
          typeId: existing.typeId, // ensures we only delete movements belonging to this exchange type
        },
      }),
      prisma.exchangeAllCurrency.delete({
        where: { id: existing.id },
      }),
    ]);

    return responseReturn(res, 200, {
      // cancelledRecord, // uncomment if archiving
      deletedMovements: deletedMovements.count,
      exchangeAll: deletedExchange,
      message: 'Exchange All deleted successfully',
    });
  } catch (error: any) {
    console.error('Exchange All deletion error:', error);

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
}

export default new ExchangeAllController()
