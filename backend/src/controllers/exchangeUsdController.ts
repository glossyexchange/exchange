import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import moment from 'moment'
import { ExchangeUSDCreateSchema, ExchangeUSDQuerySchema, ExchangeUSDUpdateSchema } from '../types/exchangeUsd.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'



class ExchangeUsdController {
  createExchangeUsd = async (req: Request, res: Response): Promise<void> => {
    try {
      const importValidation = ExchangeUSDCreateSchema.safeParse(req.body)
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
        ExchangeUsd_ID,
        Hmula_ID,
        typeId,
        type,
        currencyId,
        currencyType,
        ...rest
      } = importValidation.data

      // Generate shared voucherNo
      const lastOrder = await prisma.exchangeUsd.findFirst({
        orderBy: { voucherNo: 'desc' },
        select: { voucherNo: true },
      })
      const newVoucherNo = (lastOrder?.voucherNo || 100) + 1
      
      const USD = 1
      const IQD = 2
      const currencyTypeIQD = "دینار"

      const currencyUsdPrice = await prisma.currency.findUnique({
        where: { currencyId: USD },
        select: { currencyPrice: true },
      }) as any

      const different = currencyUsdPrice.CurrencyPrice * amountUsd - amountIqd;   
      
      // Check foreign keys
      const [mainAccount, debtorAccount, daneAccount, admin] = await Promise.all([
        prisma.accounts.findUnique({
          where: { accountId: accountId },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: ExchangeUsd_ID },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: Hmula_ID },
          select: { accountId: true },
        }),
        prisma.admin.findUnique({
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
          error: `Not found 2 ${ExchangeUsd_ID}`,
          message: `Debtor account with id ${ExchangeUsd_ID} not found`,
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

      const newExchange = await prisma.exchangeUsd.create({
  data: {

    exchangeTypeId,
    exchangeType,
    accountId,
    amountUsd,
    price,
    amountIqd,
    createdAt,
    note,
    adminId,
    ExchangeUsd_ID: ExchangeUsd_ID,
    Hmula_ID: Hmula_ID,
    typeId,
    type,
    currencyType,
  }
});

return responseReturn(res, 201, {
  exchangeUsd: newExchange,
  UsdVoucherNo: newExchange.voucherNo,
  exchangeId: newExchange.id,
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


getExchangeUSDByVoucherNo = async (req: Request, res: Response): Promise<void> => {
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
      // Use the composite unique key (assumes @@unique([fiscalYear, voucherNo]) on ExchangeUsd)
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- Fetch the exchange USD record ---
    const exchangeUsd = await prisma.exchangeUsd.findUnique({
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
        // exchangeType: {
        //   select: {
        //     id: true,
        //     name: true,
        //   },
        // },
        admin: {
          select: {
            id: true,
            name: true,
          },
        },
        // currency: true, // uncomment if needed
      },
    });

    if (!exchangeUsd) {
      return responseReturn(res, 404, {
        error: 'Exchange USD not found',
        message: `Exchange USD record with provided identifier not found`,
      });
    }

    return responseReturn(res, 200, {
      exchangeUsd,
      message: 'Exchange USD retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get exchange USD error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve exchange USD',
    });
  }
};

updateExchangeUsd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voucherNo } = req.params;
    const voucherNoInt = parseInt(voucherNo);

    console.log('Updating exchange USD with voucherNo:', req.params);
    console.log('Updating exchange USD with voucherNo:', req.body);

    // 1. Validate input (ensure your schema does NOT include currencyId)
    const updateValidation = ExchangeUSDUpdateSchema.safeParse({
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
      ExchangeUsd_ID,
      Hmula_ID,
      typeId,
      type,
      currencyType,
      // currencyId is removed – not a field in your model
    } = updateValidation.data;

    // 2. Fetch existing exchange (include fiscalYear)
    const existing = await prisma.exchangeUsd.findFirst({
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
        ExchangeUsd_ID: true,
        Hmula_ID: true,
        typeId: true,
        type: true,
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
    if (ExchangeUsd_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: ExchangeUsd_ID },
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
    if (ExchangeUsd_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Debtor account ${ExchangeUsd_ID} not found`,
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

    // 4. Build update payload (only provided fields) – CORRECTED
    const updatePayload: any = {};

    // Direct scalar assignments
    if (exchangeType !== undefined) updatePayload.exchangeType = exchangeType;
    if (type !== undefined) updatePayload.type = type;
    if (currencyType !== undefined) updatePayload.currencyType = currencyType;
    if (amountUsd !== undefined) updatePayload.amountUsd = amountUsd;
    if (price !== undefined) updatePayload.price = price;
    if (amountIqd !== undefined) updatePayload.amountIqd = amountIqd;
    if (createdAt !== undefined) updatePayload.createdAt = createdAt;
    if (note !== undefined) updatePayload.note = note;
    if (exchangeTypeId !== undefined) updatePayload.exchangeTypeId = exchangeTypeId;
    if (typeId !== undefined) updatePayload.typeId = typeId;
    if (ExchangeUsd_ID !== undefined) updatePayload.ExchangeUsd_ID = ExchangeUsd_ID;
    if (Hmula_ID !== undefined) updatePayload.Hmula_ID = Hmula_ID;

    // Relation fields (using connect)
    if (accountId !== undefined) {
      updatePayload.account = { connect: { accountId } };
    }
    if (adminId !== undefined) {
      updatePayload.admin = { connect: { id: adminId } };
    }

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
    const finalExchangeUsd_ID = ExchangeUsd_ID ?? existing.ExchangeUsd_ID;
    const finalHmula_ID = Hmula_ID ?? existing.Hmula_ID;
    const finalTypeId = typeId ?? existing.typeId;
    const finalType = type ?? existing.type;
    const finalCurrencyType = currencyType ?? existing.currencyType;

    // 6. Fetch current USD price
    const USD_CURRENCY_ID = 1;
    const IQD_CURRENCY_ID = 2;
    const currencyUsdPrice = await prisma.currency.findUnique({
      where: { currencyId: USD_CURRENCY_ID },
      select: { currencyPrice: true },
    });
    if (!currencyUsdPrice || currencyUsdPrice.currencyPrice === null) {
      return responseReturn(res, 500, {
        error: 'USD currency price not found or is null',
      });
    }
    const usdPrice = Number(currencyUsdPrice.currencyPrice);

    // 7. Compute difference
    const diff = finalAmountIqd - (usdPrice * finalAmountUsd);

    // 8. Transaction: update exchange + replace movements
    const updated = await prisma.$transaction(async (tx) => {
      // 8a. Update the exchange record
      const updatedExchange = await tx.exchangeUsd.update({
        where: { id: existing.id },
        data: updatePayload,
      });

      // 8b. Delete all existing movements for this voucher and fiscal year
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
            receiptNo: 0,
          },
        });
      };

      // Strings matching the PostgreSQL trigger
      const TYPE_USD = 'ئاڵوگۆڕی دۆلار/صريف الدولار - بە دۆلار';
      const TYPE_IQD = 'ئاڵوگۆڕی دۆلار/صريف الدولار - بە دینار';
      const TYPE_DIFF = 'عمولە';

      if (finalExchangeTypeId === 1) {
        // Main USD movement
        await createMovement(
          TYPE_USD,
          finalAccountId,
          finalExchangeUsd_ID,
          finalAmountUsd,
          USD_CURRENCY_ID,
          finalNote
        );
        // Main IQD movement
        await createMovement(
          TYPE_IQD,
          finalExchangeUsd_ID,
          finalAccountId,
          finalAmountIqd,
          IQD_CURRENCY_ID,
          finalNote
        );

        if (diff < 0) {
          await createMovement(
            TYPE_DIFF,
            finalHmula_ID,
            finalExchangeUsd_ID,
            Math.abs(diff),
            IQD_CURRENCY_ID,
            'عمولە'
          );
        } else if (diff > 0) {
          await createMovement(
            TYPE_DIFF,
            finalExchangeUsd_ID,
            finalHmula_ID,
            diff,
            IQD_CURRENCY_ID,
            'عمولە'
          );
        }
      } else if (finalExchangeTypeId === 2) {
        // Main USD movement (reverse direction)
        await createMovement(
          TYPE_USD,
          finalExchangeUsd_ID,
          finalAccountId,
          finalAmountUsd,
          USD_CURRENCY_ID,
          finalNote
        );
        // Main IQD movement (reverse direction)
        await createMovement(
          TYPE_IQD,
          finalAccountId,
          finalExchangeUsd_ID,
          finalAmountIqd,
          IQD_CURRENCY_ID,
          finalNote
        );

        if (diff < 0) {
          await createMovement(
            TYPE_DIFF,
            finalExchangeUsd_ID,
            finalHmula_ID,
            Math.abs(diff),
            IQD_CURRENCY_ID,
            'عمولە'
          );
        } else if (diff > 0) {
          await createMovement(
            TYPE_DIFF,
            finalHmula_ID,
            finalExchangeUsd_ID,
            diff,
            IQD_CURRENCY_ID,
            'عمولە'
          );
        }
      }

      return updatedExchange;
    });

    return responseReturn(res, 200, {
      exchangeUsd: updated,
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

 

 getAllUsdExchanges = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = ExchangeUSDQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
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
      sortBy = 'createdAt',
      sortOrder = 'desc',
      accountId,
      fromDate,
      toDate,
    } = queryValidation.data;

    // -----------------------------------------------------------------
    // Build filter conditions
    // -----------------------------------------------------------------
    const whereConditions: Prisma.ExchangeUsdWhereInput = {};

    // Specific filters
    if (exchangeTypeId) whereConditions.exchangeTypeId = exchangeTypeId;
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
      // Default to current year if no date range provided
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
      const searchConditions: Prisma.ExchangeUsdWhereInput[] = [];

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

      // You can add more fields here if needed (e.g., account phone/address)

      if (searchConditions.length > 0) {
        whereConditions.OR = searchConditions;
      }
    }

    // -----------------------------------------------------------------
    // Execute queries in parallel
    // -----------------------------------------------------------------
    const [exchangeUsds, totalCount] = await Promise.all([
      prisma.exchangeUsd.findMany({
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
       
          // currency: true, // include if you have a currency relation
        },
      }),
      prisma.exchangeUsd.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      exchangeUsds,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'Exchange USD retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get all exchange USD error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve exchange USD',
    });
  }
};

deleteExchangeUsd = async (req: Request, res: Response): Promise<void> => {
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

    // --- Fetch the existing exchange record (include all fields needed for archiving) ---
    const existing = await prisma.exchangeUsd.findUnique({
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
        ExchangeUsd_ID: true,
        Hmula_ID: true,
        typeId: true,
        type: true,
        // currencyId: true,
        currencyType: true,
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Exchange USD record not found',
      });
    }

    // --- Prepare data for the cancelled exchange record ---
    // Adjust field names to match your CancelledExchangeUsd model (here assumed to be the same camelCase as exchangeUsd)
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
      ExchangeUsd_ID: existing.ExchangeUsd_ID,
      Hmula_ID: existing.Hmula_ID,
      typeId: existing.typeId,
      type: existing.type,
      // currencyId: existing.currencyId,
      currencyType: existing.currencyType,
    };

    // --- Transaction: archive, delete movements, delete original ---
    const [ deletedMovements, deletedExchange] = await prisma.$transaction([
      // prisma.cancelledExchangeUsd.create({ data: cancelledData }),
      prisma.movement.deleteMany({
        where: {
         voucherNo: existing.voucherNo!,
          fiscalYear: existing.fiscalYear!,
          typeId: existing.typeId, 
        },
      }),
      prisma.exchangeUsd.delete({
        where: { id: existing.id },
      }),
    ]);

    return responseReturn(res, 200, {
      // cancelledRecord,
      deletedMovements: deletedMovements.count,
      exchangeUsd:deletedExchange,
      message: 'Exchange USD deleted and archived successfully',
    });
  } catch (error: any) {
    console.error('Exchange USD deletion error:', error);

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

export default new ExchangeUsdController()
