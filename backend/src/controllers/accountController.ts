import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import {
  AccountCreateSchema,
  AccountUpdateSchema,
  QueryAccountSchema,
} from '../types/account.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'

// const prisma = new PrismaClient()

class AccountController {
  createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const validationResult = AccountCreateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const { accountId, phone, accountTypeId, ...accountData } =
        validationResult.data

      // Check for existing accountId
      const existingByAccountId = await prisma.accounts.findUnique({
        where: { accountId },
      })

      if (existingByAccountId) {
        return responseReturn(res, 409, {
          error: 'Account ID already exists',
          existingAccountId: accountId,
        })
      }

      // Check for existing phone
      const existingByPhone = await prisma.accounts.findUnique({
        where: { phone },
      })

      if (existingByPhone) {
        return responseReturn(res, 409, {
          error: 'Phone number already registered',
          existingPhone: phone,
        })
      }

      // Verify account type and range
      const accountType = await prisma.accountType.findUnique({
        where: { id: accountTypeId },
        // select: { start: true, end: true },
      })

      if (!accountType) {
        return responseReturn(res, 400, {
          error: 'Invalid account type',
          message: 'Specified account type does not exist',
        })
      }

      // if (accountId < accountType.start || accountId > accountType.end) {
      //   return responseReturn(res, 400, {
      //     error: 'Invalid account ID',
      //     message: `Account ID must be between ${accountType.start} and ${accountType.end}`,
      //     validRange: {
      //       start: accountType.start,
      //       end: accountType.end,
      //     },
      //   })
      // }

      // Create new account
      const newAccount = await prisma.accounts.create({
        data: {
          accountId,
          phone,
          accountTypeId,
          ...accountData,
        },
      })

