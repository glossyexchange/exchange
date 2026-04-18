export const ROLES = ['admin', 'superadmin', 'manager', 'editor'] as const
export type Role = (typeof ROLES)[number]
