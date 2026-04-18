// import { PrismaClient } from '@prisma/client'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import fs from 'fs-extra'
import http from 'http'
import morgan from 'morgan'
import cron from 'node-cron'
import path from 'path'
import { tempDir } from './utils/multer'
import prisma from './utils/prisma'
// import authRoutes from './routes/authRoutes'
import { errorHandler } from './middlewares/errorMiddleware'
import accountRoutes from './routes/accountRoutes'
import accountTypeRoutes from './routes/accountTypeRoutes'
import categoryRoutes from './routes/categoryRoutes'
import subCategoryRoutes from './routes/subCategoryRoutes'
import supplierRoutes from './routes/supplierRoutes'
// import unitRoutes from './routes/unitRoutes'
// import productRoutes from './routes/productRoutes'
import adminRoutes from './routes/adminRoutes'
import currencyRoutes from './routes/currencyRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import dailyImportRoutes from './routes/exchangeAllRoutes'
import exchangeUsdRoutes from './routes/exchangeUsdRoutes'
import firstBalanceRoutes from './routes/firstBalanceRouters'
import incomeTransferRoutes from './routes/incomeTransferRoutes'
import movementRoutes from './routes/movementRoutes'
import paymentRoutes from './routes/paymentsRoutes'
import qaidRoutes from './routes/qaidRoutes'
import receiptRoutes from './routes/receiptRoutes'
import sendTransferRoutes from './routes/senTransferRoutes'
import { closeYearDoubleEntry } from './services/year-end.service'
dotenv.config()

// const prisma = new PrismaClient()
const app: Express = express()
const server = http.createServer(app)
const port: number = parseInt(process.env.PORT || '5000', 10)

// ======================================
// Security Middlewares
// ======================================
// In server.ts
// server.ts
// const allowedOrigins = [
//   'http://localhost:5173',      // Vite dev server
//   'http://localhost:3000',      // React dev server
//   'http://127.0.0.1:5173',      // Localhost alternative
//   'http://127.0.0.1:3000',      // Localhost alternative
//   'http://56.228.24.94',        // Your production IP (HTTP)
//   'https://56.228.24.94',       // Your production IP (HTTPS if you add SSL)
//   'http://your-domain.com',     // If you have a domain
//   'https://your-domain.com',    // If you have a domain with SSL
// ];

// Or use a more permissive approach for development:
// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps, curl, Postman)
//     if (!origin) return callback(null, true);

//     // Allow all origins that match your IP or localhost
//     if (origin.startsWith('http://56.228.24.94') ||
//         origin.startsWith('http://localhost') ||
//         origin.startsWith('http://127.0.0.1')) {
//       return callback(null, true);
//     }

//     // Reject all other origins
//     callback(new Error('Not allowed by CORS'), false);
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
// }));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://exchange.glossycode.com',
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
)

