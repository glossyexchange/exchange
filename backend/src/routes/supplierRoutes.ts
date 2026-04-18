import express from 'express'

import { authMiddleware } from '../middlewares/authMiddleware'
import supplierController from '../controllers/supplierController'

const router = express.Router()

router.post('/create/supplier', supplierController.createSupplier)
router.put('/update/supplier/:id', supplierController.updateSupplier)
// router.patch('/update/customers/:id', customerControllers.updateCustomer)
router.get('/suppliers', supplierController.getSuppliers)
router.get('/supplier/:id', supplierController.getSupplierById)
router.delete('/delete/supplier/:id', supplierController.deleteSupplier)
// router.get('/customers/account/:accountId', customerControllers.getCustomerByAccountId)

export default router
