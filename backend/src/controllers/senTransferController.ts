import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import moment from 'moment'
import path from 'path'
import {
  SendTransferCreateSchema,
  SendTransferQuerySchema,
  SendTransferSingleGetSchema,
  SendTransferUpdateSchema
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

      // const noteTosender = 'عمولە بۆ نێردەر'
      // const noteToreciever = 'عمولە بۆ وەرگر'
      // const noteFromsender = 'عمولە لەسەر نێردەر'
      // const noteFromreciever = 'عمولە لەسەر وەرگر'

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
    Hmula_ID: Hmula_ID,
    currencyType,
      typeId,
    type,
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

updateSendTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voucherNo } = req.params
    const voucherNoInt = parseInt(voucherNo)

    const validationResult = SendTransferUpdateSchema.safeParse({
      ...req.body,
      voucherNo: voucherNoInt,
    })
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.errors,
      })
    }

    const {
      id,
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
    } = validationResult.data

    // -----------------------------------------------------------------
    // 1. Fetch existing send transfer
    // -----------------------------------------------------------------
    const existing = await prisma.sendTransfer.findFirst({
      where: { id, voucherNo: voucherNoInt },
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        createdAt: true,
        currencyId: true,
        ComSender_ID: true,
        HmulafromComSender: true,
        ComeReciever_ID: true,
        HmulafromComReciever: true,
        HmulatoComReciever: true,
        RecieverPerson: true,
        RecieverAddress: true,
        RecieverPhone: true,
        SenderPerson: true,
        SenderAddress: true,
        SenderPhone: true,
        AmountTransfer: true,
        HmulatoComSender: true,
        TotalTransferToReceiver: true,
        Notes: true,
        USER_ID: true,
        addressID: true,
        transferTypeId: true,
        Hmula_ID: true,
        typeId: true,
        type: true,
        currencyType: true,
      },
    })

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Send transfer not found',
        message: `Send transfer with id ${id} and voucherNo ${voucherNo} not found`,
      })
    }

    // -----------------------------------------------------------------
    // 2. Validate foreign keys if they are being updated
    // -----------------------------------------------------------------
    const checks: Promise<any>[] = []
    if (ComSender_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: ComSender_ID },
          select: { accountId: true },
        })
      )
    }
    if (ComeReciever_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: ComeReciever_ID },
          select: { accountId: true },
        })
      )
    }
    if (Hmula_ID !== undefined) {
      checks.push(
        prisma.accounts.findUnique({
          where: { accountId: Hmula_ID },
          select: { accountId: true },
        })
      )
    }

    const results = await Promise.all(checks)
    let idx = 0
    if (ComSender_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Sender account ${ComSender_ID} not found`,
      })
    }
    if (ComeReciever_ID !== undefined && !results[idx++]) {
      return responseReturn(res, 404, {
        error: `Receiver account ${ComeReciever_ID} not found`,
      })
    }
    if (Hmula_ID !== undefined && !results[idx]) {
      return responseReturn(res, 404, {
        error: `Commission account ${Hmula_ID} not found`,
      })
    }

    // -----------------------------------------------------------------
    // 3. Build update payload for send_transfer (only provided fields)
    // -----------------------------------------------------------------
    const updatePayload: any = {}
    if (createdAt !== undefined) updatePayload.createdAt = createdAt
    if (currencyId !== undefined) updatePayload.currencyId = currencyId
    if (ComSender_ID !== undefined) updatePayload.ComSender_ID = ComSender_ID
    if (HmulafromComSender !== undefined) updatePayload.HmulafromComSender = HmulafromComSender
    if (ComeReciever_ID !== undefined) updatePayload.ComeReciever_ID = ComeReciever_ID
    if (HmulafromComReciever !== undefined) updatePayload.HmulafromComReciever = HmulafromComReciever
    if (HmulatoComReciever !== undefined) updatePayload.HmulatoComReciever = HmulatoComReciever
    if (RecieverPerson !== undefined) updatePayload.RecieverPerson = RecieverPerson
    if (RecieverAddress !== undefined) updatePayload.RecieverAddress = RecieverAddress
    if (RecieverPhone !== undefined) updatePayload.RecieverPhone = RecieverPhone
    if (SenderPerson !== undefined) updatePayload.SenderPerson = SenderPerson
    if (SenderAddress !== undefined) updatePayload.SenderAddress = SenderAddress
    if (SenderPhone !== undefined) updatePayload.SenderPhone = SenderPhone
    if (AmountTransfer !== undefined) updatePayload.AmountTransfer = AmountTransfer
    if (HmulatoComSender !== undefined) updatePayload.HmulatoComSender = HmulatoComSender
    if (TotalTransferToReceiver !== undefined) updatePayload.TotalTransferToReceiver = TotalTransferToReceiver
    if (Notes !== undefined) updatePayload.Notes = Notes
    if (USER_ID !== undefined) updatePayload.USER_ID = USER_ID
    if (transferTypeId !== undefined) updatePayload.transferTypeId = transferTypeId
    if (addressID !== undefined) updatePayload.addressID = addressID
    if (Hmula_ID !== undefined) updatePayload.Hmula_ID = Hmula_ID
    if (typeId !== undefined) updatePayload.typeId = typeId
    if (type !== undefined) updatePayload.type = type
    if (currencyType !== undefined) updatePayload.currencyType = currencyType

    // -----------------------------------------------------------------
    // 4. Helper to safely convert any value to number (null/undefined → 0)
    // -----------------------------------------------------------------
    const toNumber = (val: any): number => (val == null ? 0 : Number(val))

    // Determine final values (using updated if provided, else existing, converted to number)
    const finalCreatedAt = createdAt ?? existing.createdAt
    const finalCurrencyId = currencyId ?? existing.currencyId
    const finalComSender = ComSender_ID ?? existing.ComSender_ID
    const finalComeReceiver = ComeReciever_ID ?? existing.ComeReciever_ID
    const finalHmula = Hmula_ID ?? existing.Hmula_ID ?? 0
    const finalAmountTransferNum = toNumber(AmountTransfer ?? existing.AmountTransfer)
    const finalHmulatoComSenderNum = toNumber(HmulatoComSender ?? existing.HmulatoComSender)
    const finalHmulafromComSenderNum = toNumber(HmulafromComSender ?? existing.HmulafromComSender)
    const finalHmulatoComReceiverNum = toNumber(HmulatoComReciever ?? existing.HmulatoComReciever)
    const finalHmulafromComReceiverNum = toNumber(HmulafromComReciever ?? existing.HmulafromComReciever)
    const finalNotes = Notes ?? existing.Notes ?? ''
    const finalTypeId = typeId ?? existing.typeId
    const finalType = type ?? existing.type
    const finalCurrencyType = currencyType ?? existing.currencyType

    // -----------------------------------------------------------------
    // 5. Transaction: update send_transfer + replace movement entries
    // -----------------------------------------------------------------
    const updated = await prisma.$transaction(async (tx) => {
      // 5a. Update send_transfer
      const updatedTransfer = await tx.sendTransfer.update({
        where: { id: existing.id },
        data: updatePayload,
      })

      // 5b. Delete all existing movements for this voucher and fiscal year
      await tx.movement.deleteMany({
        where: {
          voucherNo: voucherNoInt,
          fiscalYear: existing.fiscalYear!, 
          typeId: finalTypeId,
        },
      })

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
        })
      }

      // Main transfer movement
      await createMovement(
        'حەوالە ناردن/حوالة صادرة',
        finalComSender,
        finalComeReceiver,
        finalAmountTransferNum,
        finalNotes
      )

      // Commission to sender
      if (finalHmulatoComSenderNum > 0) {
        await createMovement(
          'عمولە بۆ نێردەر/عمولة الحوالة (للمرسل)',
          finalHmula,
          finalComSender,
          finalHmulatoComSenderNum,
          'عمولە بۆ نێردەر'
        )
      }

      // Commission from sender
      if (finalHmulafromComSenderNum > 0) {
        await createMovement(
          'عمولە لەسەر نێردەر/ من المرسل',
          finalComSender,
          finalHmula,
          finalHmulafromComSenderNum,
          'عمولە لەسەر نێردەر'
        )
      }

      // Commission to receiver
      if (finalHmulatoComReceiverNum > 0) {
        await createMovement(
          'عمولە بۆ وەرگر',
          finalHmula,
          finalComeReceiver,
          finalHmulatoComReceiverNum,
          'عمولە بۆ وەرگر'
        )
      }

      // Commission from receiver
      if (finalHmulafromComReceiverNum > 0) {
        await createMovement(
          'عمولە لەسەر وەرگر/ من المستلم',
          finalComeReceiver,
          finalHmula,
          finalHmulafromComReceiverNum,
          'عمولە لەسەر وەرگر/ من المستلم'
        )
      }

      return updatedTransfer
    })

    return responseReturn(res, 200, {
      sendTransfer: updated,
      transferVoucherNo: voucherNo,
      message: 'Send Transfer updated successfully',
    })
  } catch (error: any) {
    console.error('Send Transfer update error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return responseReturn(res, 409, {
            error: 'Duplicate entry',
            message: 'A unique constraint would be violated. Please check your data.',
          })
        case 'P2003':
          return responseReturn(res, 404, {
            error: 'Reference error',
            message: 'Linked account not found',
          })
        case 'P2025':
          return responseReturn(res, 404, {
            error: 'Record not found',
            message: 'Transfer record not found',
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

 getSendTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = SendTransferSingleGetSchema.safeParse(req.query);
    if (!queryValidation.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: queryValidation.error.errors,
      });
    }

    const { sendTransferId, voucherNo, fiscalYear } = queryValidation.data;

    // Build the Prisma where condition
    let whereCondition: Prisma.SendTransferWhereUniqueInput;

    if (sendTransferId) {
      whereCondition = { id: sendTransferId };
    } else {
      // Use the composite unique constraint (fiscalYear + voucherNo)
      // Assuming your schema has @@unique([fiscalYear, voucherNo])
      whereCondition = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYear!,
          voucherNo: voucherNo!,
        },
      };
    }

    const sendTransfer = await prisma.sendTransfer.findUnique({
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
        receiver: {
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
        address: true,
      },
    });

    if (!sendTransfer) {
      return responseReturn(res, 404, {
        error: 'Send transfer not found',
        message: 'No send transfer matches the provided identifier',
      });
    }

    return responseReturn(res, 200, {
      sendTransfer,
      message: 'Send transfer retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get send transfer error:', error);
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error',
    });
  }
};

getSendTransfers = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryValidation = SendTransferQuerySchema.safeParse(req.query);
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
      sortOrder,
      fromDate,
      toDate,
    } = queryValidation.data;

    // -----------------------------------------------------------------
    // Build filter conditions
    // -----------------------------------------------------------------
    const whereConditions: Prisma.SendTransferWhereInput = {
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

    // Search conditions
    if (searchValue) {
      const searchConditions: Prisma.SendTransferWhereInput[] = [];

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
      searchConditions.push({ receiver: { name: textFilter } });

      // Assign OR only if we have any conditions
      if (searchConditions.length > 0) {
        whereConditions.OR = searchConditions;
      }
    }

    // -----------------------------------------------------------------
    // Execute queries in parallel
    // -----------------------------------------------------------------
    const [sendTransfers, totalCount] = await Promise.all([
      prisma.sendTransfer.findMany({
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
          receiver: {
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
      prisma.sendTransfer.count({ where: whereConditions }),
    ]);

    const totalPage = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      sendTransfers,
      pagination: {
        total: totalCount,
        totalPage,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPage,
        hasPrev: page > 1,
      },
      message: 'Send transfers retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get send transfers error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve send transfers',
    });
  }
};

deleteSendTransfer = async (req: Request, res: Response): Promise<void> => {
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
    return responseReturn(res, 400, { error: 'Invalid id', message: 'id must be a number' });
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
    // --- Fetch the existing send transfer ---
    const existing = await prisma.sendTransfer.findUnique({
      where: whereClause,
      // Select exactly the fields that were used in the old delete method
      select: {
        id: true,
        voucherNo: true,
        fiscalYear: true,
        createdAt: true,
        currencyId: true,
        ComSender_ID: true,
        HmulafromComSender: true,
        ComeReciever_ID: true,
        HmulafromComReciever: true,
        HmulatoComReciever: true,
        RecieverPerson: true,
        RecieverAddress: true,
        RecieverPhone: true,
        SenderPerson: true,
        SenderAddress: true,
        SenderPhone: true,
        AmountTransfer: true,
        HmulatoComSender: true,
        TotalTransferToReceiver: true,
        Notes: true,
        USER_ID: true,
        addressID: true,
        transferTypeId: true,
typeId:true,
        // Do NOT include new fields (Hmula_ID, typeId, type, currencyType) – they were not in old cancelled record
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Send transfer record not found',
      });
    }

    // --- Prepare data for cancelled record (camelCase as expected by CancelledSendTransfer) ---
    const cancelledData = {
      voucherNo: existing.voucherNo!,
      fiscalYear: existing.fiscalYear!,
      createdAt: existing.createdAt,
      currencyId: existing.currencyId,
      // Map snake_case to camelCase based on old working fields
      comSenderId: existing.ComSender_ID,
      hmulaFromComSender: existing.HmulafromComSender,
      comReceiverId: existing.ComeReciever_ID,
      hmulaFromComReceiver: existing.HmulafromComReciever,
      hmulaToComReceiver: existing.HmulatoComReciever,
      receiverPerson: existing.RecieverPerson,
      receiverAddress: existing.RecieverAddress,
      receiverPhone: existing.RecieverPhone,
      senderPerson: existing.SenderPerson,
      senderAddress: existing.SenderAddress,
      senderPhone: existing.SenderPhone,
      amountTransfer: existing.AmountTransfer,
      hmulaToComSender: existing.HmulatoComSender,
      totalTransferToReceiver: existing.TotalTransferToReceiver,
      notes: existing.Notes ?? '',
      userId: existing.USER_ID,
      addressId: existing.addressID,        // if this field exists in CancelledSendTransfer
      transferTypeId: existing.transferTypeId, // if this field exists
    };

    // --- Transaction: archive, delete movements, delete original ---
    const [cancelledRecord, deletedMovements, deletedTransfer] = await prisma.$transaction([
      prisma.cancelledSendTransfer.create({ data: cancelledData }),
      prisma.movement.deleteMany({
        where: {
          voucherNo: existing.voucherNo!,
          fiscalYear: existing.fiscalYear!,
          typeId:existing.typeId,
        },
      }),
      prisma.sendTransfer.delete({
        where: { id: existing.id },
      }),
    ]);

    return responseReturn(res, 200, {
      cancelledRecord,
      deletedMovements: deletedMovements.count,
      deletedTransfer,
      message: 'Send transfer cancelled successfully',
    });
  } catch (error: any) {
    console.error('Send transfer deletion error:', error);

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

getCancelledSendTransfers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryValidation = SendTransferQuerySchema.safeParse(req.query);
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
    } = queryValidation.data;

    const fromDateAdjusted = fromDate
      ? moment.utc(fromDate).utcOffset('+03:00').startOf('day').toDate()
      : null;
    const toDateAdjusted = toDate
      ? moment.utc(toDate).utcOffset('+03:00').endOf('day').toDate()
      : null;

    // Build base conditions
    const whereConditions: Prisma.CancelledSendTransferWhereInput = {
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

    // Add search condition if searchValue exists
    if (searchValue) {
      const searchNumber = Number(searchValue);
      const isNumber = !isNaN(searchNumber) && isFinite(searchNumber);

      const searchOR: Prisma.CancelledSendTransferWhereInput[] = [];

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

    // Execute queries in parallel
    const [cancelledSendTransfer, totalCount] = await Promise.all([
      prisma.cancelledSendTransfer.findMany({
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
              address: true,
            },
          },
          receiver: {
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
      prisma.cancelledSendTransfer.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(totalCount / parPage);

    return responseReturn(res, 200, {
      cancelledSendTransfer,
      pagination: {
        total: totalCount,
        totalPage: totalPages,
        currentPage: page,
        perPage: parPage,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: 'Cancelled send transfers retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get cancelled send transfers error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      });
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve cancelled records',
    });
  }
};

 deleteCancelledSendTransfer = async (
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
      // Use the composite unique key (generated by Prisma from @@unique([fiscalYear, voucherNo]))
      // Adjust the key name if your model uses a different name (e.g., "fiscalYear_voucherNo")
      whereClause = {
        fiscalYear_voucherNo: {
          fiscalYear: fiscalYearInt,
          voucherNo: voucherNoInt,
        },
      };
    }

    // --- Fetch the existing cancelled send transfer (optional, but useful for response) ---
    const existing = await prisma.cancelledSendTransfer.findUnique({
      where: whereClause,
      include: {
        currency: true,
        sender: true,
        receiver: true,
        address: true,
        admin: true,
      },
    });

    if (!existing) {
      return responseReturn(res, 404, {
        error: 'Not found',
        message: 'Cancelled send transfer record not found',
      });
    }

    // --- Delete the record ---
    // Use the primary key for deletion (safer)
    const deletedRecord = await prisma.cancelledSendTransfer.delete({
      where: { id: existing.id },
    });

    return responseReturn(res, 200, {
      deletedRecord,
      message: 'Cancelled send transfer deleted successfully',
    });
  } catch (error: any) {
    console.error('Cancelled send transfer deletion error:', error);

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
}

export default new SenTransferController()
