import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { responseReturn } from '../utils/response'

import {
    PaymentCreateSchema
} from '../types/payments.schema'
import prisma from '../utils/prisma'
// const prisma = new PrismaClient()

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

    const { accountId, debtorId, daneId, ...paymentData } = validationResult.data

    // Verify ALL account existences
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
    // Do NOT include voucherNo or fiscalYear
    accountId,               // creditor
    debtorId,                // payer (debtor)
    daneId,                  // creditor (dane)
    paymentTypeId:paymentData.paymentTypeId,
    type:paymentData.type,
    currencyId:paymentData.currencyId,
    currencyType:paymentData.currencyType,
    payer:paymentData.payer,
    payerPhone:paymentData.payerPhone,
    totalAmount:paymentData.totalAmount,
    note:paymentData.note,
    createdAt:paymentData.createdAt,
  }
});

return responseReturn(res, 201, {
  payment: newPayment,
  voucherNo: newPayment.voucherNo,
  message: 'Payment created successfully',
});
    // Get last voucher number
    // const lastPayment = await prisma.payment.findFirst({
    //   orderBy: { voucherNo: 'desc' },
    //   select: { voucherNo: true },
    // })

    // // Generate new voucher number
    // const newVoucherNo = (lastPayment?.voucherNo || 200) + 1

    // // Create payment with generated voucherNo
    // const [newPayment, firstPayMovement] = await prisma.$transaction([
    //   prisma.payment.create({
    //     data: {
    //       paymentTypeId: paymentData.paymentTypeId,
    //       voucherNo: newVoucherNo,
    //       accountId,
    //       currencyId: paymentData.currencyId,
    //       currencyType: paymentData.currencyType,
    //       payer: paymentData.payer,
    //       payerPhone: paymentData.payerPhone,
    //       totalAmount: paymentData.totalAmount,
    //       discount: paymentData.discount ?? 0,
    //       note: paymentData.note,
    //       createdAt: paymentData.createdAt,
    //     },
    //   }),

    //   prisma.movement.create({
    //     data: {
    //       voucherNo: newVoucherNo,
    //       receiptNo: newVoucherNo,
    //       debtorId: debtorId,
    //       daneId: daneId,     
    //       typeId: paymentData.typeId,
    //       type: paymentData.type,
    //       currencyId: paymentData.currencyId,
    //       currencyType: paymentData.currencyType,
    //       amountTaking: paymentData.totalAmount,
    //       amountPay: paymentData.totalAmount,
    //       note: paymentData.note || '',
    //     },
    //   }),
    // ])

    // return responseReturn(res, 201, {
    //   data: newPayment,
    //   newVoucherNo: newVoucherNo,
    //   firstPay: firstPayMovement,
    //   message: 'Payment created successfully',
    // })
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

//   updatePayment = async (req: Request, res: Response): Promise<void> => {
//     try {

        
//       const validationResult = PaymentUpdateSchema.safeParse(req.body)
//       if (!validationResult.success) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: validationResult.error.errors,
//         })
//       }

//       const originalVoucherNo = Number(req.params.voucherNo)
//       const updateData = validationResult.data

//       // Explicitly remove voucherNo if present
//       delete (updateData as any).voucherNo

//       // Check receipt existence using voucherNo
//       const existingPayment = await prisma.payment.findUnique({
//         where: { voucherNo: originalVoucherNo },
//       })

//       if (!existingPayment) {
//         return responseReturn(res, 404, {
//           error: 'Payment not found',
//           message: `Payment with voucherNo ${originalVoucherNo} not found`,
//         })
//       }

//       const existingMovement = await prisma.movement.findFirst({
//         where: { voucherNo: originalVoucherNo, typeId: updateData.typeId },
//       })

//       if (!existingMovement) {
//         return responseReturn(res, 404, {
//           error: 'Movement not found',
//           message: `Movement with voucher ${originalVoucherNo} not found`,
//         })
//       }

//       // Account validation
//       if (
//         updateData.accountId &&
//         updateData.accountId !== existingPayment.accountId
//       ) {
//         const account = await prisma.accounts.findUnique({
//           where: { accountId: updateData.accountId },
//         })
//         if (!account) {
//           return responseReturn(res, 404, {
//             error: 'Account not found',
//             message: `Account ${updateData.accountId} doesn't exist`,
//           })
//         }
//       }
//       // Verify accounts if changing debtorId or daneId
//       if (
//         updateData.debtorId &&
//         updateData.debtorId !== existingMovement.debtorId
//       ) {
//         const debtorAccount = await prisma.accounts.findUnique({
//           where: { accountId: updateData.debtorId },
//         })
//         if (!debtorAccount) {
//           return responseReturn(res, 404, {
//             error: 'Debtor account not found',
//             message: `Account ${updateData.debtorId} doesn't exist`,
//           })
//         }
//       }

