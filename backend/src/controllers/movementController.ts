import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import moment from 'moment'

import { generalBalanceQuerySchema, movementQuerySchema } from "../types/movement.schema"
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'

class MovementController {
getMovementsByAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationResult = movementQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const {
      accountId,
      currencyId,
      fiscalYear,
      fromDate,
      toDate,
      page,
      parPage,
      searchValue,
      sortBy,
      sortOrder,
    } = validationResult.data;

    console.log('Opening query params:', { fiscalYear, currencyId, accountId });

    const skip = (page - 1) * parPage;

    // --- Date filter for movements in the selected range (fromDate to toDate) ---
    const dateFilter: Prisma.DateTimeFilter = {};
    if (fromDate) {
      dateFilter.gte = moment
        .utc(fromDate)
        .utcOffset('+03:00')
        .startOf('day')
        .toDate();
    }
    if (toDate) {
      dateFilter.lte = moment
        .utc(toDate)
        .utcOffset('+03:00')
        .endOf('day')
        .toDate();
    }

    // --- Base filter for movements (common to all movement queries) ---
    const movementBaseFilter: Prisma.MovementWhereInput = {
      currencyId,
      ...(fiscalYear && { fiscalYear }),
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    // --- Search conditions for movements ---
    const andConditions: Prisma.MovementWhereInput[] = [];
    if (searchValue) {
      const numericSearch = !isNaN(Number(searchValue)) ? Number(searchValue) : null;
      const textSearch: Prisma.MovementWhereInput = {
        note: { contains: searchValue, mode: Prisma.QueryMode.insensitive },
      };
      if (numericSearch !== null) {
        andConditions.push({
          OR: [{ voucherNo: numericSearch }, textSearch],
        });
      } else {
        andConditions.push(textSearch);
      }
    }
    if (andConditions.length > 0) {
      movementBaseFilter.AND = andConditions;
    }

    // --- Filters for movement list (movements where account is debtor OR creditor) ---
    const listFilter: Prisma.MovementWhereInput = {
      ...movementBaseFilter,
      OR: [{ debtorId: accountId }, { creditorId: accountId }],
    };

    // --- Filters for movement sums (within selected range) ---
    const debtorFilter: Prisma.MovementWhereInput = {
      ...movementBaseFilter,
      debtorId: accountId,
    };
    const creditorFilter: Prisma.MovementWhereInput = {
      ...movementBaseFilter,
      creditorId: accountId,
    };

    // --- Opening balance from NewYear (only if fiscalYear is provided) ---
    let openingAmountTaking = new Prisma.Decimal(0);
    let openingAmountPay = new Prisma.Decimal(0);

    if (fiscalYear) {
      const [openingDebtorSum, openingCreditorSum] = await Promise.all([
        prisma.newYear.aggregate({
          where: {
            fiscalYear,
            currencyId,
            debtorId: accountId,
          },
          _sum: { amountTaking: true },
        }),
        prisma.newYear.aggregate({
          where: {
            fiscalYear,
            currencyId,
            creditorId: accountId,
          },
          _sum: { amountPay: true },
        }),
      ]);

      openingAmountTaking = openingDebtorSum._sum.amountTaking ?? new Prisma.Decimal(0);
      openingAmountPay = openingCreditorSum._sum.amountPay ?? new Prisma.Decimal(0);
    }

    // --- Movements BEFORE fromDate (to compute starting balance) ---
    let beforeAmountTaking = new Prisma.Decimal(0);
    let beforeAmountPay = new Prisma.Decimal(0);

    if (fromDate) {
      const beforeDateFilter: Prisma.DateTimeFilter = {
        lt: moment
          .utc(fromDate)
          .utcOffset('+03:00')
          .startOf('day')
          .toDate(),
      };

      const beforeMovementFilter: Prisma.MovementWhereInput = {
        currencyId,
        ...(fiscalYear && { fiscalYear }),
        createdAt: beforeDateFilter,
        OR: [{ debtorId: accountId }, { creditorId: accountId }],
      };

      const [beforeDebtorSum, beforeCreditorSum] = await Promise.all([
        prisma.movement.aggregate({
          where: { ...beforeMovementFilter, debtorId: accountId },
          _sum: { amountTaking: true },
        }),
        prisma.movement.aggregate({
          where: { ...beforeMovementFilter, creditorId: accountId },
          _sum: { amountPay: true },
        }),
      ]);

      beforeAmountTaking = beforeDebtorSum._sum.amountTaking ?? new Prisma.Decimal(0);
      beforeAmountPay = beforeCreditorSum._sum.amountPay ?? new Prisma.Decimal(0);
    }

    // --- Execute all movement queries in parallel for the selected range ---
    const [movements, total, debtorSum, creditorSum] = await Promise.all([
      prisma.movement.findMany({
        where: listFilter,
        include: {
          accountDebet: {
            select: { accountId: true, name: true, phone: true, address: true },
          },
          accountDane: {
            select: { accountId: true, name: true, phone: true, address: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parPage,
      }),
      prisma.movement.count({ where: listFilter }),
      prisma.movement.aggregate({
        where: debtorFilter,
        _sum: { amountTaking: true },
      }),
      prisma.movement.aggregate({
        where: creditorFilter,
        _sum: { amountPay: true },
      }),
    ]);

    // --- Transform each movement to show only the side relevant to the account ---
    const transformed = movements.map((movement) => {
      const isDebtor = movement.debtorId === accountId;
      return {
        id: movement.id,
        fiscalYear: movement.fiscalYear,
        voucherNo: movement.voucherNo,
        createdAt: movement.createdAt,
        type: movement.type,
        typeId: movement.typeId,
        receiptNo: movement.receiptNo,
        note: movement.note,
        currencyId: movement.currencyId,
        ...(isDebtor
          ? {
              debtorId: movement.debtorId,
              amountTaking: movement.amountTaking,
              debtorAccount: movement.accountDebet,
            }
          : {
              creditorId: movement.creditorId,
              amountPay: movement.amountPay,
              creditorAccount: movement.accountDane,
            }),
      };
    });

    // --- Calculate totals including opening balance ---
    const movementAmountTaking = debtorSum._sum.amountTaking ?? new Prisma.Decimal(0);
    const movementAmountPay = creditorSum._sum.amountPay ?? new Prisma.Decimal(0);

    const totalAmountTaking = movementAmountTaking.plus(openingAmountTaking);
    const totalAmountPay = movementAmountPay.plus(openingAmountPay);

    // --- Net balance before fromDate (including opening) ---
    const netBefore = (openingAmountPay.plus(beforeAmountPay))
      .minus(openingAmountTaking.plus(beforeAmountTaking));

    const totals = {
      amountTaking: totalAmountTaking,
      amountPay: totalAmountPay,
      movementAmountTaking,
      movementAmountPay,
      openingAmountTaking,
      openingAmountPay,
      balanceBefore: netBefore, // the balance just before fromDate
    };

    const totalPages = Math.ceil(total / parPage);

    return responseReturn(res, 200, {
      data: {
        movements: transformed,
        totals,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          perPage: parPage,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message: 'Movements retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get movements error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        code: error.code,
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve movements',
    });
  }
};



getGeneralBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validationResult = generalBalanceQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const {
      currencyId,
      fiscalYear,
      fromDate,
      toDate,
      searchValue,
      includeZero,
      page,
      parPage,
      sortBy,
      sortOrder,
    } = validationResult.data;

    const skip = (page - 1) * parPage;

    // --- Date filter for movements (with timezone offset +03:00) ---
    const movementDateFilter: Prisma.DateTimeFilter = {};
    if (fromDate) {
      movementDateFilter.gte = moment
        .utc(fromDate)
        .utcOffset('+03:00')
        .startOf('day')
        .toDate();
    }
    if (toDate) {
      movementDateFilter.lte = moment
        .utc(toDate)
        .utcOffset('+03:00')
        .endOf('day')
        .toDate();
    }

    // --- Base filter for movements ---
    const movementBaseFilter: Prisma.MovementWhereInput = {
      currencyId,
      ...(fiscalYear && { fiscalYear }),
      ...(Object.keys(movementDateFilter).length > 0 && { createdAt: movementDateFilter }),
    };

    // --- Base filter for NewYear (only fiscalYear, no date filter) ---
    const newYearBaseFilter: Prisma.NewYearWhereInput = {
      currencyId,
      ...(fiscalYear && { fiscalYear }),
    };

    // --- Account filter (by name) ---
    const accountWhere: Prisma.AccountsWhereInput = {};
    if (searchValue) {
      accountWhere.name = { contains: searchValue, mode: Prisma.QueryMode.insensitive };
    }

    // --- 1. Get total count of accounts matching the name filter ---
    const totalAccounts = await prisma.accounts.count({ where: accountWhere });

    // --- 2. Get paginated accounts (sorted) ---
    const orderBy: Prisma.AccountsOrderByWithRelationInput =
      sortBy === 'accountName'
        ? { name: sortOrder }
        : { accountId: sortOrder };

    const accounts = await prisma.accounts.findMany({
      where: accountWhere,
      select: { accountId: true, name: true },
      orderBy,
      skip,
      take: parPage,
    });

    // If no accounts match, return empty paginated result early
    if (accounts.length === 0) {
      return responseReturn(res, 200, {
        data: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: page,
          perPage: parPage,
          hasNext: false,
          hasPrev: page > 1,
        },
        message: 'No accounts found',
      });
    }

    // --- 3. Aggregate movements (across all accounts, but using filters) ---
    const [movementDebtorResults, movementCreditorResults] = await Promise.all([
      prisma.movement.groupBy({
        by: ['debtorId'],
        where: movementBaseFilter,
        _sum: { amountTaking: true },
      }),
      prisma.movement.groupBy({
        by: ['creditorId'],
        where: movementBaseFilter,
        _sum: { amountPay: true },
      }),
    ]);

    // --- 4. Aggregate NewYear opening balances (if fiscalYear provided) ---
    let newYearDebtorResults: { debtorId: number; _sum: { amountTaking: Prisma.Decimal | null } }[] = [];
    let newYearCreditorResults: { creditorId: number; _sum: { amountPay: Prisma.Decimal | null } }[] = [];
    if (fiscalYear) {
      [newYearDebtorResults, newYearCreditorResults] = await Promise.all([
        prisma.newYear.groupBy({
          by: ['debtorId'],
          where: newYearBaseFilter,
          _sum: { amountTaking: true },
        }),
        prisma.newYear.groupBy({
          by: ['creditorId'],
          where: newYearBaseFilter,
          _sum: { amountPay: true },
        }),
      ]);
    }

    // --- Build lookup maps for quick access ---
    const movementDebtorMap = new Map(
      movementDebtorResults.map((d) => [d.debtorId, new Prisma.Decimal(d._sum.amountTaking || 0)])
    );
    const movementCreditorMap = new Map(
      movementCreditorResults.map((c) => [c.creditorId, new Prisma.Decimal(c._sum.amountPay || 0)])
    );
    const newYearDebtorMap = new Map(
      newYearDebtorResults.map((d) => [d.debtorId, new Prisma.Decimal(d._sum.amountTaking || 0)])
    );
    const newYearCreditorMap = new Map(
      newYearCreditorResults.map((c) => [c.creditorId, new Prisma.Decimal(c._sum.amountPay || 0)])
    );

    // --- Compute balances only for the paginated accounts ---
    const formattedAccounts = accounts.flatMap((account) => {
      const movementDebtor = movementDebtorMap.get(account.accountId) || new Prisma.Decimal(0);
      const movementCreditor = movementCreditorMap.get(account.accountId) || new Prisma.Decimal(0);
      const newYearDebtor = newYearDebtorMap.get(account.accountId) || new Prisma.Decimal(0);
      const newYearCreditor = newYearCreditorMap.get(account.accountId) || new Prisma.Decimal(0);

      const totalDebtor = movementDebtor.plus(newYearDebtor);
      const totalCreditor = movementCreditor.plus(newYearCreditor);

      const rawNetBalance = totalCreditor.minus(totalDebtor); // positive = creditor, negative = debtor

      // Optionally skip zero-balance accounts if includeZero is false
      if (!includeZero && rawNetBalance.isZero()) return [];

      const absoluteBalance = rawNetBalance.abs();
      const isIQD = currencyId === 2;
      const decimals = isIQD ? 3 : 2;

      const formattedBalance = absoluteBalance.toNumber().toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true,
      });

      return [{
        accountId: account.accountId,
        accountName: account.name,
        netBalance: formattedBalance,
        status: rawNetBalance.gt(0) ? 'creditor' : (rawNetBalance.lt(0) ? 'debtor' : 'neutral'),
      }];
    });

    // --- Pagination metadata ---
    const totalPages = Math.ceil(totalAccounts / parPage);

    return responseReturn(res, 200, {
      data: formattedAccounts,
      pagination: {
        total: totalAccounts,
        totalPages,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: 'Balance accounts retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get account balances error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        code: error.code,
        message: error.message,
      });
    }
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve balances',
    });
  }
};

}

export default new MovementController()
