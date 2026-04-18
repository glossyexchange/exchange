import multer, { StorageEngine } from 'multer'
import path from 'path'
import fs from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'

const rootDir = process.cwd()
const uploadsDir = path.join(rootDir, 'uploads')

const productsDir = path.join(uploadsDir, 'products')
const orderDir = path.join(uploadsDir, 'orders')
const receiptDir = path.join(uploadsDir, 'receipts')

// Create products directory on startup
fs.ensureDirSync(productsDir)
fs.ensureDirSync(orderDir)
fs.ensureDirSync(receiptDir)

// Configure directories
export const tempDir = path.join(uploadsDir, 'temp')
const categoriesDir = path.join(uploadsDir, 'categories')

// Create directories synchronously on startup
fs.ensureDirSync(tempDir)
fs.ensureDirSync(categoriesDir)

const adminsDir = path.join(uploadsDir, 'admins')
fs.ensureDirSync(adminsDir)

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  },
})

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
})

// Create separate configuration for product images
const productStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir) // Still use temp dir for initial upload
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `product_${uuidv4()}${ext}` // Add product prefix
    cb(null, filename)
  },
})

export const uploadProductImages = multer({
  storage: productStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Allow up to 5 images per product
  },
})

const adminStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `admin_${uuidv4()}${ext}`
    cb(null, filename)
  },
})

export const uploadAdminImage = multer({
  storage: adminStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Allow up to 5 images per product
  },
})

const orderStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir) // Still use temp dir for initial upload
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `order_${uuidv4()}${ext}` // Add product prefix
    cb(null, filename)
  },
})

export const uploadOrderImages = multer({
  storage: orderStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Allow up to 5 images per product
  },
})


const receiptStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir) // Still use temp dir for initial upload
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `receipt_${uuidv4()}${ext}` // Add product prefix
    cb(null, filename)
  },
})

export const uploadReceiptImages = multer({
  storage: receiptStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 2, // Allow up to 1 images per receipt
  },
})
