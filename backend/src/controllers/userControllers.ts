import { Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import fs from 'fs-extra'
import path from 'path'
import {
  AdminCreateSchema,
  AdminQuerySchema,
  AdminUpdateSchema,
} from '../types/user.schema'
import prisma from '../utils/prisma'
import { responseReturn } from '../utils/response'
import { createToken } from '../utils/tokenCreate'
// const prisma = new PrismaClient()

const rootDir = process.cwd()
const uploadsDir = path.join(rootDir, 'uploads')
const adminsDir = path.join(uploadsDir, 'admins')

class UserControllers {
  createAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Validate incoming data
      const validationResult = AdminCreateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const data = validationResult.data

      // 2. Check if phone already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { phone: data.phone },
      })

      if (existingAdmin) {
        return responseReturn(res, 409, {
          error: 'Phone number already exists',
        })
      }

      // 3. Process uploaded image
      let imagePath: string | null = null
      if (req.file) {
        const finalPath = path.join(adminsDir, req.file.filename)
        await fs.move(req.file.path, finalPath)
        imagePath = `/uploads/admins/${req.file.filename}`
      }

      // 4. Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10)

      // 5. Create new admin
      const newAdmin = await prisma.admin.create({
        data: {
          name: data.name,
          phone: data.phone,
          password: hashedPassword,
          image: imagePath,
          role: data.role || 'admin', // Default to 'admin' if not provided
        },
      })

      return responseReturn(res, 201, {
        message: 'Admin created successfully',
        data: newAdmin,
      })
    } catch (error: any) {
      console.error('Admin creation error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Something went wrong',
      })
    }
  }

  admin_login = async (req: Request, res: Response): Promise<void> => {
    const { phone, password } = req.body

    try {
      const sanitizedPhone = phone.trim()

      const admin = await prisma.admin.findUnique({
        where: { phone: sanitizedPhone },
        select: {
          id: true,
          password: true,
          role: true,
          name: true,
          phone: true,
          image:true,
          tokenVersion: true, // Add this line
        },
      })

      if (!admin) {
        return responseReturn(res, 404, { error: 'Phone number not found' })
      }

      const passwordMatches = await bcrypt.compare(password, admin.password)
      if (!passwordMatches) {
        return responseReturn(res, 401, { error: 'Incorrect password' })
      }

      const token = createToken({
        id: admin.id,
        role: admin.role,
        name: admin.name,
        phone: admin.phone,
        image:admin.image,
        tokenVersion: admin.tokenVersion ?? 0,
      })

      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      return responseReturn(res, 200, {
        token,
        message: 'Login successful',
      })
    } catch (error: any) {
      console.error('Admin login error:', error.message)
      return responseReturn(res, 500, {
        error: 'Internal server error',
      })
    }
  }

  updateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = Number(req.params.id)

     

      // 1. Validate input
      const validationResult = AdminUpdateSchema.safeParse(req.body)
      if (!validationResult.success) {
        return responseReturn(res, 400, {
          error: 'Validation error',
          details: validationResult.error.errors,
        })
      }

      const data = validationResult.data

      // 2. Find the existing admin
      const existingAdmin = await prisma.admin.findUnique({
        where: { id: adminId },
      })

      if (!existingAdmin) {
        return responseReturn(res, 404, {
          error: 'Admin not found',
        })
      }

      // 3. Check for unique phone if changed
      if (data.phone && data.phone !== existingAdmin.phone) {
        const phoneExists = await prisma.admin.findUnique({
          where: { phone: data.phone },
        })
        if (phoneExists) {
          return responseReturn(res, 409, {
            error: 'Phone number already exists',
          })
        }
      }

      // 4. Handle image update (delete old, store new)
   let imagePath = existingAdmin.image;

