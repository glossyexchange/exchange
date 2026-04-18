// import { Request, Response } from 'express'
// import { Prisma, PrismaClient } from '@prisma/client'
// import { responseReturn } from '../utils/response'
// import { QuerySchema } from '../types/types.'
// import { UnitCreateSchema, UnitUpdateSchema } from '../types/unit.schema'

// const prisma = new PrismaClient()

// class UnitController {
//   createUnit = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const validation = UnitCreateSchema.safeParse(req.body)
//       if (!validation.success) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: validation.error.flatten().fieldErrors,
//         })
//       }

//       const { unitName } = validation.data

//       // Check for existing unit
//       const existingUnit = await prisma.unit.findUnique({
//         where: { unitName },
//       })

//       if (existingUnit) {
//         return responseReturn(res, 409, {
//           error: 'Unit already exists',
//           existingUnitName: unitName,
//         })
//       }

//       // Create new unit
//       const newUnit = await prisma.unit.create({
//         data: { unitName },
//         select: {
//           id: true,
//           unitName: true,
//           createdAt: true,
//         },
//       })

//       return responseReturn(res, 201, {
//         data: newUnit,
//         message: 'Unit created successfully',
//       })
//     } catch (error) {
//       console.error('Create unit error:', error)

//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         if (error.code === 'P2002') {
//           return responseReturn(res, 409, {
//             error: 'Duplicate unit name',
//             message: 'Unit with this name already exists',
//           })
//         }
//       }

//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       })
//     }
//   }

//   getAllUnits = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const validatedQuery = QuerySchema.parse(req.query)
//       const { page, parPage, searchValue } = validatedQuery

//       const skip = (page - 1) * parPage
//       const take = parPage

//       const where: Prisma.UnitWhereInput = {}
//       if (searchValue) {
//         where.unitName = {
//           contains: searchValue,
//           mode: 'insensitive',
//         }
//       }

//       const [units, total] = await Promise.all([
//         prisma.unit.findMany({
//           skip,
//           take,
//           where,
//           orderBy: { createdAt: 'desc' },
//           select: {
//             id: true,
//             unitName: true,
//             createdAt: true,
//             updatedAt: true,
//             _count: { select: { Product: true } },
//           },
//         }),
//         prisma.unit.count({ where }),
//       ])

//       const formattedUnits = units.map((unit) => ({
//         ...unit,
//         productsCount: unit._count.Product,
//         _count: undefined,
//       }))

//       const totalPage = Math.ceil(total / parPage)

//       return responseReturn(res, 200, {
//         data: formattedUnits,
//         pagination: {
//           total,
//           totalPage,
//           currentPage: page,
//           perPage: parPage,
//           hasNext: page < totalPage,
//           hasPrev: page > 1,
//         },
//         message: 'Units retrieved successfully',
//       })
//     } catch (error) {
//       console.error('Get units error:', error)
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       })
//     }
//   }

//   getUnitById = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const id = parseInt(req.params.id, 10)
//       if (isNaN(id) || id <= 0) {
//         return responseReturn(res, 400, {
//           error: 'Invalid unit ID',
//           details: 'Must be a positive integer',
//         })
//       }

//       const unit = await prisma.unit.findUnique({
//         where: { id },
//         select: {
//           id: true,
//           unitName: true,
//           createdAt: true,
//           updatedAt: true,
//           _count: { select: { Product: true } },
//         },
//       })

//       if (!unit) {
//         return responseReturn(res, 404, {
//           error: 'Unit not found',
//           unitId: id,
//         })
//       }

//       const responseData = {
//         ...unit,
//         productsCount: unit._count.Product,
//       }

//       return responseReturn(res, 200, {
//         data: responseData,
//         message: 'Unit retrieved successfully',
//       })
//     } catch (error) {
//       console.error('Get unit error:', error)
//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       })
//     }
//   }

//   updateUnit = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const id = parseInt(req.params.id, 10)
//       if (isNaN(id) || id <= 0) {
//         return responseReturn(res, 400, {
//           error: 'Invalid unit ID',
//           details: 'Must be a positive integer',
//         })
//       }

//       const validation = UnitUpdateSchema.safeParse(req.body)
//       if (!validation.success) {
//         return responseReturn(res, 400, {
//           error: 'Validation error',
//           details: validation.error.flatten().fieldErrors,
//         })
//       }

//       const { unitName } = validation.data

//       const existingUnit = await prisma.unit.findUnique({ where: { id } })
//       if (!existingUnit) {
//         return responseReturn(res, 404, {
//           error: 'Unit not found',
//           unitId: id,
//         })
//       }

//       if (unitName && unitName !== existingUnit.unitName) {
//         const nameConflict = await prisma.unit.findFirst({
//           where: { unitName, id: { not: id } },
//         })
//         if (nameConflict) {
//           return responseReturn(res, 409, {
//             error: 'Unit name already exists',
//             conflictingName: unitName,
//           })
//         }
//       }

//       const updatedUnit = await prisma.unit.update({
//         where: { id },
//         data: { unitName },
//         select: {
//           id: true,
//           unitName: true,
//           createdAt: true,
//           updatedAt: true,
//         },
//       })

//       return responseReturn(res, 200, {
//         data: updatedUnit,
//         message: 'Unit updated successfully',
//       })
//     } catch (error) {
//       console.error('Update unit error:', error)

//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         if (error.code === 'P2025') {
//           return responseReturn(res, 404, {
//             error: 'Unit not found',
//             message: 'The specified unit does not exist',
//           })
//         }
//         if (error.code === 'P2002') {
//           return responseReturn(res, 409, {
//             error: 'Duplicate unit name',
//             message: 'Unit with this name already exists',
//           })
//         }
//       }

//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       })
//     }
//   }

//   deleteUnit = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const id = parseInt(req.params.id, 10)
//       if (isNaN(id) || id <= 0) {
//         return responseReturn(res, 400, {
//           error: 'Invalid unit ID',
//           details: 'Must be a positive integer',
//         })
//       }

//       const existingUnit = await prisma.unit.findUnique({
//         where: { id },
//         select: { id: true },
//       })
//       if (!existingUnit) {
//         return responseReturn(res, 404, {
//           error: 'Unit not found',
//           unitId: id,
//         })
//       }

//       const productCount = await prisma.product.count({
//         where: { unitId: id },
//       })
//       if (productCount > 0) {
//         return responseReturn(res, 409, {
//           error: 'Cannot delete unit',
//           message: 'Unit has associated products',
//           productCount,
//         })
//       }

//       const deletedUnit = await prisma.unit.delete({
//         where: { id },
//         select: { id: true, unitName: true },
//       })

//       return responseReturn(res, 200, {
//         data: deletedUnit,
//         message: 'Unit deleted successfully',
//       })
//     } catch (error) {
//       console.error('Delete unit error:', error)

//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         if (error.code === 'P2025') {
//           return responseReturn(res, 404, {
//             error: 'Unit not found',
//             message: 'The specified unit does not exist',
//           })
//         }
//         if (error.code === 'P2003') {
//           return responseReturn(res, 409, {
//             error: 'Dependency error',
//             message: 'Cannot delete unit with associated products',
//           })
//         }
//       }

//       return responseReturn(res, 500, {
//         error: 'Internal server error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       })
//     }
//   }
// }

// export default new UnitController()
