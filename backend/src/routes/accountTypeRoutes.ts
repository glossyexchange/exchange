import express from 'express'
import accountTypeControllers from '../controllers/accountTypeController'

import { authMiddleware } from '../middlewares/authMiddleware'

const router = express.Router()

router.post('/create/account-type', accountTypeControllers.createAccountType)
router.put('/update/account-type/:id', accountTypeControllers.updateAccountType)
router.get('/getAccountTypeById/:id', accountTypeControllers.getAccountTypeById)
router.get('/getAllAccountTypes', accountTypeControllers.getAllAccountTypes)
router.delete('/delete/account-type/:id', accountTypeControllers.deleteAccountType)
// router.get('/accounts/export', accountTypeControllers.export_accounts)
export default router
