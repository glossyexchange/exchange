import express from 'express'
import customerControllers from '../controllers/accountController'


const router = express.Router()

router.post('/create/account', customerControllers.createAccount)
router.put('/update/account/:id', customerControllers.updateAccount)
router.patch('/update/account/:id', customerControllers.updateAccount)
router.get('/allAccounts', customerControllers.getAllAccounts)
router.get('/lastAccountId', customerControllers.getLastAccountId)

// router.delete('/delete/account/:id', customerControllers.deleteAccount)
router.get('/account/:accountId', customerControllers.getAccountByAccountId)

export default router
