import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import {
  SupplierCreateSchema,
  SupplierIdSchema,
  SupplierUpdateSchema,
} from '../types/supplier.schema'
import { QuerySchema } from '../types/types.'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
// const prisma = new PrismaClient()

class SupplierController {
  createSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input using Supplier schema
      const validationResult = SupplierCreateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const { phone, ...supplierData } = validationResult.data

      // Check for existing phone (unique constraint)
      const existingSupplier = await prisma.supplier.findUnique({
        where: { phone },
      })

      if (existingSupplier) {
        return responseReturn(res, 409, {
          error: 'Phone number already registered',
          existingPhone: phone,
        })
      }

      // Create new supplier
      const newSupplier = await prisma.supplier.create({
        data: {
          phone,
          ...supplierData,
        },
      })

      return responseReturn(res, 201, {
        data: newSupplier,
        message: 'Supplier created successfully',
      })
    } catch (error: any) {
      console.error('Supplier creation error:', error)

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Duplicate entry',
              fields: error.meta?.target,
              message: 'Supplier already exists with these details',
            })
          // Add other Prisma error codes as needed
        }
      }

      // Handle generic errors
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  // supplier.controller.ts
  updateSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input
      const validationResult = SupplierUpdateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      // Get supplier ID from route params
      const supplierId = parseInt(req.params.id, 10)
      if (isNaN(supplierId)) {
        return responseReturn(res, 400, {
          error: 'Invalid supplier ID format',
        })
      }

      const { phone, ...updateData } = validationResult.data

      // Check if supplier exists
      const existingSupplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      })

      if (!existingSupplier) {
        return responseReturn(res, 404, {
          error: 'Supplier not found',
        })
      }

      // Check for phone number conflict (if phone is being updated)
      if (phone !== undefined) {
        const existingPhone = await prisma.supplier.findFirst({
          where: {
            phone,
            id: { not: supplierId }, // Exclude current supplier
          },
        })

        if (existingPhone) {
          return responseReturn(res, 409, {
            error: 'Phone number already registered',
            existingPhone: phone,
          })
        }
      }

      // Perform update
      const updatedSupplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          ...updateData,
          ...(phone && { phone }), // Only update phone if provided
        },
      })

      return responseReturn(res, 200, {
        data: updatedSupplier,
        message: 'Supplier updated successfully',
      })
    } catch (error: any) {
      console.error('Supplier update error:', error)

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            return responseReturn(res, 409, {
              error: 'Duplicate entry',
              fields: error.meta?.target,
              message: 'Supplier already exists with these details',
            })
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Not found',
              message: 'Supplier does not exist',
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

  // supplier.controller.ts
  getSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters using your existing schema
      const queryParams = QuerySchema.safeParse(req.query)
      if (!queryParams.success) {
        return responseReturn(res, 400, {
          error: 'Invalid query parameters',
          details: queryParams.error.errors,
        })
      }

      // Destructure with your schema's field names
      const { page, parPage: limit, searchValue: search } = queryParams.data

      // Build the Prisma query
      const where: Prisma.SupplierWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}

      // Get paginated results
      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          orderBy: { createdAt: 'desc' }, // Default sorting
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.supplier.count({ where }),
      ])

      // Calculate pagination metadata using your schema's field names
      const totalPages = Math.ceil(total / limit)
      const hasNext = page < totalPages
      const hasPrevious = page > 1

      return responseReturn(res, 200, {
        data: suppliers,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          parPage: limit,
          hasNext,
          hasPrevious,
        },
        message: 'Suppliers retrieved successfully',
      })
    } catch (error: any) {
      console.error('Get suppliers error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      })
    }
  }

  getSupplierById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate the route param
    const parsed = SupplierIdSchema.safeParse(req.params)
    if (!parsed.success) {
      return responseReturn(res, 400, {
        error: 'Validation error',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    const supplierId = parseInt(parsed.data.id, 10)

    // Query supplier from database
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!supplier) {
      return responseReturn(res, 404, {
        error: 'Supplier not found',
      })
    }

    return responseReturn(res, 200, {
      data: supplier,
      message: 'Supplier retrieved successfully',
    })
  } catch (error: any) {
    console.error('Get supplier by ID error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return responseReturn(res, 500, {
        error: 'Database error',
        message: error.message,
      })
    }

    return responseReturn(res, 500, {
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    })
  }
}

  deleteSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate supplier ID
      const supplierId = parseInt(req.params.id, 10)
      if (isNaN(supplierId)) {
        return responseReturn(res, 400, {
          error: 'Invalid supplier ID format',
        })
      }

      // Check if supplier exists
      const existingSupplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      })

      if (!existingSupplier) {
        return responseReturn(res, 404, {
          error: 'Supplier not found',
        })
      }

      // Attempt deletion
      const deletedSupplier = await prisma.supplier.delete({
        where: { id: supplierId },
      })

      return responseReturn(res, 200, {
        data: deletedSupplier,
        message: 'Supplier deleted successfully',
      })
    } catch (error: any) {
      console.error('Delete supplier error:', error)

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2025':
            return responseReturn(res, 404, {
              error: 'Not found',
              message: 'Supplier does not exist',
            })
          case 'P2003':
            return responseReturn(res, 409, {
              error: 'Conflict',
              message: 'Cannot delete supplier with existing products',
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

  
}

export default new SupplierController()
