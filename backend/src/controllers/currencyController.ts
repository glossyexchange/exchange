import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import {
  CurrencyCreateSchema,
  CurrencyDeleteSchema,
  CurrencyGetSchema,
  CurrencyUpdateSchema,
} from '../types/currency.schema'
import { QuerySchema } from '../types/types.'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
// const prisma = new PrismaClient()

class CurrencyController {
createCurrency = async (req: Request, res: Response): Promise<void> => {
  const validation = CurrencyCreateSchema.safeParse(req.body)
  if (!validation.success) {
    return responseReturn(res, 400, {
      error: 'Validation error',
      details: validation.error.flatten().fieldErrors,
    })
  }

  const { currencyId, currencySymbol, currency, CurrencyPrice , currencyAction} = validation.data

  try {
    const newCurrency = await prisma.currency.create({
      data: { 
        currencyId, 
        currencySymbol, 
        currency, 
        currencyPrice: CurrencyPrice ?? 0, 
        currencyAction,
      },
      select: { // ✅ Only return necessary fields
        id: true,
        currencyId: true,
        currencySymbol: true,
        currency: true,
        currencyPrice: true,
        currencyAction: true,
        createdAt: true,
      }
    })

    return responseReturn(res, 201, {
      data: newCurrency,
      message: 'Currency created successfully',
    })
  } catch (error) {
    console.error('Create currency error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const targetFields = (error.meta?.target as string[]) || []
        const conflictField = targetFields[0]?.replace('Currency_', '') // Clean field name

        const fieldMessages: Record<string, string> = {
          currencyId: 'Currency ID already exists',
          currencySymbol: 'Currency symbol already exists',
          currency: 'Currency name already exists',
        }

        const message = fieldMessages[conflictField] || 'Duplicate entry found'

        return responseReturn(res, 409, {
          error: message,
          field: conflictField,
          value: req.body[conflictField]
        })
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

updateCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Update request body:', req.body);
    
    const { id } = req.params
    const validation = CurrencyUpdateSchema.safeParse(req.body)

    if (!validation.success) {
      console.log('Validation errors:', validation.error.flatten().fieldErrors);
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors,
      })
    }

    const { 
      currencyId: newCurrencyId, 
      currency: newCurrency, 
      currencySymbol: newCurrencySymbol,
      CurrencyPrice: newcurrencyPrice,
      currencyAction: newCurrencyAction 
    } = validation.data

    console.log('Validated data:', validation.data);

    // 1. Find existing currency by primary key (id)
    const existingCurrency = await prisma.currency.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingCurrency) {
      return responseReturn(res, 404, { error: 'Currency not found' })
    }

    console.log('Existing currency:', existingCurrency);

    // 2. Check for conflicts (atomic update)
    const updatedCurrency = await prisma.currency.update({
      where: { id: existingCurrency.id },
      data: {
        currencyId: newCurrencyId ?? existingCurrency.currencyId,
        currency: newCurrency ?? existingCurrency.currency,
        currencySymbol: newCurrencySymbol ?? existingCurrency.currencySymbol,
        currencyPrice: newcurrencyPrice ?? existingCurrency.currencyPrice,
        currencyAction: newCurrencyAction ?? existingCurrency.currencyAction,
      },
      select: {
        id: true,
        currencyId: true,
        currencySymbol: true,
        currency: true,
        currencyPrice: true,
        currencyAction: true,
        createdAt: true,
      }
    })

    console.log('Updated currency:', updatedCurrency);

    return responseReturn(res, 200, {
      data: updatedCurrency,
      message: 'Currency updated successfully',
    })
  } catch (error) {
    console.error('Update error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);
      
      if (error.code === 'P2002') {
        const targetFields = (error.meta?.target as string[]) || []
        const conflictField = targetFields[0]?.replace('Currency_', '') // Clean field name

        const fieldMessages: Record<string, string> = {
          currencyId: 'Currency ID already exists',
          currencySymbol: 'Currency symbol already exists',
          currency: 'Currency name already exists',
        }

        const message = fieldMessages[conflictField] || 'Duplicate entry found'

        return responseReturn(res, 409, {
          error: message,
          field: conflictField,
        })
      }
      if (error.code === 'P2025') {
        return responseReturn(res, 404, { error: 'Currency not found' })
      }
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

  getAllCurrencies = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedQuery = QuerySchema.parse(req.query)
      const { page, parPage, searchValue } = validatedQuery

      const skip = (page - 1) * parPage
      const take = parPage

      const where: Prisma.CurrencyWhereInput = {}
      if (searchValue) {
        where.currency = {
          contains: searchValue,
          mode: 'insensitive',
        }
      }

      const [currencies, total] = await Promise.all([
        prisma.currency.findMany({
          skip,
          take,
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            currencyId: true,
            currencySymbol:true,
            currency: true,
            currencyPrice:true,
            currencyAction:true,
            createdAt: true,
          },
        }),
        prisma.currency.count({ where }),
      ])

      const formattedCurrencies = currencies.map((currency) => ({
        ...currency,
        _count: undefined,
      }))

      const totalPage = Math.ceil(total / parPage)

      return responseReturn(res, 200, {
        currencies: formattedCurrencies,
        pagination: {
          total,
          totalPage,
          currentPage: page,
          perPage: parPage,
          hasNext: page < totalPage,
          hasPrev: page > 1,
        },
        message: 'Currencies retrieved successfully',
      })
    } catch (error) {
      console.error('Get currencies error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  getCurrencyByCurrencyId = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate route parameter
      const validation = CurrencyGetSchema.safeParse(req.params);
      if (!validation.success) {
        return responseReturn(res, 400, {
          error: "Validation error",
          details: validation.error.flatten().fieldErrors
        });
      }
  
      const { currencyId } = validation.data;
  
      // Find currency by currencyId
      const currency = await prisma.currency.findUnique({
        where: { currencyId }
      });
  
      if (!currency) {
        return responseReturn(res, 404, {
          error: "Currency not found",
          message: `No currency found with ID ${currencyId}`
        });
      }
  
      return responseReturn(res, 200, {
        data: currency,
        message: "Currency retrieved successfully"
      });
  
    } catch (error) {
      console.error("Get currency error:", error);
  
      return responseReturn(res, 500, {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  deleteCurrency = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate route parameter
      const validation = CurrencyDeleteSchema.safeParse(req.params)
      if (!validation.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validation.error.flatten().fieldErrors,
        })
      }

      const { id } = validation.data

      // Delete the currency
      const deletedCurrency = await prisma.currency.delete({
        where: { id },
      })

      return responseReturn(res, 200, {
        data: deletedCurrency,
        message: 'Currency deleted successfully',
      })
    } catch (error) {
      console.error('Delete currency error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found error
        if (error.code === 'P2025') {
          return responseReturn(res, 404, {
            error: 'Currency not found',
            message: 'No currency found with the provided ID',
          })
        }
      }

      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export default new CurrencyController()
