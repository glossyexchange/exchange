import { Request, Response } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'
import { responseReturn } from '../utils/response'
import path from 'path'
import * as fs from 'fs-extra'
import { QuerySchema } from '../types/types.'
import {
  CategoryCreateSchema,
  CategoryIdSchema,
  CategoryUpdateSchema,
} from '../types/category.schema'
import prisma from '../utils/prisma'
// const prisma = new PrismaClient()

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

class CustomerController {
  // add_category = async (req: Request, res: Response): Promise<void> => {
  //   let tempFilePath: string | null = null

  //   try {
  //     // Validate request body
  //     const validationResult = CategoryCreateSchema.safeParse(req.body)
  //     if (!validationResult.success) {
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         details: validationResult.error.errors,
  //       })
  //     }

  //     // Check for existing category name
  //     const existingCategory = await prisma.category.findUnique({
  //       where: { Name: validationResult.data.Name },
  //     })

  //     if (existingCategory) {
  //       return responseReturn(res, 409, {
  //         error: 'Category name already exists',
  //         existingName: validationResult.data.Name,
  //       })
  //     }

  //     // Validate file upload
  //     if (!req.file) {
  //       return responseReturn(res, 400, {
  //         error: 'Image file is required',
  //       })
  //     }

  //     tempFilePath = req.file.path
  //     const fileExt = path.extname(req.file.originalname)

  //     // Create category first to get ID
  //     const category = await prisma.category.create({
  //       data: {
  //         ...validationResult.data,
  //         image: 'temporary-path', // Will be updated
  //       },
  //     })

  //     // Prepare final paths
  //     const finalFilename = `${category.id}${fileExt}`
  //     const finalDir = path.join(process.cwd(), 'uploads', 'categories')
  //     const finalPath = path.join(finalDir, finalFilename)

  //     // Ensure directory exists
  //     await fs.ensureDir(finalDir)

  //     // Move file from temp to final location
  //     await fs.move(tempFilePath, finalPath, { overwrite: true })

  //     console.log(finalDir, finalPath)

  //     // Update category with final image path
  //     const updatedCategory = await prisma.category.update({
  //       where: { id: category.id },
  //       data: {
  //         image: `/uploads/categories/${finalFilename}`, // No slash at start
  //       },
  //     })

  //     return responseReturn(res, 201, {
  //       data: {
  //         ...updatedCategory,
  //         image: `${updatedCategory.image}`,
  //       },
  //       message: 'Category created successfully',
  //     })
  //   } catch (error: any) {
  //     // Cleanup temp file if exists
  //     if (tempFilePath) {
  //       await fs.remove(tempFilePath).catch(console.error)
  //     }

  //     // Handle Prisma errors
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       switch (error.code) {
  //         case 'P2002':
  //           return responseReturn(res, 409, {
  //             error: 'Duplicate entry',
  //             fields: error.meta?.target,
  //             message: 'Category already exists with these details',
  //           })
  //         case 'P2003':
  //           return responseReturn(res, 400, {
  //             error: 'Invalid reference',
  //             message: 'Foreign key constraint failed',
  //           })
  //       }
  //     }

  //     // Handle file system errors
  //     if (error.code === 'ENOENT') {
  //       return responseReturn(res, 500, {
  //         error: 'File system error',
  //         message: 'Failed to process file upload',
  //       })
  //     }

  //     // Generic error handler
  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }

  // updateCategory = async (req: Request, res: Response): Promise<void> => {
  //   let tempFilePath: string | null = null
  //   let oldImagePath: string | null = null
  //   let newImagePath: string | null = null

  //   try {
  //     // Validate input
  //     const validationResult = CategoryUpdateSchema.safeParse(req.body)
  //     if (!validationResult.success) {
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         details: validationResult.error.errors,
  //       })
  //     }

  //     const categoryId = parseInt(req.params.id, 10)
  //     if (isNaN(categoryId)) {
  //       return responseReturn(res, 400, { error: 'Invalid category ID format' })
  //     }

  //     // Get existing category
  //     const existingCategory = await prisma.category.findUnique({
  //       where: { id: categoryId },
  //     })

  //     if (!existingCategory) {
  //       return responseReturn(res, 404, { error: 'Category not found' })
  //     }

