import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import {
  AccountTypeCreateSchema,
  AccountTypeUpdateSchema,
} from '../types/account.schema'
import { QuerySchema } from '../types/types.'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
// const prisma = new PrismaClient()

class AccountTypeController {
createAccountType = async (req: Request, res: Response): Promise<void> => {
  try {

    
    // Validate request body
    const validationResult = AccountTypeCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const { type } = validationResult.data;

    // Check for existing account type
    const existingType = await prisma.accountType.findUnique({
      where: { type },
      select: { id: true },
    });

    if (existingType) {
      return responseReturn(res, 409, {
        error: 'Account type already exists',
        conflictField: 'type',
        existingValue: type,
      });
    }

    // Create new account type
    const newAccountType = await prisma.accountType.create({
      data: { type },
    });

    return responseReturn(res, 201, {
      accountType: newAccountType,
      message: 'Account type created successfully',
    });
  } catch (error) {
    console.error('Account type creation error:', error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          // Extract conflicting field from error metadata
          const conflictField = (error.meta?.target as string[])?.[0] || 'unknown';
          return responseReturn(res, 409, {
            error: 'Database conflict',
            message: `Unique constraint violation on ${conflictField}`,
            target: error.meta?.target,
          });
        case 'P2003':
          return responseReturn(res, 400, {
            error: 'Reference error',
            message: 'Foreign key constraint failed',
            field: error.meta?.field_name,
          });
      }
    }

    // Handle Zod errors (should be caught earlier, but included for completeness)
    if (error instanceof z.ZodError) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: error.flatten().fieldErrors,
      });
    }

    // Generic error handler
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: errorMessage,
    });
  }
};

  updateAccountType = async (req: Request, res: Response): Promise<void> => {
    try {
      
       const { id } = req.params

if (!id || isNaN(parseInt(id))) {
      return responseReturn(res, 400, {
        error: 'Invalid ID',
        details: 'ID must be a number',
      });
    }
      // Validate request body
      const validationResult = AccountTypeUpdateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        })
      }

      const { type} = validationResult.data

      // Check existing account type
      const existing = await prisma.accountType.findUnique({
        where: { id: parseInt(id) },
        select: { type: true},
      })

      if (!existing) {
        return responseReturn(res, 404, {
          error: 'Account type not found',
          accountTypeId: id,
        })
      }

     

      // // Validate start/end against existing values
      // const proposedStart = start ?? existing.start
      // const proposedEnd = end ?? existing.end

      // if (proposedStart >= proposedEnd) {
      //   return responseReturn(res, 400, {
      //     error: 'Invalid range',
      //     message: 'End must be greater than start',
      //     proposedStart,
      //     proposedEnd,
      //   })
      // }

      // Prepare update data
      const updateData: Record<string, any> = {}
      if (type && type !== existing.type) updateData.type = type
      // if (start && start !== existing.start) updateData.start = start
      // if (end && end !== existing.end) updateData.end = end

      // Check for actual changes
      if (Object.keys(updateData).length === 0) {
        return responseReturn(res, 200, {
          message: 'No changes detected',
          data: { id },
        })
      }

      // Perform update
      const updated = await prisma.accountType.update({
        where: { id : parseInt(id)},
        data: updateData,
        // select: {
        //   id: true,
        //   type: true,
        //   start: true,
        //   end: true,
        //   createdAt: true,
        //   updatedAt: true
        // }
      })

      return responseReturn(res, 200, {
        accountType: updated,
        message: 'Account type updated successfully',
      })
    } catch (error) {
      console.error('Account type update error:', error)

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Not found',
              message: 'Account type does not exist',
            })
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Conflict',
              message: 'Unique constraint violation',
              target: error.meta?.target,
            })
        }
      }

      // Generic error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: errorMessage,
      })
    }
  }

  getAccountTypeById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate ID parameter
      const id = parseInt(req.params.id, 10)
      if (isNaN(id) || id <= 0) {
        return responseReturn(res, 400, {
          error: 'Invalid ID format',
          details: 'Must be a positive integer',
        })
      }

      // Fetch account type with related data
      const accountType = await prisma.accountType.findUnique({
        where: { id },
        select: {
          id: true,
          type: true,
          // start: true,
          // end: true,
          createdAt: true,
          _count: {
            select: { accounts: true },
          },
        },
      })

      if (!accountType) {
        return responseReturn(res, 404, {
          error: 'Account type not found',
          accountTypeId: id,
        })
      }
      // Format response data
      const responseData = {
        id: accountType.id,
        type: accountType.type,
        // start: accountType.start,
        // end: accountType.end,
        createdAt: accountType.createdAt,
        accountsCount: accountType._count.accounts, // Directly access the count
      }

      return responseReturn(res, 200, {
        accountType: responseData,
        message: 'Account type retrieved successfully',
      })
    } catch (error) {
      console.error('Get account type error:', error)

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return responseReturn(res, 500, {
          error: 'Database error',
          code: error.code,
          message: error.message,
        })
      }

      // Generic error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: errorMessage,
      })
    }
  }

  getAllAccountTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery = QuerySchema.parse(req.query)
      const { page, parPage, searchValue } = validatedQuery

      // Calculate pagination values
      const skip = (page - 1) * parPage
      const take = parPage

      // Build the filter
      const where: Prisma.AccountTypeWhereInput = {}
      if (searchValue) {
        where.type = {
          contains: searchValue,
          mode: 'insensitive',
        }
      }

      // Execute parallel queries
      const [accountTypes, totalCount] = await Promise.all([
        prisma.accountType.findMany({
          skip,
          take,
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            // start: true,
            // end: true,
            createdAt: true,
            _count: {
              select: { accounts: true },
            },
          },
        }),
        prisma.accountType.count({ where }),
      ])

      // Format the response data
      const formattedData = accountTypes.map((type) => ({
        ...type,
        accountsCount: type._count.accounts,
        _count: undefined,
      }))

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / parPage)

      return responseReturn(res, 200, {
        accountTypes: formattedData,
        pagination: {
          currentPage: page,
          itemsPerPage: parPage,
          totalItems: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        message: 'Account types retrieved successfully',
      })
    } catch (error) {
      console.error('Get all account types error:', error)

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: error.flatten().fieldErrors,
        })
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return responseReturn(res, 500, {
          error: 'Database error',
          code: error.code,
          message: error.message,
        })
      }

      // Generic error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: errorMessage,
      })
    }
  }

  deleteAccountType = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate ID parameter
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return responseReturn(res, 400, {
          error: 'Invalid account type ID',
          details: 'Must be a positive integer'
        });
      }
  
      // Check account type existence
      const accountType = await prisma.accountType.findUnique({
        where: { id },
        select: { id: true, type: true }
      });
  
      if (!accountType) {
        return responseReturn(res, 404, {
          error: 'Account type not found',
          accountTypeId: id
        });
      }
  
      // Check for associated accounts
      const accountsCount = await prisma.accounts.count({
        where: { accountTypeId: id }
      });
  
      if (accountsCount > 0) {
        return responseReturn(res, 409, {
          error: 'Cannot delete account type',
          message: 'Account type has associated accounts',
          accountsCount
        });
      }
  
      // Perform deletion
      const deletedAccountType = await prisma.accountType.delete({
        where: { id },
        select: {
          id: true,
          type: true,
          createdAt: true
        }
      });
  
      return responseReturn(res, 200, {
        message: 'Account type deleted successfully',
        accountType: deletedAccountType
      });
  
    } catch (error) {
      console.error('Delete account type error:', error);
  
      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Account type not found',
              message: 'The specified account type does not exist'
            });
          case 'P2003':
            return responseReturn(res, 409, {
              error: 'Dependency error',
              message: 'Cannot delete due to existing relationships',
              field: error.meta?.field_name
            });
        }
      }
  
      // Generic error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: errorMessage
      });
    }
  };
}
export default new AccountTypeController()
