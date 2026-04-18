import { z } from 'zod';

export const AccountCreateSchema = z.object({
  accountId: z.number().int().positive(),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
  address: z.string().max(200).optional(),
  accountTypeId: z.number().int().positive(),
})

export const AccountUpdateSchema = z
  .object({
    accountId: z.number().int().positive().optional(),
    name: z.string().min(2).max(100).optional(),
    phone: z
      .string()
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
      .optional(),
    address: z.string().max(200).optional().nullable(),
    accountTypeId: z.number().int().positive().optional(),
  })
  .strict()

// Zod schema for account type creation
export const AccountTypeCreateSchema = z.object({
  type: z
    .string()
    .min(2, 'Type must be at least 2 characters')
    .max(50, 'Type cannot exceed 50 characters'),
});

export const AccountTypeUpdateSchema = z
  .object({
    type: z
      .string()
      .min(2, 'Type must be at least 2 characters')
      .max(50, 'Type cannot exceed 50 characters')
      .optional(),
    // start: z
    //   .number()
    //   .int('Start must be an integer')
    //   .positive('Start must be positive')
    //   .optional(),
    // end: z
    //   .number()
    //   .int('End must be an integer')
    //   .positive('End must be positive')
    //   .optional(),
  })
  // .refine((data) => !(data.start && data.end) || data.start < data.end, {
  //   message: 'End must be greater than start',
  //   path: ['end'],
  // })

  export const QueryAccountSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(15),
  searchValue: z.string().trim().optional(),
searchMode: z.enum(['autocomplete', 'full']).optional().default('full'), 
  accountTypeId: z.coerce.number().int().positive().default(100),
})
  
