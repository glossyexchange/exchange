import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { responseReturn } from '../utils/response'

import {
  PaymentCreateSchema,
  PaymentDeleteSchema,
  PaymentQuerySchema,
  PaymentSingleGetSchema,
  PaymentUpdateSchema,
} from '../types/payments.schema'
import prisma from '../utils/prisma'

class PaymentController {
  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = PaymentCreateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const { accountId, debtorId, daneId, ...paymentData } =
        validationResult.data

      const [account, debtorAccount, daneAccount] = await Promise.all([
        prisma.accounts.findUnique({ where: { accountId } }),
        prisma.accounts.findUnique({ where: { accountId: debtorId } }),
        prisma.accounts.findUnique({ where: { accountId: daneId } }),
      ])

      if (!account) {
        return responseReturn(res, 404, {
          error: 'Account not found',
          message: `Account with ID ${accountId} does not exist`,
        })
      }

      if (!debtorAccount) {
        return responseReturn(res, 404, {
          error: 'Debtor account not found',
          message: `Debtor account with ID ${debtorId} does not exist`,
        })
      }

      if (!daneAccount) {
        return responseReturn(res, 404, {
          error: 'Dane account not found',
          message: `Dane account with ID ${daneId} does not exist`,
        })
      }

      const newPayment = await prisma.payment.create({
        data: {
          accountId,
          debtorId,
          daneId,
          paymentTypeId: paymentData.paymentTypeId,
          type: paymentData.type,
          typeId: paymentData.typeId,
          currencyId: paymentData.currencyId,
          currencyType: paymentData.currencyType,
          payer: paymentData.payer,
          payerPhone: paymentData.payerPhone,
          totalAmount: paymentData.totalAmount,
          note: paymentData.note,
          createdAt: paymentData.createdAt,
        },
      })

