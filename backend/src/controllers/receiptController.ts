import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import {
  ReceiptCreateSchema,
  ReceiptDeleteSchema,
  ReceiptQuerySchema,
  ReceiptSingleGetSchema,
  ReceiptUpdateSchema
} from '../types/receipt.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
// const prisma = new PrismaClient()


class ReceiptController {
 createReceipt = async (req: Request, res: Response): Promise<void> => {
  try {

    const validationResult = ReceiptCreateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const { accountId, debtorId, daneId, ...receiptData } = validationResult.data;

    // -----------------------------------------------------------------
    // 1. Verify ALL referenced accounts exist
    // -----------------------------------------------------------------
    const [account, debtorAccount, daneAccount] = await Promise.all([
      prisma.accounts.findUnique({ where: { accountId } }),
      prisma.accounts.findUnique({ where: { accountId: debtorId } }),
      prisma.accounts.findUnique({ where: { accountId: daneId } }),
    ]);

    if (!account) {
      return responseReturn(res, 404, {
        error: 'Account not found',
        message: `Account with ID ${accountId} does not exist`,
      });
    }

    if (!debtorAccount) {
      return responseReturn(res, 404, {
        error: 'Debtor account not found',
        message: `Debtor account with ID ${debtorId} does not exist`,
      });
    }

    if (!daneAccount) {
      return responseReturn(res, 404, {
        error: 'Dane account not found',
        message: `Dane account with ID ${daneId} does not exist`,
      });
    }

    // -----------------------------------------------------------------
    // 2. Create receipt – triggers will handle:
    //    - fiscalYear and voucherNo (BEFORE INSERT trigger)
    //    - movement entry (AFTER INSERT trigger)
    // -----------------------------------------------------------------
    const newReceipt = await prisma.receipt.create({
      data: {
        accountId,
        debtorId,
        daneId,
        receiptTypeId: receiptData.receiptTypeId,
        typeId: receiptData.typeId,
        type: receiptData.type,
        currencyId: receiptData.currencyId,
        currencyType: receiptData.currencyType,
        payer: receiptData.payer ?? null,
        payerPhone: receiptData.payerPhone ?? null,
        totalAmount: receiptData.totalAmount,
               note: receiptData.note,
        createdAt: receiptData.createdAt,
      },
    });

    // -----------------------------------------------------------------
    // 3. Return success – include receipt, voucherNo, and receiptId
    // -----------------------------------------------------------------
    return responseReturn(res, 201, {
      receipt: newReceipt,
      newVoucherNo: newReceipt.voucherNo,
      receiptId: newReceipt.id,
      message: 'Receipt created successfully',
    });
  } catch (error: any) {
    console.error('Receipt creation error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate entry',
            fields: error.meta?.target,
            message: 'Receipt conflict detected',
          });
        case 'P2003':
          return responseReturn(res, 400, {
            error: 'Invalid reference',
            message: 'Linked account does not exist',
          });
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
};

updateReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = ReceiptUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const voucherNo = Number(req.params.voucherNo); // from URL (used only for movement)
    const updateData = validationResult.data;