//       if (updateData.daneId && updateData.daneId !== existingMovement.daneId) {
//         const daneAccount = await prisma.accounts.findUnique({
//           where: { accountId: updateData.daneId },
//         })
//         if (!daneAccount) {
//           return responseReturn(res, 404, {
//             error: 'Dane account not found',
//             message: `Account ${updateData.daneId} doesn't exist`,
//           })
//         }
//       }

//       const [updatedPayment, updateMovement] = await prisma.$transaction([
//         prisma.payment.update({
//           where: { voucherNo: originalVoucherNo },
//           data: {
//             paymentTypeId: updateData.paymentTypeId,
//             currencyId: updateData.currencyId,
//             currencyType: updateData.currencyType,
//             payer: updateData.payer,
//             payerPhone: updateData.payerPhone,
//             totalAmount: updateData.totalAmount,
//             discount: updateData.discount ?? 0,
//             note: updateData.note,

//             createdAt: updateData.createdAt,
//             // payer: updateData.payer ?? undefined,
//             // payerPhone: updateData.payerPhone ?? undefined,
//             ...(updateData.accountId && {
//               account: { connect: { accountId: updateData.accountId } },
//             }),
//           },
//         }),

//         prisma.movement.update({
//           where: { id: existingMovement.id },
//           data: {
//             voucherNo: originalVoucherNo,
//             receiptNo: updateData.receiptNo,
//             debtorId: updateData.debtorId,
//             daneId: updateData.daneId,
//             typeId: updateData.typeId,
//             type: updateData.type,
//             currencyId: updateData.currencyId,
//             currencyType: updateData.currencyType,
//             amountTaking: updateData.totalAmount,
//             amountPay: updateData.totalAmount,
//             note: updateData.note || '',
//           },
//         }),
//       ])

//       return responseReturn(res, 200, {
//         payment: updatedPayment,
//         movement: updateMovement,
//         message: 'Payment updated successfully',
//       })
//     } catch (error: any) {
//       console.error('Payment update error:', error)

//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2002':
//             return responseReturn(res, 409, {
//               error: 'Duplicate entry',
//               message:
//                 'Conflict in unique fields (possibly other unique fields)',
//             })
//           case 'P2025':
//             return responseReturn(res, 404, {
//               error: 'Record not found',
//               message: 'Payment does not exist',
//             })
//         }
//       }

//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error.message || 'Unknown error occurred',
//       })
//     }
//   }

//  getPaymentByVoucherNo = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { voucherNo } = req.params; 
    
//     const bodyValidation = VoucherNoGetSchema.safeParse({
//       voucherNo: parseInt(voucherNo),
//     });
    
//     if (!bodyValidation.success) {
//       console.error('Validation failed:', bodyValidation.error.format());
//       return responseReturn(res, 400, {
//         error: 'Validation error',
//         details: bodyValidation.error.errors,
//       });
//     }
    
//     const voucherNoInt = parseInt(voucherNo);

//      const payment = await prisma.payment.findUnique({
//       where: { voucherNo: voucherNoInt },
//       include: {
//         account: {
//           select: {
//             accountId: true,
//             name: true,
//             phone: true,
//             address: true,
//           },
//         },
//       },
//     });

//     if (!payment) {
//       return responseReturn(res, 404, {
//         error: 'Payment not found',
//         message: `Payment with voucher number ${voucherNoInt} not found`,
//       });
//     }

//     return responseReturn(res, 200, {
//       payment: payment,
//       message: 'Payment retrieved successfully',
//     });
//   } catch (error: any) {
//     console.error('Get payment error:', error);

//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       switch (error.code) {
//         case 'P2023':
//           return responseReturn(res, 400, {
//             error: 'Invalid ID format',
//             message: 'Malformed voucher number',
//           });
//       }
//     }

//     // Handle other errors
//     return responseReturn(res, 500, {
//       error: 'Internal server error',
//       message: error.message || 'Unknown error occurred',
//     });
//   }
// };