if (req.file) {
  
  if (existingAdmin.image) {
    const oldImagePath = path.join(adminsDir, path.basename(existingAdmin.image));
    // console.log("Attempting to remove old image at:", oldImagePath);

    try {
      await fs.remove(oldImagePath);
      // console.log("✅ Removed old image:", oldImagePath);
    } catch (err) {
      console.error("❌ Failed to remove old image:", oldImagePath, err);
    }
  }

  // Move new image from temp to permanent folder
  const finalPath = path.join(adminsDir, req.file.filename);
  await fs.move(req.file.path, finalPath);
  // console.log("✅ Moved new image to:", finalPath);

  imagePath = `/uploads/admins/${req.file.filename}`;
}

      // 5. Hash password if provided
      let hashedPassword = undefined
      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 10)
      }

      // 6. Update admin
      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: {
          name: data.name,
          phone: data.phone,
          image: imagePath,
          role: data.role || existingAdmin.role, // Keep existing role if not provided
          ...(hashedPassword && { password: hashedPassword }),
        },
      })

      return responseReturn(res, 200, {
        message: 'Admin updated successfully',
        data: updatedAdmin,
      })
    } catch (error: any) {
      console.error('Admin update error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Something went wrong',
      })
    }
  }

  getAllAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query params
      const result = AdminQuerySchema.safeParse(req.query)

      if (!result.success) {
        return responseReturn(res, 400, {
          error: 'Invalid query parameters',
          details: result.error.errors,
        })
      }

      const { page, parPage, sortBy, sortOrder, searchValue } = result.data

      const where: Prisma.AdminWhereInput = {}

      // Add search filtering
      if (searchValue) {
        where.OR = [
          {
            name: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
        ]
      }

      // Get paginated data and total count
      const [admins, totalCount] = await Promise.all([
        prisma.admin.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * parPage,
          take: parPage,
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            image: true,
            createdAt: true,
          },
        }),
        prisma.admin.count({ where }),
      ])

      const totalPages = Math.ceil(totalCount / parPage)

      return responseReturn(res, 200, {
        admins: admins,
        totalAdmins: totalCount,
        pagination: {
          
          totalPages,
          currentPage: page,
          parPage,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          searchValue,
        },
        message: 'Admins retrieved successfully',
      })
    } catch (error: any) {
      console.error('Get all admins error:', error)
      return responseReturn(res, 500, {
        error: 'Internal server error',
        message: error.message || 'Something went wrong',
      })
    }
  }

  getAdminById = async (
    req: Request<{ id: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params
      const numericId = Number(id)

      if (!id || isNaN(numericId)) {
        return responseReturn(res, 400, {
          error: 'Invalid admin ID format',
        })
      }

      const adminUser = await prisma.admin.findUnique({
        where: { id: numericId },
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
          role: true,
          createdAt: true,
        },
      })

      if (!adminUser) {
        return responseReturn(res, 404, {
          error: 'Admin not found',
        })
      }

      return responseReturn(res, 200, {
        data: adminUser,
        message: 'Admin fetched successfully',
      })
    } catch (error: any) {
      console.error('Get admin by id error:', error.message)
      return responseReturn(res, 500, {
        error: 'Internal Server Error',
      })
    }
  }

  get_user_info = async (req: Request, res: Response): Promise<void> => {
    try {
      // Access the id directly from request object
      const id = req.id

      // Validation
      if (!id || isNaN(id)) {
        return responseReturn(res, 400, {
          error: 'Invalid user ID format',
        })
      }

      // Fetch user from database
      const user = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          phone: true,
          image: true,
          role: true,
          createdAt: true,
        },
      })

      if (!user) {
        return responseReturn(res, 404, {
          error: 'User not found',
        })
      }

      return responseReturn(res, 200, {
        userInfo: user,
        message: 'User info fetched successfully',
      })
    } catch (error: any) {
      console.error('Get user info error:', error.message)
      return responseReturn(res, 500, {
        error: 'Internal Server Error',
      })
    }
  }

  updateAdminPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = Number(req.params.id);
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
      return responseReturn(res, 400, {
        error: "Validation error",
        message: "Old password and new password are required",
      });
    }

    // 1. Find existing admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!existingAdmin) {
      return responseReturn(res, 404, { error: "Admin not found" });
    }

    // 2. Compare old password
    const isMatch = await bcrypt.compare(password, existingAdmin.password);
    if (!isMatch) {
      return responseReturn(res, 401, {
        error: "Invalid old password",
      });
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    return responseReturn(res, 200, {
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Password update error:", error);
    return responseReturn(res, 500, {
      error: "Internal server error",
      message: error.message || "Something went wrong",
    });
  }
};

  deleteAdmin = async (req: Request, res: Response): Promise<void> => {
    const userId = Number(req.params.userId)

    if (isNaN(userId)) {
      return responseReturn(res, 400, { error: 'Invalid user ID' })
    }

    try {
      const existingAdmin = await prisma.admin.findUnique({
        where: { id: userId },
      })

      if (!existingAdmin) {
        return responseReturn(res, 404, { error: 'Admin user not found' })
      }

      await prisma.admin.delete({ where: { id: userId } })

      return responseReturn(res, 200, { message: 'User removed successfully' })
    } catch (error: any) {
      console.error('Delete error:', error.message)
      return responseReturn(res, 500, { error: 'Failed to remove user' })
    }
  }
}

export default new UserControllers()