  //     // Handle image update
  //     if (req.file) {
  //       tempFilePath = req.file.path
  //       const fileExt = path.extname(req.file.originalname)
  //       newImagePath = `/uploads/categories/${categoryId}${fileExt}`
  //       const finalPath = path.join(process.cwd(), newImagePath)
  //       oldImagePath = path.join(process.cwd(), existingCategory.image)

  //       // 1. Move new image to final location
  //       await fs.move(tempFilePath, finalPath, { overwrite: true })

  //       // 2. Update database
  //       const updatedCategory = await prisma.category.update({
  //         where: { id: categoryId },
  //         data: {
  //           Name: validationResult.data.Name,
  //           slug: validationResult.data.slug,
  //           status: validationResult.data.status,
  //           image: req.file ? newImagePath : existingCategory.image,
  //         },
  //       })

  //       // 3. Delete old image after successful update
  //       if (oldImagePath !== finalPath) {
  //         // Ensure we're not deleting the new image
  //         await fs.remove(oldImagePath).catch(console.error)
  //       }

  //       return responseReturn(res, 200, {
  //         data: {
  //           ...updatedCategory,
  //           image: `${process.env.BASE_URL}${newImagePath}`,
  //         },
  //         message: 'Category updated successfully',
  //       })
  //     }

  //     // Update without image change
  //     const updatedCategory = await prisma.category.update({
  //       where: { id: categoryId },
  //       data: validationResult.data,
  //     })

  //     return responseReturn(res, 200, {
  //       data: updatedCategory,
  //       message: 'Category updated successfully',
  //     })
  //   } catch (error: any) {
  //     // Cleanup new image if update failed
  //     if (newImagePath) {
  //       await fs.remove(path.join(process.cwd(), newImagePath)).catch(() => {})
  //     }

  //     console.error('Category update error:', error)

  //     // Handle name conflicts
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       if (error.code === 'P2002') {
  //         return responseReturn(res, 409, {
  //           error: 'Duplicate entry',
  //           fields: error.meta?.target,
  //         })
  //       }
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Update failed',
  //     })
  //   } finally {
  //     // Cleanup temporary upload file
  //     if (tempFilePath) {
  //       await fs.remove(tempFilePath).catch(() => {})
  //     }
  //   }
  // }

  // updateCategoryStatus = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const categoryId = parseInt(req.params.id, 10)
  //     const { status } = req.body

  //     const updatedCategory = await prisma.category.update({
  //       where: { id: categoryId },
  //       data: { status },
  //     })

  //     return responseReturn(res, 200, {
  //       data: updatedCategory,
  //       message: 'Status updated successfully',
  //     })
  //   } catch (error) {
  //     console.error('Status update error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: error.message,
  //       })
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error instanceof Error ? error.message : 'Unknown error',
  //     })
  //   }
  // }

  // getCategories = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     // Validate query parameters
  //     const queryParams = QuerySchema.safeParse(req.query)
  //     if (!queryParams.success) {
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         details: queryParams.error.errors,
  //       })
  //     }

  //     const { page, parPage: limit, searchValue: search } = queryParams.data

  //     // Build Prisma query
  //     const where: Prisma.CategoryWhereInput = {
  //       OR: search
  //         ? [
  //             { Name: { contains: search, mode: 'insensitive' } },
  //             { slug: { contains: search, mode: 'insensitive' } },
  //             { status: { contains: search, mode: 'insensitive' } },
  //           ]
  //         : undefined,
  //     }

  //     // Get paginated results
  //     const [categories, total] = await Promise.all([
  //       prisma.category.findMany({
  //         where,
  //         orderBy: { createdAt: 'desc' },
  //         skip: (page - 1) * limit,
  //         take: limit,
  //         select: {
  //           id: true,
  //           Name: true,
  //           image: true,
  //           slug: true,
  //           status: true,
  //           createdAt: true,
  //           updatedAt: true,
  //         },
  //       }),
  //       prisma.category.count({ where }),
  //     ])

  //     // Format image URLs
  //     const formattedCategories = categories.map((category) => ({
  //       ...category,
  //       image: `${process.env.BASE_URL}${category.image}`,
  //     }))

  //     // Calculate pagination metadata
  //     const totalPages = Math.ceil(total / limit)
  //     const hasNext = page < totalPages
  //     const hasPrevious = page > 1

  //     return responseReturn(res, 200, {
  //       data: formattedCategories,
  //       pagination: {
  //         total,
  //         totalPages,
  //         currentPage: page,
  //         parPage: limit,
  //         hasNext,
  //         hasPrevious,
  //       },
  //       message: 'Categories retrieved successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Get categories error:', error)

  //     // Handle Prisma errors
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: 'Failed to fetch categories',
  //       })
  //     }

  //     // Handle other errors
  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }

