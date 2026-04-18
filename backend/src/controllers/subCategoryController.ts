import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import {
  SubCategoryCreateSchema,
  SubCategoryIdSchema,
  SubCategoryUpdateSchema,
} from '../types/subCategory.schema'
import { responseReturn } from '../utils/response'

import { z } from 'zod'
import { QuerySchema } from '../types/types.'
import prisma from '../utils/prisma'
// const prisma = new PrismaClient()

class subCategoryController {
//   createSubCategory = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Validate request body
//       const validationResult = SubCategoryCreateSchema.safeParse(req.body)
//       if (!validationResult.success) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: validationResult.error.errors,
//         })
//       }

//       const { name, categoryId } = validationResult.data

//       // Check for existing subcategory name
//       const existingSubCategory = await prisma.subCategory.findUnique({
//         where: { name },
//       })

//       if (existingSubCategory) {
//         return responseReturn(res, 409, {
//           error: 'SubCategory name already exists',
//           existingName: name,
//         })
//       }

//       // Verify parent category exists
//       const parentCategory = await prisma.category.findUnique({
//         where: { id: categoryId },
//         select: { id: true },
//       })
//       if (!parentCategory) {
//         return responseReturn(res, 404, {
//           error: 'Parent category not found',
//           categoryId,
//         })
//       }

//       // Create subcategory
//       const subCategory = await prisma.subCategory.create({
//         data: {
//           name,
//           categoryId,
//         },
//         include: {
//           category: {
//             select: {
//               id: true,
//               Name: true,
//             },
//           },
//         },
//       })

//       return responseReturn(res, 201, {
//         data: subCategory,
//         message: 'SubCategory created successfully',
//       })
//     } catch (error: any) {
//       console.error('SubCategory creation error:', error)

//       // Handle Prisma errors
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2002':
//             return responseReturn(res, 409, {
//               error: 'Duplicate entry',
//               fields: error.meta?.target,
//               message: 'SubCategory already exists with these details',
//             })
//           case 'P2003':
//             return responseReturn(res, 400, {
//               error: 'Invalid category reference',
//               message: 'Foreign key constraint failed',
//               field: 'categoryId',
//             })
//         }
//       }

//       // Generic error handler
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error.message || 'Unknown error occurred',
//       })
//     }
//   }

//   updateSubCategory = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Validate ID parameter
//       const subCategoryId = parseInt(req.params.id, 10)
//       if (isNaN(subCategoryId)) {
//         return responseReturn(res, 400, {
//           error: 'Invalid subcategory ID format',
//         })
//       }

//       // Validate request body
//       const validationResult = SubCategoryUpdateSchema.safeParse(req.body)
//       if (!validationResult.success) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: validationResult.error.errors,
//         })
//       }

//       const { name, categoryId } = validationResult.data

//       // Check if subcategory exists
//       const existingSubCategory = await prisma.subCategory.findUnique({
//         where: { id: subCategoryId },
//       })

//       if (!existingSubCategory) {
//         return responseReturn(res, 404, {
//           error: 'Subcategory not found',
//           subCategoryId,
//         })
//       }

//       // Check for name conflict (if name is being updated)
//       if (name && name !== existingSubCategory.name) {
//         const nameConflict = await prisma.subCategory.findFirst({
//           where: {
//             name,
//             id: { not: subCategoryId },
//           },
//         })

//         if (nameConflict) {
//           return responseReturn(res, 409, {
//             error: 'Subcategory name already exists',
//             conflictingName: name,
//           })
//         }
//       }

//       // Verify new category exists (if changing category)
//       if (categoryId && categoryId !== existingSubCategory.categoryId) {
//         const parentCategory = await prisma.category.findUnique({
//           where: { id: categoryId },
//         })

//         if (!parentCategory) {
//           return responseReturn(res, 404, {
//             error: 'New parent category not found',
//             categoryId,
//           })
//         }
//       }

//       // Perform update
//       const updatedSubCategory = await prisma.subCategory.update({
//         where: { id: subCategoryId },
//         data: {
//           ...(name && { name }),
//           ...(categoryId && { categoryId }),
//         },
//         include: {
//           category: {
//             select: {
//               id: true,
//               Name: true,
//             },
//           },
//         },
//       })

//       return responseReturn(res, 200, {
//         data: updatedSubCategory,
//         message: 'Subcategory updated successfully',
//       })
//     } catch (error: any) {
//       console.error('Subcategory update error:', error)

//       // Handle Prisma errors
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2025':
//             return responseReturn(res, 404, {
//               error: 'Subcategory not found',
//               message: 'The specified subcategory does not exist',
//             })
//           case 'P2002':
//             return responseReturn(res, 409, {
//               error: 'Duplicate entry',
//               fields: error.meta?.target,
//               message: 'Subcategory already exists with these details',
//             })
//           case 'P2003':
//             return responseReturn(res, 400, {
//               error: 'Invalid category reference',
//               message: 'Foreign key constraint failed',
//               field: 'categoryId',
//             })
//         }
//       }

//       // Generic error handler
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error.message || 'Unknown error occurred',
//       })
//     }
//   }

//   getSubCategories = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Validate query parameters
//       const validatedQuery = QuerySchema.parse(req.query)
//       const { page, parPage, searchValue } = validatedQuery

//       // Calculate pagination values
//       const skip = (page - 1) * parPage
//       const take = parPage

//       // Build the search filter
//       const where: Prisma.SubCategoryWhereInput = {}
//       if (searchValue) {
//         where.OR = [
//           { name: { contains: searchValue, mode: 'insensitive' } },
//           {
//             category: { Name: { contains: searchValue, mode: 'insensitive' } },
//           },
//         ]
//       }

//       // Execute parallel queries for data and total count
//       const [subCategories, totalCount] = await Promise.all([
//         prisma.subCategory.findMany({
//           skip,
//           take,
//           where,
//           orderBy: { createdAt: 'desc' },
//           select: {
//             id: true,
//             name: true,
//             categoryId: true,
//             createdAt: true,
//             updatedAt: true,
//             category: {
//               select: {
//                 id: true,
//                 Name: true,
//               },
//             },
//           },
//         }),
//         prisma.subCategory.count({ where }),
//       ])

//       // Calculate pagination metadata
//       const totalPages = Math.ceil(totalCount / parPage)

//       return responseReturn(res, 200, {
//         data: subCategories,
//         pagination: {
//           currentPage: page,
//           itemsPerPage: parPage,
//           totalItems: totalCount,
//           totalPages,
//           hasNextPage: page < totalPages,
//           hasPreviousPage: page > 1,
//         },
//         message: 'Subcategories retrieved successfully',
//       })
//     } catch (error) {
//       console.error('Get subcategories error:', error)

//       if (error instanceof z.ZodError) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: error.flatten().fieldErrors,
//         })
//       }

//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         return responseReturn(res, 500, {
//           error: 'Database error',
//           code: error.code,
//           message: error.message,
//         })
//       }

//       const errorMessage =
//         error instanceof Error ? error.message : 'Unknown error'
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: errorMessage,
//       })
//     }
//   }

//   getSubCategoryById = async (req: Request, res: Response): Promise<void> => {
//   try {
//     // Validate route param
//     const parsed = SubCategoryIdSchema.safeParse(req.params)
//     if (!parsed.success) {
//       return responseReturn(res, 400, {
//         error: 'Validation error',
//         details: parsed.error.flatten().fieldErrors,
//       })
//     }

//     const subCategoryId = parseInt(parsed.data.id, 10)

//     // Fetch subcategory by ID
//     const subCategory = await prisma.subCategory.findUnique({
//       where: { id: subCategoryId },
//       select: {
//         id: true,
//         name: true,
//         categoryId: true,
//         createdAt: true,
//         updatedAt: true,
//         category: {
//           select: {
//             id: true,
//             Name: true,
//           },
//         },
//       },
//     })

//     if (!subCategory) {
//       return responseReturn(res, 404, {
//         error: 'SubCategory not found',
//       })
//     }

//     return responseReturn(res, 200, {
//       data: subCategory,
//       message: 'SubCategory retrieved successfully',
//     })
//   } catch (error) {
//     console.error('Get subcategory by ID error:', error)

//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       return responseReturn(res, 500, {
//         error: 'Database error',
//         message: error.message,
//       })
//     }

//     const errorMessage = error instanceof Error ? error.message : 'Unknown error'
//     return responseReturn(res, 500, {
//       error: 'Internal server error',
//       message: errorMessage,
//     })
//   }
// }

//   deleteSubCategory = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Validate ID parameter
//       const subCategoryId = parseInt(req.params.id, 10)
//       if (isNaN(subCategoryId) || subCategoryId <= 0) {
//         return responseReturn(res, 400, {
//           error: 'Invalid subcategory ID',
//           details: 'Must be a positive integer',
//         })
//       }

//       // Check subcategory existence
//       const existingSubCategory = await prisma.subCategory.findUnique({
//         where: { id: subCategoryId },
//         select: { id: true },
//       })

//       if (!existingSubCategory) {
//         return responseReturn(res, 404, {
//           error: 'Subcategory not found',
//           subCategoryId,
//         })
//       }

//       // // Check for dependent PRODUCTS
//       // const dependentProducts = await prisma.product.count({
//       //   where: {
//       //     subCategoryId: subCategoryId,
//       //   },
//       // })

//       // if (dependentProducts > 0) {
//       //   return responseReturn(res, 409, {
//       //     error: 'Cannot delete subcategory',
//       //     message: 'Subcategory has associated products',
//       //     dependentProductsCount: dependentProducts,
//       //   })
//       // }

//       // Perform deletion
//       const deletedSubCategory = await prisma.subCategory.delete({
//         where: { id: subCategoryId },
//         select: {
//           id: true,
//           name: true,
//           createdAt: true,
//         },
//       })

//       return responseReturn(res, 200, {
//         message: 'Subcategory deleted successfully',
//         data: deletedSubCategory,
//       })
//     } catch (error) {
//       console.error('Delete subcategory error:', error)

//       // Handle Prisma errors
//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//           case 'P2025':
//             return responseReturn(res, 404, {
//               error: 'Subcategory not found',
//               message: 'The specified subcategory does not exist',
//             })
//           case 'P2003':
//             return responseReturn(res, 409, {
//               error: 'Dependency error',
//               message: 'Cannot delete due to existing relationships',
//               field: error.meta?.field_name,
//             })
//         }
//       }

//       // Generic error handling
//       const errorMessage =
//         error instanceof Error ? error.message : 'Unknown error'
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: errorMessage,
//       })
//     }
//   }
}
export default new subCategoryController()
