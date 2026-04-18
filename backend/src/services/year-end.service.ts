import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

const RETAINED_EARNINGS_ACCOUNT_ID = 203;   // your Retained Earnings account ID
const OPENING_BALANCE_TYPE_ID = 999;        // type ID for opening entries
const OPENING_BALANCE_TYPE = "بەڵانسی سەرەتایی/ رصید البدائي";

export async function closeYearDoubleEntry(
  oldYear: number,
  newYear: number,
  userId: number
): Promise<void> {
  // Prevent double-closing
  const existing = await prisma.newYear.findFirst({
    where: {
      fiscalYear: newYear,
      typeId: OPENING_BALANCE_TYPE_ID,
    },
  });
  if (existing) {
    throw new Error(`Fiscal year ${newYear} already has opening entries. Aborting.`);
  }

  // Get all currency IDs from movements of the old year
  const currencies = await prisma.movement.findMany({
    where: { fiscalYear: oldYear },
    distinct: ['currencyId'],
    select: { currencyId: true },
  });
  const currencyIds = currencies.map((c) => c.currencyId);

  // Get the starting voucher number for the new year (once, global for all rows)
  const maxVoucher = await prisma.newYear.aggregate({
    where: { fiscalYear: newYear },
    _max: { voucherNo: true },
  });
  let voucherNo = (maxVoucher._max.voucherNo || 0) + 1;

  const rowsToCreate: Prisma.NewYearCreateManyInput[] = [];

  for (const currencyId of currencyIds) {
    const accounts = await prisma.accounts.findMany({
      select: { accountId: true, name: true },
    });

    for (const account of accounts) {
      // Total debit
      const movementDebit = await prisma.movement.aggregate({
        where: { fiscalYear: oldYear, currencyId, debtorId: account.accountId },
        _sum: { amountTaking: true },
      });
      const openingDebit = await prisma.newYear.findFirst({
        where: { fiscalYear: oldYear, currencyId, debtorId: account.accountId },
        select: { amountTaking: true },
      });
      const totalDebit = (movementDebit._sum.amountTaking || new Prisma.Decimal(0))
        .plus(openingDebit?.amountTaking || new Prisma.Decimal(0));

      // Total credit
      const movementCredit = await prisma.movement.aggregate({
        where: { fiscalYear: oldYear, currencyId, creditorId: account.accountId },
        _sum: { amountPay: true },
      });
      const openingCredit = await prisma.newYear.findFirst({
        where: { fiscalYear: oldYear, currencyId, creditorId: account.accountId },
        select: { amountPay: true },
      });
      const totalCredit = (movementCredit._sum.amountPay || new Prisma.Decimal(0))
        .plus(openingCredit?.amountPay || new Prisma.Decimal(0));

      const net = totalDebit.minus(totalCredit);
      if (net.isZero()) continue;

      const absoluteAmount = net.abs();
      const note = `Opening balance carried forward from FY ${oldYear}`;

      if (net.gt(0)) {
        rowsToCreate.push({
          fiscalYear: newYear,
          type: OPENING_BALANCE_TYPE,
          typeId: OPENING_BALANCE_TYPE_ID,
          voucherNo: voucherNo++,
          debtorId: account.accountId,
          amountTaking: absoluteAmount,
          creditorId: RETAINED_EARNINGS_ACCOUNT_ID,
          amountPay: absoluteAmount,
          currencyId,
          note,
          USER_ID: userId,
        });
      } else {
        rowsToCreate.push({
          fiscalYear: newYear,
          type: OPENING_BALANCE_TYPE,
          typeId: OPENING_BALANCE_TYPE_ID,
          voucherNo: voucherNo++,
          debtorId: RETAINED_EARNINGS_ACCOUNT_ID,
          amountTaking: absoluteAmount,
          creditorId: account.accountId,
          amountPay: absoluteAmount,
          currencyId,
          note,
          USER_ID: userId,
        });
      }
    }
  }

  if (rowsToCreate.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.newYear.createMany({ data: rowsToCreate });
    });
  }

  console.log(
    `Year-end closing completed. ${rowsToCreate.length} opening entries created for FY ${newYear}.`
  );
}