      return responseReturn(res, 201, {
        account: newAccount,
        message: 'Account created successfully',
      })
    } catch (error: any) {
      console.error('Account creation error:', error)

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Duplicate entry',
              fields: error.meta?.target,
              message: 'Account already exists with these details',
            })
          case 'P2003':
            return responseReturn(res, 400, {
              error: 'Invalid reference',
              message: 'Account type does not exist',
            })
        }
      }

      // Handle other errors
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  updateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const validationResult = AccountUpdateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const { id } = req.params
      const { accountId, phone, ...updateData } = validationResult.data

      // Check if customer exists
      const existingAccount = await prisma.accounts.findUnique({
        where: { accountId: parseInt(id) },
      })

      if (!existingAccount) {
        return responseReturn(res, 404, {
          error: 'Account not found',
          invalidId: id,
        })
      }

      // Check for accountId conflict (if changing)
      // if (accountId && accountId !== existingAccount.accountId) {
      //   const accountIdConflict = await prisma.accounts.findUnique({
      //     where: { accountId },
      //   })

      //   if (accountIdConflict) {
      //     return responseReturn(res, 409, {
      //       error: 'Account ID already exists',
      //       conflictingAccountId: accountId,
      //     })
      //   }
      // }

      // Check for phone conflict (if changing)
      if (phone && phone !== existingAccount.phone) {
        const phoneConflict = await prisma.accounts.findUnique({
          where: { phone },
        })

        if (phoneConflict) {
          return responseReturn(res, 409, {
            error: 'Phone number already registered',
            conflictingPhone: phone,
          })
        }
      }

      // Perform the update
      const updatedAccount = await prisma.accounts.update({
        where: { accountId: parseInt(id) },
        data: {
          // ...(accountId && { accountId }), // Only update if provided
          ...(phone && { phone }), // Only update if provided
          ...updateData,
          updatedAt: new Date(),
        },
      })

      return responseReturn(res, 200, {
        account: updatedAccount,
        message: 'Account updated successfully',
      })
    } catch (error: any) {
      console.error('Account update error:', error)

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Account not found',
              message: 'The specified account does not exist',
            })
          case 'P2002':
            const conflictField = (error.meta?.target as string[])?.[0]
            return responseReturn(res, 409, {
              error: 'Conflict error',
              message: `Account with this ${conflictField} already exists`,
              field: conflictField,
            })
          case 'P2003':
            return responseReturn(res, 400, {
              error: 'Invalid reference',
              message: 'Account type does not exist',
            })
        }
      }

      // Handle other errors
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

 

  getAllAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = QueryAccountSchema.safeParse(req.query)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        })
      }

      const { page, parPage, searchValue, searchMode } = validationResult.data

      // Build search conditions
      const searchConditions: Prisma.AccountsWhereInput[] = []

      if (searchValue) {
        if (searchMode === 'autocomplete') {
          // Autocomplete mode: search only by customerName
          searchConditions.push({
            name: {
              contains: searchValue,
              mode: 'insensitive',
            },
          })
        } else {
          // Full search mode: search multiple fields
          searchConditions.push(
            { name: { contains: searchValue, mode: 'insensitive' } },
            { phone: { contains: searchValue } },
            { address: { contains: searchValue, mode: 'insensitive' } }
          )
        }
      }



      // Handle autocomplete requests
      if (searchMode === 'autocomplete') {
        const accounts = await prisma.accounts.findMany({
   
          where: {
            OR: searchConditions.length > 0 ? searchConditions : undefined,
            // accountTypeId: { gte: 100 },
          },
          select: {
            accountId: true,
            name: true,
            address: true,
            phone: true,
            // Add other fields you need for autocomplete
          },
          // take: 4, // Fixed limit for autocomplete
          orderBy: { name: 'asc' },
        })

        return responseReturn(res, 200, {
          accounts,
          message: 'Autocomplete results retrieved',
        })
      }

      // Handle full paginated requests
      const skip = (page - 1) * parPage

      const [accounts, total] = await Promise.all([
        prisma.accounts.findMany({
          where: {
            OR: searchConditions.length > 0 ? searchConditions : undefined,
          },
          include: {
            accountType: {
              select: { type: true },
            },
          },
          skip,
          take: parPage,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.accounts.count({
          where: {
            OR: searchConditions.length > 0 ? searchConditions : undefined,
          },
        }),
      ])

      const totalPage = Math.ceil(total / parPage)

      return responseReturn(res, 200, {
        accounts,
        pagination: {
          total,
          totalPage,
          currentPage: page,
          perPage: parPage,
          hasNext: page < totalPage,
          hasPrev: page > 1,
        },
        message: 'Accounts retrieved successfully',
      })
    } catch (error: any) {
      console.error('Get accounts error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return responseReturn(res, 500, {
          error: 'Database error',
          message: 'Failed to retrieve accounts',
        })
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }



  getAccountByAccountId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      // Validate accountId parameter
      const paramsSchema = z.object({
        accountId: z.coerce.number().int().positive(),
      })

      const validationResult = paramsSchema.safeParse(req.params)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Invalid account ID',
          details: validationResult.error.errors,
        })
      }

      const { accountId } = validationResult.data

      // Find customer by accountId
      const account = await prisma.accounts.findUnique({
        where: { accountId },
        include: {
          accountType: {
            select: { type: true},
          },
        },
      })

      if (!account) {
        return responseReturn(res, 404, {
          error: 'Account not found',
          message: `No Account found with account ID ${accountId}`,
        })
      }

      return responseReturn(res, 200, {
        account: account,
        message: 'Account retrieved successfully',
      })
    } catch (error: any) {
      console.error('Get account error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return responseReturn(res, 500, {
          error: 'Database error',
          message: 'Failed to retrieve account',
        })
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  getLastAccountId = async (req: Request, res: Response): Promise<void> => {
  try {
    // No validation needed for accountTypeID anymore
    
    // Find last accountId in the entire accounts table
    const lastAccount = await prisma.accounts.findFirst({
      orderBy: {
        accountId: 'desc', // Get highest accountId overall
      },
      select: {
        accountId: true, // Only return accountId
      },
    })

    let nextAccountId = lastAccount
      ? lastAccount.accountId + 1
      : 101 // Start from 1 if no accounts exist

    return responseReturn(res, 200, {
      data: {
        accountId: nextAccountId,
      },
      message: 'Last account ID retrieved successfully',
    })
  } catch (error: any) {
    console.error('Get last account error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: 'Failed to retrieve account',
      })
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    })
  }
}

  // getLastAccountId = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     // Validate accountTypeId query parameter
  //     const querySchema = z.object({
  //       accountTypeID: z.coerce.number().int().positive(),
  //     })

  //     const validationResult = querySchema.safeParse(req.query)
  //     if (!validationResult.success) {
  //       return responseReturn(res, 400, {
  //         error: 'Invalid account type ID',
  //         details: validationResult.error.errors,
  //       })
  //     }

  //     const { accountTypeID } = validationResult.data

  //     // Get account type to determine valid range
  //     const accountType = await prisma.accountType.findUnique({
  //       where: { id: accountTypeID },
  //     })

  //     if (!accountType) {
  //       return responseReturn(res, 404, {
  //         error: 'Account type not found',
  //         message: `Account type ${accountTypeID} does not exist`,
  //       })
  //     }

  //     // Find last accountId in the valid range
  //     const lastAccount = await prisma.accounts.findFirst({
  //       where: {
  //         accountTypeId: accountTypeID,
  //         // accountId: {
  //         //   gte: accountType.start, // Greater than or equal to start
  //         //   lte: accountType.end, // Less than or equal to end
  //         // },
  //       },
  //       orderBy: {
  //         accountId: 'desc', // Get highest accountId in range
  //       },
  //       select: {
  //         accountId: true, // Only return accountId
  //       },
  //     })

  //     let nextAccountId = lastAccount
  //       ? lastAccount.accountId + 1
  //       : accountType.start

  //     // Check if nextAccountId is within the valid range
  //     if (nextAccountId > accountType.end) {
  //       throw new Error('No available account numbers in range')
  //     }

  //     // if (!lastAccount) {

  //     //   return responseReturn(res, 404, {
  //     //     error: 'No accounts found in range',
  //     //     message: `No accounts found in range ${accountType.start}-${accountType.end} for type ${accountType.type}`,
  //     //   });
  //     // }

  //     return responseReturn(res, 200, {
  //       data: {
  //         accountId: nextAccountId,
  //         accountType: accountType.type,
  //         rangeStart: accountType.start,
  //         rangeEnd: accountType.end,
  //       },
  //       message: 'Last account in account type range retrieved successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Get last account error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: 'Failed to retrieve account',
  //       })
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }
}

export default new AccountController()
