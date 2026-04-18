import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { responseReturn } from '../utils/response'

import { FirstBalanceCreateSchema, FirstBalanceDeleteSchema, FirstBalanceQuerySchema, FirstBalanceUpdateByIdentifierSchema } from '../types/firstBalanceType'
import prisma from '../utils/prisma'
// const prisma = new PrismaClient()

const RETAINED_EARNINGS_ACCOUNT_ID = 203;

class FirstBalanceController {
createFirstBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const validationResult = FirstBalanceCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const { accountId, ...firstBalanceData } = validationResult.data;

    // Verify target account exists
    const account = await prisma.accounts.findUnique({
      where: { accountId },
    });
    if (!account) {
      return responseReturn(res, 404, {
        error: 'Account not found',
        message: `Account with ID ${accountId} does not exist`,
      });
    }

    // Verify currency exists
    const currency = await prisma.currency.findUnique({
      where: { currencyId: firstBalanceData.currencyId },
    });
    if (!currency) {
      return responseReturn(res, 404, {
        error: 'Currency not found',
        message: `Currency with ID ${firstBalanceData.currencyId} does not exist`,
      });
    }

    // Verify retained earnings account exists (optional but recommended)
    const retainedEarningsAccount = await prisma.accounts.findUnique({
      where: { accountId: RETAINED_EARNINGS_ACCOUNT_ID },
    });
    if (!retainedEarningsAccount) {
      return responseReturn(res, 500, {
        error: 'Configuration error',
        message: `Retained earnings account (ID ${RETAINED_EARNINGS_ACCOUNT_ID}) not found.`,
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Determine the next voucher number across both FirstBalance and NewYear tables
      // for the same fiscal year and typeId (if typeId is shared; otherwise you can simplify)
      const [maxFirstBalance, maxNewYear] = await Promise.all([
        tx.firstBalance.findFirst({
          where: {
            fiscalYear: firstBalanceData.fiscalYear,
            typeId: firstBalanceData.typeId,
          },
          orderBy: { voucherNo: 'desc' },
          select: { voucherNo: true },
        }),
        tx.newYear.findFirst({
          where: {
            fiscalYear: firstBalanceData.fiscalYear,
            typeId: firstBalanceData.typeId,
          },
          orderBy: { voucherNo: 'desc' },
          select: { voucherNo: true },
        }),
      ]);

      const maxVoucher = Math.max(
        maxFirstBalance?.voucherNo || 0,
        maxNewYear?.voucherNo || 0
      );
      const newVoucherNo = maxVoucher + 1;

      // 1. Create audit record in FirstBalance
      const newFirstBalance = await tx.firstBalance.create({
  data: {
    currencyId: firstBalanceData.currencyId,
    balanceTypeId: firstBalanceData.balanceTypeId,
    balanceType: firstBalanceData.balanceType,
    voucherNo: newVoucherNo,
    fiscalYear: firstBalanceData.fiscalYear,
    createdAt: firstBalanceData.createdAt,
    accountId,
    typeId: firstBalanceData.typeId,
    type: firstBalanceData.type,
    balance: firstBalanceData.balance,
    note: firstBalanceData.note || '',
    USER_ID: firstBalanceData.USER_ID,
  },
});

      // 2. Create double‑entry opening balance in NewYear (one record per pair)
      const newYearData = {
  fiscalYear: firstBalanceData.fiscalYear,
  type: firstBalanceData.type,
  typeId: firstBalanceData.typeId,
  voucherNo: newVoucherNo,
  currencyId: firstBalanceData.currencyId,
  note: firstBalanceData.note || '',
  USER_ID: firstBalanceData.USER_ID,
  amountTaking: firstBalanceData.balance,
  amountPay: firstBalanceData.balance,
  firstBalanceId: newFirstBalance.id, // 👈 direct relation
};

if (firstBalanceData.balanceTypeId === 1) {
  await tx.newYear.create({
    data: {
      ...newYearData,
      debtorId: accountId,
      creditorId: RETAINED_EARNINGS_ACCOUNT_ID,
    },
  });
} else if (firstBalanceData.balanceTypeId === 2) {
  await tx.newYear.create({
    data: {
      ...newYearData,
      debtorId: RETAINED_EARNINGS_ACCOUNT_ID,
      creditorId: accountId,
    },
  });
}

      return { newFirstBalance, newVoucherNo };
    });

    return responseReturn(res, 201, {
      firstBalance: result.newFirstBalance,
      newVoucherNo: result.newVoucherNo,
      message: 'First Balance and New Year opening entry created successfully',
    });
  } catch (error: any) {
    console.error('First Balance creation error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate entry',
            fields: error.meta?.target,
            message: 'First Balance conflict detected',
          });
        case 'P2003':
          return responseReturn(res, 400, {
            error: 'Invalid reference',
            message: 'Linked account, currency, or user does not exist',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

updateFirstBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = FirstBalanceUpdateByIdentifierSchema.safeParse(req.body);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const { fiscalYear, voucherNo, typeId, ...updateFields } = validationResult.data;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the existing FirstBalance record
      const existing = await tx.firstBalance.findUnique({
        where: { fiscalYear_voucherNo_typeId: { fiscalYear, voucherNo, typeId } },
      });
      if (!existing) {
        throw new Error('FirstBalance not found');
      }

      // 2. Prepare update data for FirstBalance
      const firstBalanceUpdate: any = {};
      if (updateFields.accountId !== undefined) firstBalanceUpdate.accountId = updateFields.accountId;
      if (updateFields.currencyId !== undefined) firstBalanceUpdate.currencyId = updateFields.currencyId;
      if (updateFields.balanceTypeId !== undefined) firstBalanceUpdate.balanceTypeId = updateFields.balanceTypeId;
      if (updateFields.balanceType !== undefined) firstBalanceUpdate.balanceType = updateFields.balanceType;
      if (updateFields.balance !== undefined) firstBalanceUpdate.balance = updateFields.balance;
      if (updateFields.note !== undefined) firstBalanceUpdate.note = updateFields.note;
      if (updateFields.USER_ID !== undefined) firstBalanceUpdate.USER_ID = updateFields.USER_ID;
      if (updateFields.createdAt !== undefined) firstBalanceUpdate.createdAt = updateFields.createdAt;

      // 3. Determine effective values after update
      const effectiveAccountId = updateFields.accountId ?? existing.accountId;
      const effectiveCurrencyId = updateFields.currencyId ?? existing.currencyId;
      const effectiveBalanceTypeId = updateFields.balanceTypeId ?? existing.balanceTypeId;

      // 4. Validate foreign keys if changed
      if (updateFields.accountId !== undefined && updateFields.accountId !== existing.accountId) {
        const account = await tx.accounts.findUnique({
          where: { accountId: updateFields.accountId },
        });
        if (!account) {
          throw new Error(`Account with ID ${updateFields.accountId} does not exist`);
        }
      }

      if (updateFields.currencyId !== undefined && updateFields.currencyId !== existing.currencyId) {
        const currency = await tx.currency.findUnique({
          where: { currencyId: updateFields.currencyId },
        });
        if (!currency) {
          throw new Error(`Currency with ID ${updateFields.currencyId} does not exist`);
        }
      }

      // 5. Update FirstBalance
      const updatedFirstBalance = await tx.firstBalance.update({
        where: { fiscalYear_voucherNo_typeId: { fiscalYear, voucherNo, typeId } },
        data: firstBalanceUpdate,
      });

      // 6. Prepare NewYear update (based on effective values)
      const newYearUpdate: any = {};

      if (updateFields.balance !== undefined) {
        newYearUpdate.amountTaking = updateFields.balance;
        newYearUpdate.amountPay = updateFields.balance;
      }
      if (updateFields.note !== undefined) {
        newYearUpdate.note = updateFields.note;
      }
      if (updateFields.currencyId !== undefined) {
        newYearUpdate.currencyId = updateFields.currencyId;
      }

      // Recompute debtor/creditor based on effective values
      if (effectiveBalanceTypeId === 1) {
        newYearUpdate.debtorId = effectiveAccountId;
        newYearUpdate.creditorId = RETAINED_EARNINGS_ACCOUNT_ID;
      } else if (effectiveBalanceTypeId === 2) {
        newYearUpdate.debtorId = RETAINED_EARNINGS_ACCOUNT_ID;
        newYearUpdate.creditorId = effectiveAccountId;
      }

      // 7. Find associated NewYear record via direct relation
      let newYearRecord = await tx.newYear.findUnique({
        where: { firstBalanceId: existing.id },
      });

      if (!newYearRecord) {
        // Fallback for legacy data (pre‑migration)
        console.warn(`Legacy NewYear record found via composite key for FirstBalance ID ${existing.id}`);
        newYearRecord = await tx.newYear.findFirst({
          where: { fiscalYear, typeId, voucherNo },
        });
        if (!newYearRecord) {
          throw new Error('Associated NewYear record not found');
        }

        // Combine migration (set firstBalanceId) with the user's changes
        const combinedUpdate = {
          ...newYearUpdate,
          firstBalanceId: existing.id,
        };

        await tx.newYear.update({
          where: {
            fiscalYear_id: {
              fiscalYear: newYearRecord.fiscalYear,
              id: newYearRecord.id,
            },
          },
          data: combinedUpdate,
        });

        // Re‑fetch the record (optional, but ensures consistency)
        newYearRecord = await tx.newYear.findUnique({
          where: { firstBalanceId: existing.id },
        });
      } else {
        // Direct relation exists – update with changes only
        await tx.newYear.update({
          where: {
            fiscalYear_id: {
              fiscalYear: newYearRecord.fiscalYear,
              id: newYearRecord.id,
            },
          },
          data: newYearUpdate,
        });
      }

      return { updatedFirstBalance };
    });

