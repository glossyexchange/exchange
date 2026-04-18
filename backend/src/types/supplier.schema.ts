import { z } from 'zod'

export const SupplierCreateSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(200).optional(),
})

export const SupplierUpdateSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z
      .string()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
      .optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
  })
  .transform((data) => ({
    ...data,
    email: data.email || null, // Convert empty string to null
    address: data.address || null,
  }))

export const SupplierIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid supplier ID'),
})