      return responseReturn(res, 201, {
        payment: newPayment,
        newVoucherNo: newPayment.voucherNo,
        paymentId: newPayment.id,
        message: 'Payment created successfully',
      })
    } catch (error: any) {
      console.error('Payment creation error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Duplicate entry',
              fields: error.meta?.target,
              message: 'Payment conflict detected',
            })
          case 'P2003':
            return responseReturn(res, 400, {
              error: 'Invalid reference',
              message: 'Linked account does not exist',
            })
        }
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  updatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = PaymentUpdateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const voucherNo = Number(req.params.voucherNo)
      const updateData = validationResult.data

      // -----------------------------------------------------------------
      // 1. Fetch existing payment (must include fiscalYear)
      // -----------------------------------------------------------------
      const existingPayment = await prisma.payment.findUnique({
        where: { id: updateData.paymentId},
        select: {
          id: true,
          voucherNo: true,
          fiscalYear: true,
          debtorId: true,
          daneId: true,
          totalAmount: true,
          currencyId: true,
          currencyType:true,
          note: true,
          paymentTypeId: true,
          type:true,
          // Do NOT select createdAt – it should NEVER change
        },
      })

      if (!existingPayment) {
        return responseReturn(res, 404, {
          error: 'Payment not found',
          message: `Payment with voucherNo ${voucherNo} not found`,
        })
      }

      // -----------------------------------------------------------------
      // 2. Define ONLY the fields that are safe to update
      // -----------------------------------------------------------------
      const safeFields: Array<keyof typeof updateData> = [
        'currencyId',
        'currencyType',
        'accountId',
        'payer',
        'payerPhone',
        'totalAmount',
        'note',
        'debtorId',
        'daneId',
      ]

      // -----------------------------------------------------------------
      // 3. Strict validation: forbid ANY attempt to update immutable fields
      // -----------------------------------------------------------------
      const forbiddenFields = ['createdAt', 'fiscalYear', 'paymentTypeId'] // voucherNo & paymentId now allowed
      const illegalFields = Object.keys(updateData).filter((key) =>
        forbiddenFields.includes(key),
      )

      if (illegalFields.length > 0) {
        return responseReturn(res, 400, {
          error: 'Immutable field update forbidden',
          message: `You cannot update these fields: ${illegalFields.join(', ')}`,
        })
      }

      // -----------------------------------------------------------------
      // 4. Check for any completely unknown/unsafe fields
      // -----------------------------------------------------------------
      const unsafeFields = Object.keys(updateData).filter(
        (key) =>
          !safeFields.includes(key as any) &&
          !['voucherNo', 'paymentId'].includes(key), // these are allowed as identifiers
      )

      if (unsafeFields.length > 0) {
        return responseReturn(res, 400, {
          error: 'Unsafe update',
          message: `Unknown or non‑updatable fields: ${unsafeFields.join(', ')}`,
        })
      }

      // -----------------------------------------------------------------
      // 5. Build update payload (only fields that were actually sent)
      // -----------------------------------------------------------------
      const updatePayload: any = {}
      safeFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          updatePayload[field] = updateData[field]
        }
      })

      // If no updatable fields were sent, return early
      if (Object.keys(updatePayload).length === 0) {
        return responseReturn(res, 200, {
          payment: existingPayment,
          message: 'No changes detected',
        })
      }

      // -----------------------------------------------------------------
      // 6. Atomic transaction: update Payment + Movement
      // -----------------------------------------------------------------
      const updatedPayment = await prisma.$transaction(async (tx) => {
        // ---- 6.1 Update payment table (only safe fields) ----
        const payment = await tx.payment.update({
          where: { id: updateData.paymentId},
          data: updatePayload,
        })

        // ---- 6.2 Update corresponding movement entry ----
        // Use existing values as fallbacks for fields that weren't updated
        await tx.$executeRaw`
        UPDATE movement
        SET
          debtor_id   = ${updateData.debtorId ?? existingPayment.debtorId},
          creditor_id = ${updateData.daneId ?? existingPayment.daneId},
          amount_taking = ${updateData.totalAmount ?? existingPayment.totalAmount},
          amount_pay    = ${updateData.totalAmount ?? existingPayment.totalAmount},
          currency_id   = ${updateData.currencyId ?? existingPayment.currencyId},
          note          = ${updateData.note ?? existingPayment.note},
          type_id       = ${existingPayment.paymentTypeId}  -- NEVER change
        WHERE
          fiscal_year = ${existingPayment.fiscalYear}
          AND voucher_no = ${voucherNo}
          AND type_id=${existingPayment.paymentTypeId}
          AND type = ${existingPayment.type}
      `

        return payment
      })

      // -----------------------------------------------------------------
      // 7. Success response
      // -----------------------------------------------------------------
      return responseReturn(res, 200, {
        payment: updatedPayment,
        message: 'Payment and movement updated successfully.',
      })
    } catch (error: any) {
      console.error('Payment update error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

// backend/controllers/paymentController.ts
getPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = PaymentSingleGetSchema.safeParse(req.query);
    if (!queryValidation.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: queryValidation.error.errors,
      });
    }

    const { paymentId, voucherNo, fiscalYear } = queryValidation.data;

    let whereCondition: any = {};

    if (paymentId) {
      whereCondition = { id: paymentId };
    } else if (voucherNo !== undefined && fiscalYear !== undefined) {
      // ✅ CORRECT: Use the composite unique input
      whereCondition = {
        fiscalYear_voucherNo: {
          fiscalYear,
          voucherNo
        }
      };
    } else {
      return responseReturn(res, 400, {
        error: 'Missing identifier',
        message: 'Provide either paymentId OR (voucherNo + fiscalYear)',
      });
    }

    const payment = await prisma.payment.findUnique({
      where: whereCondition,
      include: {
        account: {
          select: {
            accountId: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!payment) {
      return responseReturn(res, 404, {
        error: 'Payment not found',
        message: 'No payment matches the provided identifier',
      });
    }

    return responseReturn(res, 200, {
      payment,
      message: 'Payment retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get payment error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
};

getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = PaymentQuerySchema.safeParse(req.query);
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
      fromDate,
      toDate,
    } = queryValidation.data;

    // -----------------------------------------------------------------
    // Build filter conditions
    // -----------------------------------------------------------------
    const whereConditions: any = {
      ...(currencyId && { currencyId }),
      ...(searchValue && {
        OR: [
          ...(!isNaN(Number(searchValue))
            ? [{ voucherNo: Number(searchValue) }]
            : []),
          { account: { name: { contains: searchValue, mode: 'insensitive' } } },
          { payer: { contains: searchValue, mode: 'insensitive' } },
        ].filter(Boolean),
      }),
    };

    // -----------------------------------------------------------------
    // Date filtering logic:
    // - If user provided ANY date (fromDate OR toDate) → use exactly those.
    // - If NO dates provided → default to current year (Jan 1 – Dec 31).
    // -----------------------------------------------------------------
    if (fromDate || toDate) {
      whereConditions.createdAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      };
    } else {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);      // Jan 1 00:00
      const endOfYear   = new Date(currentYear, 11, 31, 23, 59, 59, 999); // Dec 31 23:59:59
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // -----------------------------------------------------------------
    // Execute query with pagination
    // -----------------------------------------------------------------
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        skip: (page - 1) * parPage,
        take: parPage,
        orderBy: { [sortBy]: sortOrder },
        where: whereConditions,
        include: {
          account: {
            select: {
              accountId: true,
              name: true,
              phone: true,
              address: true,
            },
          },
        },
      }),
      prisma.payment.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      payments,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'Payments retrieved successfully',
    });
  } catch (error: any) {
    console.error('Payment retrieval error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

deletePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = PaymentDeleteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const { paymentId, voucherNo, fiscalYear, formType } = validationResult.data;

    // -----------------------------------------------------------------
    // 1. Build WHERE condition for Payment lookup
    // -----------------------------------------------------------------
    let paymentWhere: any = {};
    if (paymentId) {
      paymentWhere = { id: paymentId };
    } else {
      paymentWhere = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYear!,
          voucherNo: voucherNo!,
        },
      };
    }

    // -----------------------------------------------------------------
    // 2. Fetch payment (must exist)
    // -----------------------------------------------------------------
    const existingPayment = await prisma.payment.findUnique({
      where: paymentWhere,
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
      },
    });

    if (!existingPayment) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Payment not found',
      });
    }

    // -----------------------------------------------------------------
    // 3. SAFETY: Ensure fiscalYear and voucherNo are NOT null
    // -----------------------------------------------------------------
    if (existingPayment.fiscalYear === null || existingPayment.voucherNo === null) {
      return responseReturn(res, 500, {
        error: 'Inconsistent data',
        message: 'Payment record is missing fiscal year or voucher number',
      });
    }

    // -----------------------------------------------------------------
    // 4. Delete in a transaction
    // -----------------------------------------------------------------
    const [deletedMovements, deletedPayment] = await prisma.$transaction([
      // Delete movement – using correct Prisma field names (camelCase)
      prisma.movement.deleteMany({
        where: {
          fiscalYear: existingPayment.fiscalYear,  // ✅ now guaranteed number
          voucherNo: existingPayment.voucherNo,    // ✅ guaranteed number
          // type: 'payment',
          typeId: formType,                        // ✅ adjust if your field is `typeId`
        },
      }),
      // Delete payment
      prisma.payment.delete({
        where: { id: existingPayment.id },
      }),
    ]);

    return responseReturn(res, 200, {
      payment: deletedPayment,
      deletedMovementsCount: deletedMovements.count,
      message: 'Payment and related movement deleted successfully',
    });
  } catch (error: any) {
    console.error('Payment deletion error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Not found',
            message: 'Payment does not exist',
          });
        case 'P2003':
          return responseReturn(res, 409, {
            error: 'Conflict',
            message: 'Cannot delete payment with existing dependencies',
          });
      }
    }
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
};
}

export default new PaymentController()
