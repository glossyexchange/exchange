import { z } from 'zod'
import { ROLES } from '../utils/roles'

export const AdminCreateSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(ROLES), // dynamically handles all your roles
})

export const AdminUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(ROLES),
})

export const AdminQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  parPage: z.string().optional().default('20').transform(Number),
  sortBy: z.enum(['createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  searchValue: z.string().optional(),
})