app.get('/debug/payment-schema', async (req, res) => {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'payment'
    ORDER BY ordinal_position;
  `
  res.json(result)
})
// ======================================
// Performance Middlewares
// ======================================
app.use(compression())
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res) => {
      // Remove these security headers for images
      res.removeHeader('Cross-Origin-Opener-Policy')
      res.removeHeader('X-Frame-Options')
      res.removeHeader('X-XSS-Protection')

      // Keep CORS-related headers
      res.set('Cross-Origin-Resource-Policy', 'cross-origin')
      res.set(
        'Content-Security-Policy',
        "img-src 'self' http://localhost:5173 data: blob:",
      )
    },
  }),
)
// ======================================
// Operational Middlewares
// ======================================
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }))

// ======================================
// Rate Limiting
// ======================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', apiLimiter)

// ======================================
// API Routes (Versioned)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'API Server',
    version: '1.0.0',
  })
})
// ======================================
// app.use('/api/v1', authRoutes)
app.use('/api/v1', accountRoutes)
app.use('/api/v1', supplierRoutes)
app.use('/api/v1', categoryRoutes)
app.use('/api/v1', subCategoryRoutes)
app.use('/api/v1', accountTypeRoutes)
app.use('/api/v1', firstBalanceRoutes)
app.use('/api/v1', currencyRoutes)
app.use('/api/v1', receiptRoutes)
app.use('/api/v1', paymentRoutes)
app.use('/api/v1', incomeTransferRoutes)

app.use('/api/v1', sendTransferRoutes)
app.use('/api/v1', dailyImportRoutes)
app.use('/api/v1', exchangeUsdRoutes)
app.use('/api/v1', movementRoutes)
app.use('/api/v1', dashboardRoutes)
app.use('/api/v1', adminRoutes)
app.use('/api/v1', qaidRoutes)
// ======================================
// Health Check Endpoint
// ======================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// ======================================
// Error Handling
// ======================================
app.use(errorHandler)

// ======================================
// Temp Directory Cleanup Setup
// ======================================
const initializeTempCleanup = () => {
  // Cleanup on startup
  fs.emptyDirSync(tempDir)
  console.log(`🧹 Cleaned temp directory: ${tempDir}`)

  // Schedule periodic cleanup
  const cleanupInterval = setInterval(
    async () => {
      try {
        await fs.emptyDir(tempDir)
        console.log(`🔄 Scheduled temp directory cleanup completed: ${tempDir}`)
      } catch (error) {
        console.error('❌ Temp directory cleanup failed:', error)
      }
    },
    24 * 60 * 60 * 1000,
  ) // 24 hours

  return cleanupInterval
}

// ======================================
// Database Connection & Server Startup
// ======================================

const startServer = async () => {
  try {
    await prisma.$connect()
    console.log('📦 Connected to database')

    server.listen(port, () => {
      // Initialize temp cleanup after server starts
      const cleanupInterval = initializeTempCleanup()

      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`,
      )
      console.log(`🔗 Listening at http://localhost:${port}`)

      // Store interval reference for shutdown
      ;(server as any).cleanupInterval = cleanupInterval

      // ======================================
      // Schedule year-end closing cron job
      // ======================================
      // Run at 00:05 on Jan 1st every year
      if (process.env.ENABLE_YEAR_END_CRON === 'true') {
        cron.schedule('5 0 1 1 *', async () => {
          const currentYear = new Date().getFullYear()
          const oldYear = currentYear - 1
          const newYear = currentYear

          // Replace with the actual system user ID (or fetch from database)
          const SYSTEM_USER_ID = 1

          try {
            await closeYearDoubleEntry(oldYear, newYear, SYSTEM_USER_ID)
            console.log(
              `Year-end closing for ${oldYear} → ${newYear} succeeded.`,
            )
          } catch (error) {
            console.error('Year-end closing failed:', error)
            // Optionally send an alert (email, Slack, etc.)
          }
        })
      }

      console.log('⏰ Scheduled year-end closing job')
    })
  } catch (error) {
    console.error('❌ Database connection error:', error)
    process.exit(1)
  }
}
// const startServer = async () => {
//   try {
//     await prisma.$connect()
//     console.log('📦 Connected to database')

//     server.listen(port, () => {
//       // Initialize temp cleanup after server starts
//       const cleanupInterval = initializeTempCleanup()

//       console.log(
//         `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`
//       )
//       console.log(`🔗 Listening at http://localhost:${port}`)

//       // Store interval reference for shutdown
//       ;(server as any).cleanupInterval = cleanupInterval
//     })
//   } catch (error) {
//     console.error('❌ Database connection error:', error)
//     process.exit(1)
//   }
// }

// ======================================
// Graceful Shutdown
// ======================================
// ======================================
// Enhanced Graceful Shutdown
// ======================================
const shutdown = async (signal: string) => {
  console.log(`🚫 Received ${signal}, shutting down gracefully...`)

  try {
    // Clear temp cleanup interval
    if ((server as any).cleanupInterval) {
      clearInterval((server as any).cleanupInterval)
    }

    // Cleanup temp directory
    fs.emptyDirSync(tempDir)
    console.log('🧹 Temporary files cleaned')

    await prisma.$disconnect()
    console.log('📦 Database connection closed')

    server.close(() => {
      console.log('🛑 Server stopped')
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ Shutdown error:', error)
    process.exit(1)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ======================================
// Start Application
// ======================================
startServer()
