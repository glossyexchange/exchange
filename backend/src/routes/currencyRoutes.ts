import express from 'express'
import currencyController from '../controllers/currencyController'

import { authMiddleware } from '../middlewares/authMiddleware'

const router = express.Router()

router.post('/create/currency', currencyController.createCurrency)
router.get('/currencies', currencyController.getAllCurrencies)
router.put('/update/currency/:id', currencyController.updateCurrency)
router.get(
  '/currencies/by-currency-id/:currencyId',
  currencyController.getCurrencyByCurrencyId
)

router.delete('/delete/currency/:id', currencyController.deleteCurrency)

export default router