  // getCategoryById = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     // Validate the ID parameter
  //     const parsed = CategoryIdSchema.safeParse(req.params)
  //     if (!parsed.success) {
  //       return responseReturn(res, 400, {
  //         error: 'Validation error',
  //         details: parsed.error.errors,
  //       })
  //     }

  //     const categoryId = parseInt(parsed.data.id, 10)

  //     // Fetch category by ID
  //     const category = await prisma.category.findUnique({
  //       where: { id: categoryId },
  //       select: {
  //         id: true,
  //         Name: true,
  //         image: true,
  //         slug: true,
  //         status: true,
  //         createdAt: true,
  //         updatedAt: true,
  //       },
  //     })

  //     if (!category) {
  //       return responseReturn(res, 404, {
  //         error: 'Category not found',
  //       })
  //     }

  //     // Format image URL if needed
  //     const formattedCategory = {
  //       ...category,
  //       image: `${process.env.BASE_URL}${category.image}`,
  //     }

  //     return responseReturn(res, 200, {
  //       data: formattedCategory,
  //       message: 'Category retrieved successfully',
  //     })
  //   } catch (error: any) {
  //     console.error('Get category by ID error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: 'Failed to fetch category',
  //       })
  //     }

  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Unknown error occurred',
  //     })
  //   }
  // }

  // deleteCategory = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const categoryId = parseInt(req.params.id, 10)
  //     if (isNaN(categoryId)) {
  //       return responseReturn(res, 400, { error: 'Invalid category ID format' })
  //     }

  //     let imagePathToDelete: string | null = null

  //     // Use transaction for atomic operations
  //     await prisma.$transaction(async (tx) => {
  //       // 1. Verify category existence
  //       const existingCategory = await tx.category.findUnique({
  //         where: { id: categoryId },
  //       })

  //       if (!existingCategory) {
  //         throw new Error('CATEGORY_NOT_FOUND')
  //       }

  //       // 2. Check for dependencies
  //       const [hasSubCategories] = await Promise.all([
  //         tx.subCategory.findFirst({
  //           where: { categoryId },
  //           select: { id: true },
  //         }),
  //         // tx.product.findFirst({
  //         //   where: { categoryId },
  //         //   select: { id: true },
  //         // }),
  //       ])

  //       if (hasSubCategories) {
  //         throw new Error('CATEGORY_HAS_DEPENDENCIES')
  //       }

  //       // 3. Delete category record
  //       await tx.category.delete({ where: { id: categoryId } })

  //       // Store image path for cleanup
  //       imagePathToDelete = existingCategory.image
  //     })

  //     // 4. Cleanup image after successful deletion
  //     if (imagePathToDelete) {
  //       const fullImagePath = path.join(process.cwd(), imagePathToDelete)
  //       await fs.remove(fullImagePath).catch((error) => {
  //         console.error('Image cleanup failed:', error)
  //       })
  //     }

  //     return responseReturn(res, 200, {
  //       message: 'Category deleted successfully',
  //     })
  //   } catch (error) {
  //     console.error('Delete category error:', error)

  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: error.message,
  //       })
  //     }

  //     // 2. Handle known error messages with type guard
  //     if (isErrorWithMessage(error)) {
  //       switch (error.message) {
  //         case 'CATEGORY_NOT_FOUND':
  //           return responseReturn(res, 404, { error: 'Category not found' })
  //         case 'CATEGORY_HAS_DEPENDENCIES':
  //           return responseReturn(res, 400, {
  //             error:
  //               'Cannot delete category with existing subcategories or products',
  //           })
  //       }
  //     }
  //     // Handle Prisma errors
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         message: error.message,
  //       })
  //     }

  //     // General error handling
  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message:
  //         error instanceof Error ? error.message : 'Unknown error occurred',
  //     })
  //   }
  // }
}

export default new CustomerController()
