import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

// import { PrismaClient } from '@prisma/client'
// import dotenv from 'dotenv'

// // Load environment variables
// dotenv.config()

// const databaseUrl = process.env.DATABASE_URL
// if (!databaseUrl) {
//   throw new Error('DATABASE_URL environment variable is not set')
// }

// const prisma = new PrismaClient({
//   datasourceUrl: databaseUrl,
// })

// export default prisma