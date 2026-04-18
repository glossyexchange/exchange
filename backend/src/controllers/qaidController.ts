import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import moment from 'moment'
import { QaidCreateSchema } from '../types/qaid.schema'
import {
  SendTransferQuerySchema,
  SendTransferSingleGetSchema,
  SendTransferUpdateSchema,
} from '../types/sendTransfer.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'


class QaidController {
  createQaid = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log(req.body);
      
      const importValidation = QaidCreateSchema.safeParse(req.body)
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
        ComeReciever_ID,
        AmountTransfer,
        Notes,
        USER_ID,
        typeId,
        type,

        ...rest
      } = importValidation.data

      // Validate AmountTransfer
      if (AmountTransfer <= 0) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          message: 'Transfer amount must be greater than 0',
        })
      }

      // Check foreign keys
      const [mainAccount, debtorAccount] = await Promise.all([
        prisma.accounts.findUnique({
          where: { accountId: ComSender_ID },
          select: { accountId: true },
        }),
        prisma.accounts.findUnique({
          where: { accountId: ComeReciever_ID },
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

      const newQaid = await prisma.qaid.create({
        data: {
          createdAt,
          currencyId,
          ComSender_ID,

          ComeReciever_ID,

          AmountTransfer,

          Notes,
          USER_ID,

          typeId,
          type,
        },
      })

      return responseReturn(res, 201, {
        qaid: newQaid,
        qaidVoucherNo: newQaid.voucherNo,

        message: 'Qaid created successfully',
      })
    } catch (error: any) {
      console.error('Qaid creation error:', error)

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
          }),
        )
      }
      if (ComeReciever_ID !== undefined) {
        checks.push(
          prisma.accounts.findUnique({
            where: { accountId: ComeReciever_ID },
            select: { accountId: true },
          }),
        )
      }
      if (Hmula_ID !== undefined) {
        checks.push(
          prisma.accounts.findUnique({
            where: { accountId: Hmula_ID },
            select: { accountId: true },
          }),
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
      if (HmulafromComSender !== undefined)
        updatePayload.HmulafromComSender = HmulafromComSender
      if (ComeReciever_ID !== undefined)
        updatePayload.ComeReciever_ID = ComeReciever_ID
      if (HmulafromComReciever !== undefined)
        updatePayload.HmulafromComReciever = HmulafromComReciever
      if (HmulatoComReciever !== undefined)
        updatePayload.HmulatoComReciever = HmulatoComReciever
      if (RecieverPerson !== undefined)
        updatePayload.RecieverPerson = RecieverPerson
      if (RecieverAddress !== undefined)
        updatePayload.RecieverAddress = RecieverAddress
      if (RecieverPhone !== undefined)
        updatePayload.RecieverPhone = RecieverPhone
      if (SenderPerson !== undefined) updatePayload.SenderPerson = SenderPerson
      if (SenderAddress !== undefined)
        updatePayload.SenderAddress = SenderAddress
      if (SenderPhone !== undefined) updatePayload.SenderPhone = SenderPhone
      if (AmountTransfer !== undefined)
        updatePayload.AmountTransfer = AmountTransfer
      if (HmulatoComSender !== undefined)
        updatePayload.HmulatoComSender = HmulatoComSender
      if (TotalTransferToReceiver !== undefined)
        updatePayload.TotalTransferToReceiver = TotalTransferToReceiver
      if (Notes !== undefined) updatePayload.Notes = Notes
      if (USER_ID !== undefined) updatePayload.USER_ID = USER_ID
      if (transferTypeId !== undefined)
        updatePayload.transferTypeId = transferTypeId
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
      const finalAmountTransferNum = toNumber(
        AmountTransfer ?? existing.AmountTransfer,
      )
      const finalHmulatoComSenderNum = toNumber(
        HmulatoComSender ?? existing.HmulatoComSender,
      )
      const finalHmulafromComSenderNum = toNumber(
        HmulafromComSender ?? existing.HmulafromComSender,
      )
      const finalHmulatoComReceiverNum = toNumber(
        HmulatoComReciever ?? existing.HmulatoComReciever,
      )
      const finalHmulafromComReceiverNum = toNumber(
        HmulafromComReciever ?? existing.HmulafromComReciever,
      )
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
          note: string,
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
          finalNotes,
        )

        // Commission to sender
        if (finalHmulatoComSenderNum > 0) {
          await createMovement(
            'عمولە بۆ نێردەر/عمولة الحوالة (للمرسل)',
            finalHmula,
            finalComSender,
            finalHmulatoComSenderNum,
            'عمولە بۆ نێردەر',
          )
        }

        // Commission from sender
        if (finalHmulafromComSenderNum > 0) {
          await createMovement(
            'عمولە لەسەر نێردەر/ من المرسل',
            finalComSender,
            finalHmula,
            finalHmulafromComSenderNum,
            'عمولە لەسەر نێردەر',
          )
        }

        // Commission to receiver
        if (finalHmulatoComReceiverNum > 0) {
          await createMovement(
            'عمولە بۆ وەرگر',
            finalHmula,
            finalComeReceiver,
            finalHmulatoComReceiverNum,
            'عمولە بۆ وەرگر',
          )
        }

        // Commission from receiver
        if (finalHmulafromComReceiverNum > 0) {
          await createMovement(
            'عمولە لەسەر وەرگر/ من المستلم',
            finalComeReceiver,
            finalHmula,
            finalHmulafromComReceiverNum,
            'عمولە لەسەر وەرگر/ من المستلم',
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
              message:
                'A unique constraint would be violated. Please check your data.',
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

 

  getSendTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryValidation = SendTransferSingleGetSchema.safeParse(req.query)
      if (!queryValidation.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: queryValidation.error.errors,
        })
      }

      const { sendTransferId, voucherNo, fiscalYear } = queryValidation.data

      // Build the Prisma where condition
      let whereCondition: Prisma.SendTransferWhereUniqueInput

      if (sendTransferId) {
        whereCondition = { id: sendTransferId }
      } else {
        // Use the composite unique constraint (fiscalYear + voucherNo)
        // Assuming your schema has @@unique([fiscalYear, voucherNo])
        whereCondition = {
          fiscalYear_voucherNo: {
            fiscalYear: fiscalYear!,
            voucherNo: voucherNo!,
          },
        }
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
      })

      if (!sendTransfer) {
        return responseReturn(res, 404, {
          error: 'Send transfer not found',
          message: 'No send transfer matches the provided identifier',
        })
      }

      return responseReturn(res, 200, {
        sendTransfer,
        message: 'Send transfer retrieved successfully',
      })
    } catch (error: any) {
      console.error('Get send transfer error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      })
    }
  }

  getSendTransfers = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryValidation = SendTransferQuerySchema.safeParse(req.query)
      if (!queryValidation.success) {
        console.error(
          'Query validation failed:',
          queryValidation.error.format(),
        )
        return responseReturn(res, 400, {
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        })
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
      } = queryValidation.data

      // -----------------------------------------------------------------
      // Build filter conditions
      // -----------------------------------------------------------------
      const whereConditions: Prisma.SendTransferWhereInput = {
        ...(currencyId && { currencyId }),
      }

      // Date filtering
      if (fromDate || toDate) {
        whereConditions.createdAt = {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        }
      } else {
        const currentYear = new Date().getFullYear()
        const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)
        whereConditions.createdAt = {
          gte: startOfYear,
          lte: endOfYear,
        }
      }

      // Search conditions
      if (searchValue) {
        const searchConditions: Prisma.SendTransferWhereInput[] = []

        // Numeric search (voucherNo)
        const numericSearch = !isNaN(Number(searchValue))
          ? Number(searchValue)
          : null
        if (numericSearch !== null) {
          searchConditions.push({ voucherNo: numericSearch })
        }

        // Text searches with case‑insensitive mode
        const textFilter = {
          contains: searchValue,
          mode: Prisma.QueryMode.insensitive,
        }

        searchConditions.push({ RecieverPerson: textFilter })
        searchConditions.push({ SenderPerson: textFilter })
        searchConditions.push({ sender: { name: textFilter } })
        searchConditions.push({ receiver: { name: textFilter } })

        // Assign OR only if we have any conditions
        if (searchConditions.length > 0) {
          whereConditions.OR = searchConditions
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
      ])

      const totalPage = Math.ceil(totalCount / parPage)

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
      })
    } catch (error: any) {
      console.error('Get send transfers error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return responseReturn(res, 500, {
          error: 'Database error',
          message: error.message,
        })
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Failed to retrieve send transfers',
      })
    }
  }

  deleteSendTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, voucherNo, fiscalYear } = req.query

      // --- Validate identifier ---
      const hasId = id !== undefined && id !== ''
      const hasVoucher = voucherNo !== undefined && voucherNo !== ''
      const hasFiscal = fiscalYear !== undefined && fiscalYear !== ''

      const useId = hasId && !hasVoucher && !hasFiscal
      const useVoucherFiscal = !hasId && hasVoucher && hasFiscal

      if (!useId && !useVoucherFiscal) {
        return responseReturn(res, 400, {
          error: 'Invalid identifier',
          message:
            'Provide either "id" alone, or both "voucherNo" and "fiscalYear".',
        })
      }

      // --- Parse numbers ---
      let whereClause: any
      if (useId) {
        const idInt = parseInt(id as string, 10)
        if (isNaN(idInt)) {
          return responseReturn(res, 400, {
            error: 'Invalid id',
            message: 'id must be a number',
          })
        }
        whereClause = { id: idInt }
      } else {
        const voucherNoInt = parseInt(voucherNo as string, 10)
        const fiscalYearInt = parseInt(fiscalYear as string, 10)
        if (isNaN(voucherNoInt) || isNaN(fiscalYearInt)) {
          return responseReturn(res, 400, {
            error: 'Invalid parameters',
            message: 'voucherNo and fiscalYear must be numbers',
          })
        }
        // Use the composite unique key (generated by Prisma from @@unique([fiscalYear, voucherNo]))
        whereClause = {
          fiscalYear_voucherNo: {
            fiscalYear: fiscalYearInt,
            voucherNo: voucherNoInt,
          },
        }
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
          typeId: true,
          // Do NOT include new fields (Hmula_ID, typeId, type, currencyType) – they were not in old cancelled record
        },
      })

      if (!existing) {
        return responseReturn(res, 404, {
          error: 'Not found',
          message: 'Send transfer record not found',
        })
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
        addressId: existing.addressID, // if this field exists in CancelledSendTransfer
        transferTypeId: existing.transferTypeId, // if this field exists
      }

      // --- Transaction: archive, delete movements, delete original ---
      const [cancelledRecord, deletedMovements, deletedTransfer] =
        await prisma.$transaction([
          prisma.cancelledSendTransfer.create({ data: cancelledData }),
          prisma.movement.deleteMany({
            where: {
              voucherNo: existing.voucherNo!,
              fiscalYear: existing.fiscalYear!,
              typeId: existing.typeId,
            },
          }),
          prisma.sendTransfer.delete({
            where: { id: existing.id },
          }),
        ])

      return responseReturn(res, 200, {
        cancelledRecord,
        deletedMovements: deletedMovements.count,
        deletedTransfer,
        message: 'Send transfer cancelled successfully',
      })
    } catch (error: any) {
      console.error('Send transfer deletion error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Not found',
              message: 'Record does not exist',
            })
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Duplicate',
              message: 'Cancelled record already exists for this voucher',
            })
          case 'P2003':
            return responseReturn(res, 409, {
              error: 'Conflict',
              message: 'Cannot delete due to existing dependencies',
            })
        }
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  getCancelledSendTransfers = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const queryValidation = SendTransferQuerySchema.safeParse(req.query)
      if (!queryValidation.success) {
        console.error(
          'Query validation failed:',
          queryValidation.error.format(),
        )
        return responseReturn(res, 400, {
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        })
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
      } = queryValidation.data

      const fromDateAdjusted = fromDate
        ? moment.utc(fromDate).utcOffset('+03:00').startOf('day').toDate()
        : null
      const toDateAdjusted = toDate
        ? moment.utc(toDate).utcOffset('+03:00').endOf('day').toDate()
        : null

      // Build base conditions
      const whereConditions: Prisma.CancelledSendTransferWhereInput = {
        ...(currencyId && { currencyId }),
      }

      // Date filtering logic:
      // - If fromDate/toDate are provided, use them exactly.
      // - Otherwise, if there is NO searchValue, default to current year.
      // - If there IS a searchValue, do NOT apply any default date filter (search across all years).
      if (fromDateAdjusted || toDateAdjusted) {
        whereConditions.createdAt = {
          ...(fromDateAdjusted && { gte: fromDateAdjusted }),
          ...(toDateAdjusted && { lte: toDateAdjusted }),
        }
      } else if (!searchValue) {
        // No explicit dates and no search → default to current year
        const currentYear = new Date().getFullYear()
        const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)
        whereConditions.createdAt = {
          gte: startOfYear,
          lte: endOfYear,
        }
      }
      // If searchValue exists and no explicit dates, we leave createdAt undefined → search all years

      // Add search condition if searchValue exists
      if (searchValue) {
        const searchNumber = Number(searchValue)
        const isNumber = !isNaN(searchNumber) && isFinite(searchNumber)

        const searchOR: Prisma.CancelledSendTransferWhereInput[] = []

        if (isNumber) {
          searchOR.push({ voucherNo: searchNumber })
        }

        searchOR.push({
          receiverPerson: {
            contains: searchValue,
            mode: Prisma.QueryMode.insensitive,
          },
        })
        // Optionally also search senderPerson
        // searchOR.push({
        //   senderPerson: {
        //     contains: searchValue,
        //     mode: Prisma.QueryMode.insensitive,
        //   },
        // });

        whereConditions.OR = searchOR
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
      ])

      const totalPages = Math.ceil(totalCount / parPage)

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
      })
    } catch (error: any) {
      console.error('Get cancelled send transfers error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return responseReturn(res, 500, {
          error: 'Database error',
          message: error.message,
        })
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Failed to retrieve cancelled records',
      })
    }
  }

  deleteCancelledSendTransfer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id, voucherNo, fiscalYear } = req.query

      // --- Validate identifier ---
      const hasId = id !== undefined && id !== ''
      const hasVoucher = voucherNo !== undefined && voucherNo !== ''
      const hasFiscal = fiscalYear !== undefined && fiscalYear !== ''

      const useId = hasId && !hasVoucher && !hasFiscal
      const useVoucherFiscal = !hasId && hasVoucher && hasFiscal

      if (!useId && !useVoucherFiscal) {
        return responseReturn(res, 400, {
          error: 'Invalid identifier',
          message:
            'Provide either "id" alone, or both "voucherNo" and "fiscalYear".',
        })
      }

      // --- Parse numbers and build the correct unique where clause ---
      let whereClause: any
      if (useId) {
        const idInt = parseInt(id as string, 10)
        if (isNaN(idInt)) {
          return responseReturn(res, 400, {
            error: 'Invalid id',
            message: 'id must be a number',
          })
        }
        whereClause = { id: idInt }
      } else {
        const voucherNoInt = parseInt(voucherNo as string, 10)
        const fiscalYearInt = parseInt(fiscalYear as string, 10)
        if (isNaN(voucherNoInt) || isNaN(fiscalYearInt)) {
          return responseReturn(res, 400, {
            error: 'Invalid parameters',
            message: 'voucherNo and fiscalYear must be numbers',
          })
        }
        // Use the composite unique key (generated by Prisma from @@unique([fiscalYear, voucherNo]))
        // Adjust the key name if your model uses a different name (e.g., "fiscalYear_voucherNo")
        whereClause = {
          fiscalYear_voucherNo: {
            fiscalYear: fiscalYearInt,
            voucherNo: voucherNoInt,
          },
        }
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
      })

      if (!existing) {
        return responseReturn(res, 404, {
          error: 'Not found',
          message: 'Cancelled send transfer record not found',
        })
      }

      // --- Delete the record ---
      // Use the primary key for deletion (safer)
      const deletedRecord = await prisma.cancelledSendTransfer.delete({
        where: { id: existing.id },
      })

      return responseReturn(res, 200, {
        deletedRecord,
        message: 'Cancelled send transfer deleted successfully',
      })
    } catch (error: any) {
      console.error('Cancelled send transfer deletion error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Not found',
              message: 'Record does not exist',
            })
          case 'P2003':
            return responseReturn(res, 409, {
              error: 'Conflict',
              message: 'Cannot delete due to existing dependencies',
            })
        }
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }
}

export default new QaidController()