    // -----------------------------------------------------------------
    // 1. Fetch existing receipt using PRIMARY KEY (receiptId)
    // -----------------------------------------------------------------
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id: updateData.receiptId }, // ✅ CORRECT – primary key
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        debtorId: true,
        daneId: true,
        totalAmount: true,
        currencyId: true,
        currencyType: true,
        note: true,
        type:true,
        receiptTypeId: true, // needed for movement.type_id (immutable)
      },
    });

    if (!existingReceipt) {
      return responseReturn(res, 404, {
        error: 'Receipt not found',
        message: `Receipt with id ${updateData.receiptId} not found`,
      });
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
    ];

    // -----------------------------------------------------------------
    // 3. Strict validation: forbid immutable fields
    // -----------------------------------------------------------------
    const forbiddenFields = ['id', 'createdAt', 'fiscalYear', 'receiptTypeId']; // 'id' is primary key
    const illegalFields = Object.keys(updateData).filter((key) =>
      forbiddenFields.includes(key)
    );

    if (illegalFields.length > 0) {
      return responseReturn(res, 400, {
        error: 'Immutable field update forbidden',
        message: `You cannot update these fields: ${illegalFields.join(', ')}`,
      });
    }

    // -----------------------------------------------------------------
    // 4. Check for unknown/unsafe fields
    // -----------------------------------------------------------------
    const unsafeFields = Object.keys(updateData).filter(
      (key) =>
        !safeFields.includes(key as any) &&
        !['voucherNo', 'receiptId'].includes(key) // allowed identifiers
    );

    if (unsafeFields.length > 0) {
      return responseReturn(res, 400, {
        error: 'Unsafe update',
        message: `Unknown or non‑updatable fields: ${unsafeFields.join(', ')}`,
      });
    }

    // -----------------------------------------------------------------
    // 5. Build update payload (only fields actually sent)
    // -----------------------------------------------------------------
    const updatePayload: any = {};
    safeFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updatePayload[field] = updateData[field];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      return responseReturn(res, 200, {
        receipt: existingReceipt,
        message: 'No changes detected',
      });
    }

    // -----------------------------------------------------------------
    // 6. Atomic transaction: update Receipt + Movement
    // -----------------------------------------------------------------
    const updatedReceipt = await prisma.$transaction(async (tx) => {
      // ---- Update receipt ----
      const receipt = await tx.receipt.update({
        where: { id: updateData.receiptId }, // ✅ PRIMARY KEY
        data: updatePayload,
      });

      // ---- Update movement ----
      await tx.$executeRaw`
        UPDATE movement
        SET
          debtor_id   = ${updateData.debtorId ?? existingReceipt.debtorId},
          creditor_id = ${updateData.daneId ?? existingReceipt.daneId},
          amount_taking = ${updateData.totalAmount ?? existingReceipt.totalAmount},
          amount_pay    = ${updateData.totalAmount ?? existingReceipt.totalAmount},
          currency_id   = ${updateData.currencyId ?? existingReceipt.currencyId},
          note          = ${updateData.note ?? existingReceipt.note},
          type_id       = ${existingReceipt.receiptTypeId}  -- NEVER change
        WHERE
          fiscal_year = ${existingReceipt.fiscalYear}
          AND voucher_no = ${voucherNo}
          AND type_id=${existingReceipt.receiptTypeId}
          AND type = ${existingReceipt.type}
      `;

      return receipt;
    });

    return responseReturn(res, 200, {
      receipt: updatedReceipt,
      message: 'Receipt and movement updated successfully.',
    });
  } catch (error: any) {
    console.error('Receipt update error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
};

 getReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = ReceiptSingleGetSchema.safeParse(req.query);
    if (!queryValidation.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: queryValidation.error.errors,
      });
    }

    const { receiptId, voucherNo, fiscalYear } = queryValidation.data;

    let whereCondition: any = {};

    if (receiptId) {
      whereCondition = { id: receiptId };
    } else if (voucherNo !== undefined && fiscalYear !== undefined) {
      whereCondition = {
        fiscalYear_voucherNo: {
          fiscalYear,
          voucherNo,
        },
      };
    } else {
      return responseReturn(res, 400, {
        error: 'Missing identifier',
        message: 'Provide either receiptId OR (voucherNo + fiscalYear)',
      });
    }

    const receipt = await prisma.receipt.findUnique({
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

    if (!receipt) {
      return responseReturn(res, 404, {
        error: 'Receipt not found',
        message: 'No receipt matches the provided identifier',
      });
    }

    return responseReturn(res, 200, {
      receipt,
      message: 'Receipt retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get receipt error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
};

getAllReceipts = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = ReceiptQuerySchema.safeParse(req.query);
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
    // Date filtering: if no dates provided → current year
    // -----------------------------------------------------------------
    if (fromDate || toDate) {
      whereConditions.createdAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      };
    } else {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      whereConditions.createdAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // -----------------------------------------------------------------
    // Execute query with pagination
    // -----------------------------------------------------------------
    const [receipts, totalCount] = await Promise.all([
      prisma.receipt.findMany({
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
      prisma.receipt.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      receipts,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'Receipts retrieved successfully',
    });
  } catch (error: any) {
    console.error('Receipt retrieval error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
};



deleteReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = ReceiptDeleteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      });
    }

    const { receiptId, voucherNo, fiscalYear, formType } = validationResult.data;

    // -----------------------------------------------------------------
    // 1. Build WHERE condition for Receipt lookup
    // -----------------------------------------------------------------
    let receiptWhere: any = {};
    if (receiptId) {
      receiptWhere = { id: receiptId };
    } else {
      receiptWhere = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYear!,
          voucherNo: voucherNo!,
        },
      };
    }

    // -----------------------------------------------------------------
    // 2. Fetch receipt (must exist)
    // -----------------------------------------------------------------
    const existingReceipt = await prisma.receipt.findUnique({
      where: receiptWhere,
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
      },
    });

    if (!existingReceipt) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Receipt not found',
      });
    }

    // -----------------------------------------------------------------
    // 3. Safety: ensure fiscalYear and voucherNo are NOT null
    // -----------------------------------------------------------------
    if (existingReceipt.fiscalYear === null || existingReceipt.voucherNo === null) {
      return responseReturn(res, 500, {
        error: 'Inconsistent data',
        message: 'Receipt record is missing fiscal year or voucher number',
      });
    }

    // -----------------------------------------------------------------
    // 4. Delete in transaction
    // -----------------------------------------------------------------
    const [deletedMovements, deletedReceipt] = await prisma.$transaction([
      // Delete movement – using fiscalYear + voucherNo + type = 'receipt'
      prisma.movement.deleteMany({
        where: {
          fiscalYear: existingReceipt.fiscalYear,
          voucherNo: existingReceipt.voucherNo,
          // type: 'receipt',
          typeId: formType, // extra safety
        },
      }),
      // Delete receipt
      prisma.receipt.delete({
        where: { id: existingReceipt.id },
      }),
    ]);

    return responseReturn(res, 200, {
      receipt: deletedReceipt,
      deletedMovementsCount: deletedMovements.count,
      message: 'Receipt and related movement deleted successfully',
    });
  } catch (error: any) {
    console.error('Receipt deletion error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Not found',
            message: 'Receipt does not exist',
          });
        case 'P2003':
          return responseReturn(res, 409, {
            error: 'Conflict',
            message: 'Cannot delete receipt with existing dependencies',
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

export default new ReceiptController()