    return responseReturn(res, 200, {
      firstBalance: result.updatedFirstBalance,
      message: 'First Balance updated successfully',
    });
  } catch (error: any) {
    console.error('First Balance update error:', error);

    if (error.message === 'FirstBalance not found') {
      return responseReturn(res, 404, { error: 'FirstBalance not found' });
    }
    if (error.message.includes('Account with ID')) {
      return responseReturn(res, 404, { error: error.message });
    }
    if (error.message.includes('Currency with ID')) {
      return responseReturn(res, 404, { error: error.message });
    }
    if (error.message === 'Associated NewYear record not found') {
      return responseReturn(res, 500, { error: 'Inconsistent data: NewYear record missing' });
    }

    // Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, { error: 'Record not found' });
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate entry',
            message: 'Update would violate a unique constraint',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error',
    });
  }
};

getFirstBalances = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const queryValidation = FirstBalanceQuerySchema.safeParse(req.query);
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
      sortBy,
      sortOrder,
      currencyId,
      fiscalYear,
      accountId,
      balanceTypeId,
      fromDate,
      toDate,
    } = queryValidation.data;

    // ------------------------------------------------------------------
    // Build Prisma where conditions
    // ------------------------------------------------------------------
    const whereConditions: Prisma.FirstBalanceWhereInput = {};

    // Exact matches
    if (currencyId) whereConditions.currencyId = currencyId;
    if (fiscalYear) whereConditions.fiscalYear = fiscalYear;
    if (accountId) whereConditions.accountId = accountId;
    if (balanceTypeId) whereConditions.balanceTypeId = balanceTypeId;

    // Search across multiple fields
    if (searchValue) {
      whereConditions.OR = [
        // Search by voucher number (if searchValue is numeric)
        ...(!isNaN(Number(searchValue))
          ? [{ voucherNo: Number(searchValue) }]
          : []),
        // Search by account name
        { account: { name: { contains: searchValue, mode: 'insensitive' } } },
        // Search by note
        { note: { contains: searchValue, mode: 'insensitive' } },
        // Search by type (the transaction type string)
        { type: { contains: searchValue, mode: 'insensitive' } },
      ];
    }

    // ------------------------------------------------------------------
    // Date filtering (on createdAt)
    // If no dates provided, default to current year (like payment example)
    // ------------------------------------------------------------------
    if (fromDate || toDate) {
      whereConditions.createdAt = {};
      if (fromDate) whereConditions.createdAt.gte = fromDate;
      if (toDate) whereConditions.createdAt.lte = toDate;
    } else {
      // Default to current year (Jan 1 – Dec 31)
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // ------------------------------------------------------------------
    // Execute count and findMany in parallel
    // ------------------------------------------------------------------
    const [firstBalances, totalCount] = await Promise.all([
      prisma.firstBalance.findMany({
        where: whereConditions,
        skip: (page - 1) * parPage,
        take: parPage,
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
          currency: true,                     // include full currency details
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      prisma.firstBalance.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      firstBalances,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'First balances retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get first balances error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

deleteFirstBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = FirstBalanceDeleteSchema.safeParse(req.params);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const { fiscalYear, voucherNo, typeId } = validationResult.data;

    await prisma.$transaction(async (tx) => {
      // 1. Find the FirstBalance record by its composite key
      const firstBalance = await tx.firstBalance.findUnique({
        where: {
          fiscalYear_voucherNo_typeId: { fiscalYear, voucherNo, typeId },
        },
        include: { newYear: true }, // include the relation if it exists
      });

      if (!firstBalance) {
        throw new Error('FirstBalance not found');
      }

      // 2. Delete the associated NewYear record
      if (firstBalance.newYear) {
        // Direct relation exists – delete using the unique firstBalanceId
        await tx.newYear.delete({
          where: { firstBalanceId: firstBalance.id },
        });
      } else {
        // Fallback for legacy data (pre‑relation) – find by composite key
        const legacyNewYear = await tx.newYear.findFirst({
          where: { fiscalYear, typeId, voucherNo },
        });
        if (legacyNewYear) {
          await tx.newYear.delete({
            where: {
              fiscalYear_id: {
                fiscalYear: legacyNewYear.fiscalYear,
                id: legacyNewYear.id,
              },
            },
          });
        }
        // If no NewYear exists, proceed (inconsistent data, but delete FirstBalance anyway)
      }

      // 3. Delete the FirstBalance record
      await tx.firstBalance.delete({
        where: { id: firstBalance.id },
      });

      return { success: true };
    });

    return responseReturn(res, 200, {
      message: 'First Balance and associated New Year entry deleted successfully',
    });
  } catch (error: any) {
    console.error('First Balance deletion error:', error);

    if (error.message === 'FirstBalance not found') {
      return responseReturn(res, 404, { error: 'FirstBalance not found' });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, { error: 'Record not found' });
        case 'P2003':
          return responseReturn(res, 400, {
            error: 'Cannot delete due to existing references',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error',
    });
  }
};


}

export default new FirstBalanceController()
