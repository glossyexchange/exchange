import { z } from 'zod'
// export const QuerySchema = z.object({
//   page: z.coerce.number().int().positive().default(1),
//   parPage: z.coerce.number().int().positive().default(20),
//   searchValue: z.string().trim().optional(),
// })

export const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  parPage: z.coerce.number().int().positive().default(20),
  searchValue: z.string().trim().optional(),
searchMode: z.enum(['autocomplete', 'full']).optional().default('full'), 

})