//   getAllPayments = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const queryValidation = PaymentQuerySchema.safeParse(req.query)
//       if (!queryValidation.success) {
//         return responseReturn(res, 400, {
//           error: 'Invalid query parameters',
//           details: queryValidation.error.errors,
//         })
//       }

//       const {
//         page,
//         parPage,
//         searchValue,
//         sortBy,
//         sortOrder,
//         currencyId,
//         fromDate,
//         toDate,
//       } = queryValidation.data

//       // Build filter conditions
//       const whereConditions: any = {
//         ...(currencyId && { currencyId }),
//         ...((fromDate || toDate) && {
//           createdAt: {
//             ...(fromDate && { gte: fromDate }),
//             ...(toDate && { lte: toDate }),
//           },
//         }),
//         ...(searchValue && {
//           OR: [
//             // Numeric voucherNo search
//             ...(!isNaN(Number(searchValue))
//               ? [{ voucherNo: Number(searchValue) }]
//               : []),
//             // Account name search
//             {
//               account: {
//                 name: { contains: searchValue, mode: 'insensitive' },
//               },
//             },
//             // Receiver name search
//             {
//               payer: { contains: searchValue, mode: 'insensitive' },
//             },
//           ].filter(Boolean),
//         }),
//       }

//       const [payments, totalCount] = await Promise.all([
//         prisma.payment.findMany({
//           skip: (page - 1) * parPage,
//           take: parPage,
//           orderBy: { [sortBy]: sortOrder },
//           where: whereConditions,
//           include: {
//             account: {
//               select: {
//                 accountId: true,
//                 name: true,
//                 phone: true,
//                 address: true,
//               },
//             },
//           },
//         }),
//         prisma.payment.count({ where: whereConditions }),
//       ])

//       const totalPage = Math.ceil(totalCount / parPage)

//       return responseReturn(res, 200, {
//         payments: payments,
//         pagination: {
//           total: totalCount,
//           totalPage,
//           currentPage: page,
//           perPage: parPage,
//           hasNext: page < totalPage,
//           hasPrev: page > 1,
//         },

//         message: 'Payments retrieved successfully',
//       })
//     } catch (error: any) {
//       console.error('Payment retrieval error:', error)
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error.message || 'Unknown error occurred',
//       })
//     }
//   }

//   deletePayment = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Validate voucherNo from URL params
//       const paramsValidation = VoucherNoSchema.safeParse({
//         voucherNo: req.params.voucherNo,
//         formType: req.body.formType,
//       })
//       if (!paramsValidation.success) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: paramsValidation.error.errors,
//         })
//       }

//       const { voucherNo, formType } = paramsValidation.data

//       // Check if payment exists
//       const existingPayment = await prisma.payment.findUnique({
//         where: { voucherNo },
//       })

//       if (!existingPayment) {
//         return responseReturn(res, 404, {
//           error: 'Not found',
//           message: `Payment with voucher number ${voucherNo} not found`,
//         })
//       }

//       const existingMovement = await prisma.movement.findFirst({
//         where: { voucherNo: voucherNo, typeId: formType },
//       })

//       if (!existingMovement) {
//         return responseReturn(res, 404, {
//           error: 'Movement not found',
//           message: `Movement with voucher ${voucherNo} not found`,
//         })
//       }

//       // Delete payment
//       const [deletedMovement, deletedPayment] = await prisma.$transaction([
//         prisma.movement.deleteMany({
//           where: { id: existingMovement.id },
//         }),
//         prisma.payment.delete({
//           where: { voucherNo },
//         }),
//       ])

//       return responseReturn(res, 200, {
//         payment: deletedPayment,
//         deletedMovement,
//         message: 'Payment deleted successfully',
//       })
//       // const deletedPayment = await prisma.payment.delete({
//       //   where: { voucherNo },
//       // })

//       // return responseReturn(res, 200, {
//       //   data: deletedPayment,
//       //   message: 'Payment deleted successfully',
//       // })
//     } catch (error: any) {
//       console.error('Payment deletion error:', error)

//       // Handle Prisma errors
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2025':
//             return responseReturn(res, 404, {
//               error: 'Not found',
//               message: 'Payment does not exist',
//             })
//           case 'P2003':
//             return responseReturn(res, 409, {
//               error: 'Conflict',
//               message: 'Cannot delete payment with existing dependencies',
//             })
//         }
//       }

//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error.message || 'Unknown error occurred',
//       })
//     }
//   }
}

export default new PaymentController()
