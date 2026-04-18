// test-connection.ts
import { PrismaClient } from '@prisma/client'

async function test() {
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Connected to database!')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Test query successful:', result)
    
    await prisma.$disconnect()
    console.log('✅ Disconnected successfully')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

test()