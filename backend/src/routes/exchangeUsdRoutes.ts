
import express from 'express'
import exchangeUsdController from '../controllers/exchangeUsdController'

const router = express.Router()

router.post('/create/exchange-usd', exchangeUsdController.createExchangeUsd)
router.put('/update/exchange-usd/:voucherNo',  exchangeUsdController.updateExchangeUsd)


router.get('/exchange-usd', exchangeUsdController.getExchangeUSDByVoucherNo)
router.get('/all-exchange-usd', exchangeUsdController.getAllUsdExchanges)

router.delete(
  '/exchange-usd',
  exchangeUsdController.deleteExchangeUsd
)

export default router
