import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import path from 'path'
import {
    SendTransferCreateSchema
} from '../types/sendTransfer.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
// const prisma = new PrismaClient()

const rootDir = process.cwd()
const uploadsDir = path.join(rootDir, 'uploads')
const orderDir = path.join(uploadsDir, 'orders')

class SenTransferController {
  createTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const importValidation = SendTransferCreateSchema.safeParse(req.body)
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
        ComeReciever_ID,
        HmulafromComReciever,
        HmulatoComReciever,
        RecieverPerson,
        RecieverAddress,
        RecieverPhone,
        SenderPerson,
        SenderAddress,
        SenderPhone,
        AmountTransfer,
        HmulatoComSender,
        TotalTransferToReceiver,
        Notes,
        USER_ID,
        transferTypeId,
        addressID,
        Hmula_ID,
        typeId,
        type,
        currencyType,
        ...rest
      } = importValidation.data

      // Validate TotalTransferToReceiver
      if (TotalTransferToReceiver <= 0) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          message: 'Total amount must be greater than 0',
        })
      }

      // Validate AmountTransfer
      if (AmountTransfer <= 0) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          message: 'Transfer amount must be greater than 0',
        })
      }

      const noteTosender = 'عمولە بۆ نێردەر'
      const noteToreciever = 'عمولە بۆ وەرگر'
      const noteFromsender = 'عمولە لەسەر نێردەر'
      const noteFromreciever = 'عمولە لەسەر وەرگر'

      // Check foreign keys
      const [mainAccount, debtorAccount, daneAccount] = await Promise.all([
        prisma.accounts.findUnique({
          where: { accountId: ComSender_ID },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: ComeReciever_ID },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: Hmula_ID },
          select: { accountId: true },
        }),
      ])

      if (!mainAccount) {
        return responseReturn(res, 404, {
          error: `Not found 1 ${ComSender_ID}`,
          message: `Account with id ${ComSender_ID} not found`,
        })
      }

      if (!debtorAccount) {
        return responseReturn(res, 404, {
          error: `Not found 2 ${ComeReciever_ID}`,
          message: `Debtor account with id ${ComeReciever_ID} not found`,
        })
      }

      if (!daneAccount) {
        return responseReturn(res, 404, {
          error: `Not found 3 ${Hmula_ID}`,
          message: `Dane account with id ${Hmula_ID} not found`,
        })
      }

      // Use a transaction for everything to avoid race conditions
      // const result = await prisma.$transaction(async (tx) => {
      //   // Get the next voucher number atomically
      //   const lastVoucher = await tx.sendTransfer.findFirst({
      //     orderBy: { voucherNo: 'desc' },
      //     select: { voucherNo: true },
      //   })
      //   const newVoucherNo = (lastVoucher?.voucherNo || 100) + 1

      //   // Create the main transfer record
      //   const newSendTransfer = await tx.sendTransfer.create({
      //     data: {
      //       voucherNo: newVoucherNo,
      //       createdAt,
      //       currencyId,
      //       ComSender_ID,
      //       HmulafromComSender,
      //       ComeReciever_ID,
      //       HmulafromComReciever,
      //       HmulatoComReciever,
      //       RecieverPerson,
      //       RecieverAddress,
      //       RecieverPhone,
      //       SenderPerson,
      //       SenderAddress,
      //       SenderPhone,
      //       AmountTransfer,
      //       HmulatoComSender,
      //       TotalTransferToReceiver,
      //       Notes,
      //       USER_ID,
      //       addressID,
      //       transferTypeId,
      //     },
      //   })

      //   // Always create the main transfer movement
      //   await tx.movement.create({
      //     data: {
      //       voucherNo: newVoucherNo,
      //       receiptNo: 0,
      //       debtorId: ComSender_ID,
      //       daneId: ComeReciever_ID,
      //       typeId,
      //       type,
      //       currencyId,
      //       currencyType,
      //       amountTaking: AmountTransfer,
      //       amountPay: AmountTransfer,
      //       note: `${RecieverPerson ?? ''} ${RecieverPhone ?? ''}`,
      //     },
      //   })

      //   // Conditional commission movements - only create if > 0
      //   // 1. Commission to sender (HmulatoComSender)
      //   if (HmulatoComSender && HmulatoComSender > 0) {
      //     await tx.movement.create({
      //       data: {
      //         voucherNo: newVoucherNo,
      //         receiptNo: 0,
      //         debtorId: Hmula_ID,
      //         daneId: ComSender_ID,
      //         typeId,
      //         type,
      //         currencyId,
      //         currencyType,
      //         amountTaking: HmulatoComSender,
      //         amountPay: HmulatoComSender,
      //         note: noteTosender,
      //       },
      //     })
      //   }

      //   // 2. Commission from sender (HmulafromComSender)
      //   if (HmulafromComSender && HmulafromComSender > 0) {
      //     await tx.movement.create({
      //       data: {
      //         voucherNo: newVoucherNo,
      //         receiptNo: 0,
      //         debtorId: ComSender_ID,
      //         daneId: Hmula_ID,
      //         typeId,
      //         type,
      //         currencyId,
      //         currencyType,
      //         amountTaking: HmulafromComSender,
      //         amountPay: HmulafromComSender,
      //         note: noteFromsender,
      //       },
      //     })
      //   }

      //   // 3. Commission to receiver (HmulatoComReciever)
      //   if (HmulatoComReciever && HmulatoComReciever > 0) {
      //     await tx.movement.create({
      //       data: {
      //         voucherNo: newVoucherNo,
      //         receiptNo: 0,
      //         debtorId: Hmula_ID,
      //         daneId: ComeReciever_ID,
      //         typeId,
      //         type,
      //         currencyId,
      //         currencyType,
      //         amountTaking: HmulatoComReciever,
      //         amountPay: HmulatoComReciever,
      //         note: noteToreciever,
      //       },
      //     })
      //   }

      //   // 4. Commission from receiver (HmulafromComReciever)
      //   if (HmulafromComReciever && HmulafromComReciever > 0) {
      //     await tx.movement.create({
      //       data: {
      //         voucherNo: newVoucherNo,
      //         receiptNo: 0,
      //         debtorId: ComeReciever_ID,
      //         daneId: Hmula_ID,
      //         typeId,
      //         type,
      //         currencyId,
      //         currencyType,
      //         amountTaking: HmulafromComReciever,
      //         amountPay: HmulafromComReciever,
      //         note: noteFromreciever,
      //       },
      //     })
      //   }

      //   return {
      //     newSendTransfer,
      //     newVoucherNo,
      //     newTransferId: newSendTransfer.id,
      //   }
      // })

      const newSendTransfer = await prisma.sendTransfer.create({
  data: {
    // All fields EXCEPT voucherNo and fiscalYear (trigger sets them)
    createdAt,
    currencyId,
    ComSender_ID,
    HmulafromComSender,
    ComeReciever_ID,
    HmulafromComReciever,
    HmulatoComReciever,
    RecieverPerson,
    RecieverAddress,
    RecieverPhone,
    SenderPerson,
    SenderAddress,
    SenderPhone,
    AmountTransfer,
    HmulatoComSender,
    TotalTransferToReceiver,
    Notes,
    USER_ID,
    addressID,
    transferTypeId,
    // ✅ NEW: store commission account and type info
    hmulaId: Hmula_ID,
    typeId,
    type: "ناردن",
  }
});

      return responseReturn(res, 201, {
  sendTransfer: newSendTransfer,
  transferVoucherNo: newSendTransfer.voucherNo,
  transferId: newSendTransfer.id,
  message: 'Send Transfer done successfully',
});
    } catch (error: any) {
      console.error('Send Transfer creation error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            // If still getting duplicate, implement retry logic or use database sequence
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

  // updateSendTransfer = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const { voucherNo } = req.params

  //     // Add voucherNo to body for validation
  //     const importValidation = SendTransferUpdateSchema.safeParse({
  //       ...req.body,
  //       voucherNo: parseInt(voucherNo),
  //     })

  //     if (!importValidation.success) {
  //       console.error('Validation failed:', importValidation.error.format())
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         details: importValidation.error.errors,
  //       })
  //     }

  //     const {
  //       id,
  //       createdAt,
  //       currencyId,
  //       ComSender_ID,
  //       HmulafromComSender,
  //       ComeReciever_ID,
  //       HmulafromComReciever,
  //       HmulatoComReciever,
  //       RecieverPerson,
  //       RecieverAddress,
  //       RecieverPhone,
  //       SenderPerson,
  //       SenderAddress,
  //       SenderPhone,
  //       AmountTransfer,
  //       HmulatoComSender,
  //       TotalTransferToReceiver,
  //       Notes,
  //       USER_ID,
  //       transferTypeId,
  //       addressID,
  //       Hmula_ID,
  //       typeId,
  //       type,
  //       currencyType,
  //       ...rest
  //     } = importValidation.data

  //     // First, get the existing transfer record
  //     const existingTransfer = await prisma.sendTransfer.findFirst({
  //       where: {
  //         id,
  //         voucherNo: parseInt(voucherNo),
  //       },
  //     })

  //     if (!existingTransfer) {
  //       return responseReturn(res, 404, {
  //         error: 'Transfer record not found',
  //         message: `Transfer with id ${id} and voucherNo ${voucherNo} not found`,
  //       })
  //     }

  //     // Validate TotalTransferToReceiver if provided
  //     if (
  //       TotalTransferToReceiver !== undefined &&
  //       TotalTransferToReceiver <= 0
  //     ) {
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         message: 'Total amount must be greater than 0',
  //       })
  //     }

  //     // Validate AmountTransfer if provided
  //     if (AmountTransfer !== undefined && AmountTransfer <= 0) {
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         message: 'Transfer amount must be greater than 0',
  //       })
  //     }

  //     const noteTosender = 'عمولە بۆ نێردەر'
  //     const noteToreciever = 'عمولە بۆ وەرگر'
  //     const noteFromsender = 'عمولە لەسەر نێردەر'
  //     const noteFromreciever = 'عمولە لەسەر وەرگر'

  //     // Check foreign keys for updated fields
  //     const checkPromises = []

  //     if (ComSender_ID !== undefined) {
  //       checkPromises.push(
  //         prisma.accounts.findUnique({
  //           where: { accountId: ComSender_ID },
  //           select: { accountId: true },
  //         })
  //       )
  //     }

  //     if (ComeReciever_ID !== undefined) {
  //       checkPromises.push(
  //         prisma.accounts.findUnique({
  //           where: { accountId: ComeReciever_ID },
  //           select: { accountId: true },
  //         })
  //       )
  //     }

  //     if (Hmula_ID !== undefined) {
  //       checkPromises.push(
  //         prisma.accounts.findUnique({
  //           where: { accountId: Hmula_ID },
  //           select: { accountId: true },
  //         })
  //       )
  //     }

  //     // Execute all checks
  //     const checkResults = await Promise.all(checkPromises)

  //     // Validate check results
  //     let resultIndex = 0

  //     if (ComSender_ID !== undefined) {
  //       if (!checkResults[resultIndex++]) {
  //         return responseReturn(res, 404, {
  //           error: `Not found 1 ${ComSender_ID}`,
  //           message: `Sender account with id ${ComSender_ID} not found`,
  //         })
  //       }
  //     }

  //     if (ComeReciever_ID !== undefined) {
  //       if (!checkResults[resultIndex++]) {
  //         return responseReturn(res, 404, {
  //           error: `Not found 2 ${ComeReciever_ID}`,
  //           message: `Receiver account with id ${ComeReciever_ID} not found`,
  //         })
  //       }
  //     }

  //     if (Hmula_ID !== undefined) {
  //       if (!checkResults[resultIndex]) {
  //         return responseReturn(res, 404, {
  //           error: `Not found 3 ${Hmula_ID}`,
  //           message: `Commission account with id ${Hmula_ID} not found`,
  //         })
  //       }
  //     }

  //     // Build transaction operations array
  //     const transactionOperations: Prisma.PrismaPromise<any>[] = []

  //     // 1. Update the send transfer record
  //     const updateData: any = {}
  //     if (createdAt !== undefined) updateData.createdAt = createdAt
  //     if (currencyId !== undefined) updateData.currencyId = currencyId
  //     if (ComSender_ID !== undefined) updateData.ComSender_ID = ComSender_ID
  //     if (HmulafromComSender !== undefined)
  //       updateData.HmulafromComSender = HmulafromComSender
  //     if (ComeReciever_ID !== undefined)
  //       updateData.ComeReciever_ID = ComeReciever_ID
  //     if (HmulafromComReciever !== undefined)
  //       updateData.HmulafromComReciever = HmulafromComReciever
  //     if (HmulatoComReciever !== undefined)
  //       updateData.HmulatoComReciever = HmulatoComReciever
  //     if (RecieverPerson !== undefined)
  //       updateData.RecieverPerson = RecieverPerson
  //     if (RecieverAddress !== undefined)
  //       updateData.RecieverAddress = RecieverAddress
  //     if (RecieverPhone !== undefined) updateData.RecieverPhone = RecieverPhone
  //     if (SenderPerson !== undefined) updateData.SenderPerson = SenderPerson
  //     if (SenderAddress !== undefined) updateData.SenderAddress = SenderAddress
  //     if (SenderPhone !== undefined) updateData.SenderPhone = SenderPhone
  //     if (AmountTransfer !== undefined)
  //       updateData.AmountTransfer = AmountTransfer
  //     if (HmulatoComSender !== undefined)
  //       updateData.HmulatoComSender = HmulatoComSender
  //     if (TotalTransferToReceiver !== undefined)
  //       updateData.TotalTransferToReceiver = TotalTransferToReceiver
  //     if (Notes !== undefined) updateData.Notes = Notes
  //     if (USER_ID !== undefined) updateData.USER_ID = USER_ID
  //     if (transferTypeId !== undefined)
  //       updateData.transferTypeId = transferTypeId
  //     if (addressID !== undefined) updateData.addressID = addressID

  //     transactionOperations.push(
  //       prisma.sendTransfer.update({
  //         where: {
  //           id: existingTransfer.id,
  //           voucherNo: parseInt(voucherNo),
  //         },
  //         data: updateData,
  //       })
  //     )

  //     // 2. Delete existing movements for this voucherNo and typeId
  //     transactionOperations.push(
  //       prisma.movement.deleteMany({
  //         where: {
  //           voucherNo: parseInt(voucherNo),
  //           typeId: typeId,
  //         },
  //       })
  //     )

  //     // 3. Add new movement operations based on conditions
  //     // Determine which values to use for movement creation
  //     const finalComSender_ID = ComSender_ID ?? existingTransfer.ComSender_ID
  //     const finalComeReciever_ID =
  //       ComeReciever_ID ?? existingTransfer.ComeReciever_ID
  //     const finalHmula_ID = Hmula_ID ?? 0
  //     const finalAmountTransfer =
  //       AmountTransfer ?? existingTransfer.AmountTransfer
  //     const finalCurrencyId = currencyId ?? existingTransfer.currencyId
  //     const finalCurrencyType = currencyType ?? ''
  //     const finalTypeId = typeId ?? 0
  //     const finalType = type ?? ''
  //     const finalRecieverPerson =
  //       RecieverPerson ?? existingTransfer.RecieverPerson
  //     const finalRecieverPhone = RecieverPhone ?? existingTransfer.RecieverPhone
  //     const finalHmulatoComSender =
  //       HmulatoComSender ?? existingTransfer.HmulatoComSender
  //     const finalHmulafromComSender =
  //       HmulafromComSender ?? existingTransfer.HmulafromComSender
  //     const finalHmulatoComReciever =
  //       HmulatoComReciever ?? existingTransfer.HmulatoComReciever
  //     const finalHmulafromComReciever =
  //       HmulafromComReciever ?? existingTransfer.HmulafromComReciever

  //     // Always create the main transfer movement
  //     transactionOperations.push(
  //       prisma.movement.create({
  //         data: {
  //           voucherNo: parseInt(voucherNo),
  //           receiptNo: 0,
  //           debtorId: finalComSender_ID,
  //           daneId: finalComeReciever_ID,
  //           typeId: finalTypeId,
  //           type: finalType,
  //           currencyId: finalCurrencyId,
  //           currencyType: finalCurrencyType,
  //           amountTaking: finalAmountTransfer,
  //           amountPay: finalAmountTransfer,
  //           note: `${finalRecieverPerson ?? ''} ${finalRecieverPhone ?? ''}`,
  //         },
  //       })
  //     )

  //     // Conditional commission movements - only create if > 0
  //     // 1. Commission to sender (HmulatoComSender)
  //     if (finalHmulatoComSender && finalHmulatoComSender > 0) {
  //       transactionOperations.push(
  //         prisma.movement.create({
  //           data: {
  //             voucherNo: parseInt(voucherNo),
  //             receiptNo: 0,
  //             debtorId: finalHmula_ID,
  //             daneId: finalComSender_ID,
  //             typeId: finalTypeId,
  //             type: finalType,
  //             currencyId: finalCurrencyId,
  //             currencyType: finalCurrencyType,
  //             amountTaking: finalHmulatoComSender,
  //             amountPay: finalHmulatoComSender,
  //             note: noteTosender,
  //           },
  //         })
  //       )
  //     }

  //     // 2. Commission from sender (HmulafromComSender)
  //     if (finalHmulafromComSender && finalHmulafromComSender > 0) {
  //       transactionOperations.push(
  //         prisma.movement.create({
  //           data: {
  //             voucherNo: parseInt(voucherNo),
  //             receiptNo: 0,
  //             debtorId: finalComSender_ID,
  //             daneId: finalHmula_ID,
  //             typeId: finalTypeId,
  //             type: finalType,
  //             currencyId: finalCurrencyId,
  //             currencyType: finalCurrencyType,
  //             amountTaking: finalHmulafromComSender,
  //             amountPay: finalHmulafromComSender,
  //             note: noteFromsender,
  //           },
  //         })
  //       )
  //     }

  //     // 3. Commission to receiver (HmulatoComReciever)
  //     if (finalHmulatoComReciever && finalHmulatoComReciever > 0) {
  //       transactionOperations.push(
  //         prisma.movement.create({
  //           data: {
  //             voucherNo: parseInt(voucherNo),
  //             receiptNo: 0,
  //             debtorId: finalHmula_ID,
  //             daneId: finalComeReciever_ID,
  //             typeId: finalTypeId,
  //             type: finalType,
  //             currencyId: finalCurrencyId,
  //             currencyType: finalCurrencyType,
  //             amountTaking: finalHmulatoComReciever,
  //             amountPay: finalHmulatoComReciever,
  //             note: noteToreciever,
  //           },
  //         })
  //       )
  //     }

  //     // 4. Commission from receiver (HmulafromComReciever)
  //     if (finalHmulafromComReciever && finalHmulafromComReciever > 0) {
  //       transactionOperations.push(
  //         prisma.movement.create({
  //           data: {
  //             voucherNo: parseInt(voucherNo),
  //             receiptNo: 0,
  //             debtorId: finalComeReciever_ID,
  //             daneId: finalHmula_ID,
  //             typeId: finalTypeId,
  //             type: finalType,
  //             currencyId: finalCurrencyId,
  //             currencyType: finalCurrencyType,
  //             amountTaking: finalHmulafromComReciever,
  //             amountPay: finalHmulafromComReciever,
  //             note: noteFromreciever,
  //           },
  //         })
  //       )
  //     }

  //     // Execute all operations in a single transaction
  //     const results = await prisma.$transaction(transactionOperations)

  //     // Extract results
  //     const updatedTransfer = results[0] // The updated transfer record
  //     const deleteResult = results[1] // Delete result
  //     const movementResults = results.slice(2) // Movement results start from index 2

  //     return responseReturn(res, 200, {
  //       sendTransfer: updatedTransfer,
  //       transferVoucherNo: voucherNo,
  //       movements: movementResults,
  //       message: 'Send Transfer updated successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Send Transfer update error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       switch (error.code) {
  //         case 'P2002':
  //           return responseReturn(res, 409, {
  //             error: 'Duplicate voucher',
  //             message: 'Voucher number conflict, please try again',
  //           })
  //         case 'P2003':
  //           return responseReturn(res, 404, {
  //             error: 'Reference error',
  //             message: 'Linked account not found',
  //           })
  //         case 'P2025':
  //           return responseReturn(res, 404, {
  //             error: 'Record not found',
  //             message: 'Transfer record not found',
  //           })
  //       }
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }

  // getSendTransferByVoucherNo = async (
  //   req: Request,
  //   res: Response
  // ): Promise<void> => {
  //   try {
  //     // Validate voucherNo from route params
  //     const voucherNo = req.params.voucherNo
  //     if (!voucherNo || isNaN(Number(voucherNo))) {
  //       return responseReturn(res, 400, {
  //         error: 'Invalid voucher number',
  //         message: 'Please provide a valid numeric voucher number',
  //       })
  //     }

  //     const sendTransfer = await prisma.sendTransfer.findUnique({
  //       where: { voucherNo: Number(voucherNo) },
  //       include: {
  //         sender: {
  //           select: {
  //             accountId: true,
  //             name: true,
  //             phone: true,
  //             address: true,
  //           },
  //         },
  //         receiver: {
  //           select: {
  //             accountId: true,
  //             name: true,
  //             phone: true,
  //             address: true,
  //           },
  //         },
  //         admin: true,
  //         currency: {
  //           select: {
  //             currencyId: true,
  //             currencySymbol: true,
  //             currency: true,
  //             CurrencyPrice: true,
  //           },
  //         },
  //         address: true,
  //       },
  //     })

  //     if (!sendTransfer) {
  //       return responseReturn(res, 404, {
  //         error: 'sendTransfer Voucher not found',
  //         message: `sendTransfer Voucher with voucher number ${voucherNo} not found`,
  //       })
  //     }

  //     return responseReturn(res, 200, {
  //       sendTransfer: sendTransfer, // Changed from 'importCar' to 'exchange' for consistency
  //       message: 'sendTransfer Voucher retrieved successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Get sendTransfer Voucher by voucherNo error:', error)
  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Failed to retrieve sendTransfer voucher',
  //     })
  //   }
  // }

  // getSendTransfers = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const queryValidation = SendTransferQuerySchema.safeParse(req.query)
  //     if (!queryValidation.success) {
  //       console.error(
  //         'Query validation failed:',
  //         queryValidation.error.format()
  //       )
  //       return responseReturn(res, 400, {
  //         error: 'Invalid query parameters',
  //         details: queryValidation.error.errors,
  //       })
  //     }

  //     const {
  //       page,
  //       parPage,
  //       searchValue,
  //       currencyId,
  //       sortBy = 'createdAt',
  //       sortOrder = 'desc',
  //       fromDate,
  //       toDate,
  //     } = queryValidation.data

  //     const fromDateAdjusted = fromDate
  //       ? moment.utc(fromDate).utcOffset('+03:00').startOf('day').toDate()
  //       : null

  //     const toDateAdjusted = toDate
  //       ? moment.utc(toDate).utcOffset('+03:00').endOf('day').toDate()
  //       : null

  //     const whereConditions: Prisma.SendTransferWhereInput = {
  //       ...(currencyId && { currencyId }),
  //       ...((fromDateAdjusted || toDateAdjusted) && {
  //         createdAt: {
  //           ...(fromDateAdjusted && { gte: fromDateAdjusted }),
  //           ...(toDateAdjusted && { lte: toDateAdjusted }),
  //         },
  //       }),
  //     }

  //     // Add search condition if searchValue exists
  //     if (searchValue) {
  //       const searchNumber = Number(searchValue)
  //       const isNumber = !isNaN(searchNumber) && isFinite(searchNumber)

  //       whereConditions.OR = [
  //         ...(isNumber ? [{ voucherNo: searchNumber }] : []),
  //         {
  //           RecieverPerson: {
  //             contains: searchValue,
  //             mode: 'insensitive' as Prisma.QueryMode,
  //           },
  //         },
  //       ]
  //     }

  //     // Execute queries in parallel
  //     const [sendTransfers, totalCount] = await Promise.all([
  //       prisma.sendTransfer.findMany({
  //         skip: (page - 1) * parPage,
  //         take: parPage,
  //         where: whereConditions,
  //         orderBy: { [sortBy]: sortOrder },
  //         include: {
  //           sender: {
  //             select: {
  //               id: true,
  //               name: true,
  //             },
  //           },
  //           currency: {
  //             select: {
  //               id: true,
  //               currencyId: true,
  //               currency: true,
  //               currencySymbol: true,
  //               CurrencyPrice: true,
  //               currencyAction: true,
  //             },
  //           },
  //           admin: {
  //             select: {
  //               id: true,
  //               name: true,
  //             },
  //           },
  //         },
  //       }),
  //       prisma.sendTransfer.count({
  //         where: whereConditions,
  //       }),
  //     ])

  //     const totalPages = Math.ceil(totalCount / parPage)

  //     return responseReturn(res, 200, {
  //       sendTransfers: sendTransfers,
  //       pagination: {
  //         total: totalCount,
  //         totalPage: totalPages,
  //         currentPage: page,
  //         perPage: parPage,
  //         hasNext: page < totalPages,
  //         hasPrev: page > 1,
  //       },
  //       message: 'Send Transfers retrieved successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Get all send transfers error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: error.message,
  //       })
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Failed to retrieve exchange All records',
  //     })
  //   }
  // }

  // deleteSendTransferByVoucherNo = async (
  //   req: Request,
  //   res: Response
  // ): Promise<void> => {
  //   try {
  //     const { voucherNo } = req.params

  //     // Validate request
  //     const bodyValidation = DeleteSendTransferSchema.safeParse({
  //       ...req.body,
  //       voucherNo: parseInt(voucherNo),
  //     })

  //     if (!bodyValidation.success) {
  //       console.error('Validation failed:', bodyValidation.error.format())
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         details: bodyValidation.error.errors,
  //       })
  //     }

  //     const { typeId } = bodyValidation.data
  //     const voucherNoInt = parseInt(voucherNo)

  //     // Get the existing send transfer
  //     const existingSendTransfer = await prisma.sendTransfer.findUnique({
  //       where: { voucherNo: voucherNoInt },
  //       include: {
  //         currency: true,
  //         sender: true,
  //         receiver: true,
  //         address: true,
  //         admin: true,
  //       },
  //     })

  //     if (!existingSendTransfer) {
  //       return responseReturn(res, 404, {
  //         error: 'Not found',
  //         message: `Send transfer with voucher number ${voucherNo} not found`,
  //       })
  //     }

  //     // Create cancelled send transfer record first
  //     const cancelledSendTransferData = {
  //       voucherNo: existingSendTransfer.voucherNo,
  //       createdAt: existingSendTransfer.createdAt || new Date(),
  //       currencyId: existingSendTransfer.currencyId,
  //       ComSender_ID: existingSendTransfer.ComSender_ID,
  //       HmulafromComSender: existingSendTransfer.HmulafromComSender,
  //       ComeReciever_ID: existingSendTransfer.ComeReciever_ID,
  //       HmulafromComReciever: existingSendTransfer.HmulafromComReciever,
  //       HmulatoComReciever: existingSendTransfer.HmulatoComReciever,
  //       RecieverPerson: existingSendTransfer.RecieverPerson,
  //       RecieverAddress: existingSendTransfer.RecieverAddress,
  //       RecieverPhone: existingSendTransfer.RecieverPhone,
  //       SenderPerson: existingSendTransfer.SenderPerson,
  //       SenderAddress: existingSendTransfer.SenderAddress,
  //       SenderPhone: existingSendTransfer.SenderPhone,
  //       AmountTransfer: existingSendTransfer.AmountTransfer,
  //       HmulatoComSender: existingSendTransfer.HmulatoComSender,
  //       TotalTransferToReceiver: existingSendTransfer.TotalTransferToReceiver,
  //       Notes: existingSendTransfer.Notes || '',
  //       USER_ID: existingSendTransfer.USER_ID,
  //       addressID: existingSendTransfer.addressID,
  //       transferTypeId: existingSendTransfer.transferTypeId,
  //     }

  //     // Perform all operations in a single transaction
  //     const [cancelledRecord, deletedMovement, deleteSendTransfer] =
  //       await prisma.$transaction([
  //         // Create cancelled record
  //         prisma.cancelledSendTransfer.create({
  //           data: cancelledSendTransferData,
  //         }),

  //         // Delete movement records
  //         prisma.movement.deleteMany({
  //           where: {
  //             voucherNo: voucherNoInt,
  //             typeId,
  //           },
  //         }),

  //         // Delete original send transfer
  //         prisma.sendTransfer.delete({
  //           where: { voucherNo: voucherNoInt },
  //         }),
  //       ])

  //     return responseReturn(res, 200, {
  //       cancelledRecord,
  //       deletedMovement,
  //       deleteSendTransfer,
  //       message: 'Send transfer cancelled successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Send transfer deletion error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       switch (error.code) {
  //         case 'P2025':
  //           return responseReturn(res, 404, {
  //             error: 'Not found',
  //             message: 'Send transfer or movement does not exist',
  //           })
  //         case 'P2002':
  //           return responseReturn(res, 409, {
  //             error: 'Duplicate',
  //             message: 'Cancelled record already exists for this voucher',
  //           })
  //         case 'P2003':
  //           return responseReturn(res, 409, {
  //             error: 'Conflict',
  //             message: 'Cannot delete Send transfer with existing dependencies',
  //           })
  //       }
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }

  // getCancelledSendTransfers = async (
  //   req: Request,
  //   res: Response
  // ): Promise<void> => {
  //   try {
  //     const queryValidation = SendTransferQuerySchema.safeParse(req.query)
  //     if (!queryValidation.success) {
  //       console.error(
  //         'Query validation failed:',
  //         queryValidation.error.format()
  //       )
  //       return responseReturn(res, 400, {
  //         error: 'Invalid query parameters',
  //         details: queryValidation.error.errors,
  //       })
  //     }

  //     const {
  //       page,
  //       parPage,
  //       searchValue,
  //       currencyId,
  //       sortBy = 'createdAt',
  //       sortOrder = 'desc',
  //       fromDate,
  //       toDate,
  //     } = queryValidation.data

  //     const fromDateAdjusted = fromDate
  //       ? moment.utc(fromDate).utcOffset('+03:00').startOf('day').toDate()
  //       : null

  //     const toDateAdjusted = toDate
  //       ? moment.utc(toDate).utcOffset('+03:00').endOf('day').toDate()
  //       : null

  //     const whereConditions: Prisma.CancelledSendTransferWhereInput = {
  //       ...(currencyId && { currencyId }),
  //       ...((fromDateAdjusted || toDateAdjusted) && {
  //         createdAt: {
  //           ...(fromDateAdjusted && { gte: fromDateAdjusted }),
  //           ...(toDateAdjusted && { lte: toDateAdjusted }),
  //         },
  //       }),
  //     }

  //     // Add search condition if searchValue exists
  //     if (searchValue) {
  //       const searchNumber = Number(searchValue)
  //       const isNumber = !isNaN(searchNumber) && isFinite(searchNumber)

  //       whereConditions.OR = [
  //         ...(isNumber ? [{ voucherNo: searchNumber }] : []),
  //         {
  //           RecieverPerson: {
  //             contains: searchValue,
  //             mode: 'insensitive' as Prisma.QueryMode,
  //           },
  //         },
  //       ]
  //     }

  //     // Execute queries in parallel
  //     const [cancelledSendTransfer, totalCount] = await Promise.all([
  //       prisma.cancelledSendTransfer.findMany({
  //         skip: (page - 1) * parPage,
  //         take: parPage,
  //         where: whereConditions,
  //         orderBy: { [sortBy]: sortOrder },
  //         include: {
  //           sender: {
  //             select: {
  //               id: true,
  //               name: true,
  //             },
  //           },
  //           currency: {
  //             select: {
  //               id: true,
  //               currencyId: true,
  //               currency: true,
  //               currencySymbol: true,
  //               CurrencyPrice: true,
  //               currencyAction: true,
  //             },
  //           },
  //           admin: {
  //             select: {
  //               id: true,
  //               name: true,
  //             },
  //           },
  //         },
  //       }),
  //       prisma.cancelledSendTransfer.count({
  //         where: whereConditions,
  //       }),
  //     ])

  //     const totalPages = Math.ceil(totalCount / parPage)

  //     return responseReturn(res, 200, {
  //       cancelledSendTransfer: cancelledSendTransfer,
  //       pagination: {
  //         total: totalCount,
  //         totalPage: totalPages,
  //         currentPage: page,
  //         perPage: parPage,
  //         hasNext: page < totalPages,
  //         hasPrev: page > 1,
  //       },
  //       message: 'Cancelled send Transfers retrieved successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Get all send transfers error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: error.message,
  //       })
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Failed to retrieve exchange All records',
  //     })
  //   }
  // }

  // // In your backend controller
  // deleteCancelledSendTransferByVoucherNo = async (
  //   req: Request,
  //   res: Response
  // ): Promise<void> => {
  //   try {
  //     const { voucherNo } = req.params
  //     const voucherNoInt = parseInt(voucherNo)

  //     // Validate voucher number
  //     if (isNaN(voucherNoInt)) {
  //       return responseReturn(res, 400, {
  //         error: 'Invalid voucher number',
  //         message: 'Voucher number must be a valid integer',
  //       })
  //     }

  //     // Get the existing cancelled send transfer
  //     const existingCancelledTransfer =
  //       await prisma.cancelledSendTransfer.findUnique({
  //         where: { voucherNo: voucherNoInt },
  //         include: {
  //           currency: true,
  //           sender: true,
  //           receiver: true,
  //           address: true,
  //           admin: true,
  //         },
  //       })

  //     if (!existingCancelledTransfer) {
  //       return responseReturn(res, 404, {
  //         error: 'Not found',
  //         message: `Cancelled Send transfer with voucher number ${voucherNo} not found`,
  //       })
  //     }

  //     // Delete the cancelled send transfer
  //     const deletedRecord = await prisma.cancelledSendTransfer.delete({
  //       where: { voucherNo: voucherNoInt },
  //     })

  //     return responseReturn(res, 200, {
  //       deletedRecord,
  //       message: 'Cancelled send transfer deleted successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Cancelled send transfer deletion error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       switch (error.code) {
  //         case 'P2025':
  //           return responseReturn(res, 404, {
  //             error: 'Not found',
  //             message: 'Cancelled send transfer does not exist',
  //           })
  //         case 'P2003':
  //           return responseReturn(res, 409, {
  //             error: 'Conflict',
  //             message: 'Cannot delete due to existing dependencies',
  //           })
  //       }
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }
}

export default new SenTransferController()
