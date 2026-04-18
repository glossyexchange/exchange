
import express from 'express'
import ExchangeAllController from '../controllers/exchangeAllController'

const router = express.Router()

router.post('/create/echange-all', ExchangeAllController.createExchangeAll)
router.put('/update/exchange-all/:voucherNo',  ExchangeAllController.updateExchangeAll)

router.get('/exchange-currencies', ExchangeAllController.getExchangeAllByVoucherNo)
router.get('/all-exchange-currencies', ExchangeAllController.getAllExchanges)

router.delete('/delete-exchange-all', ExchangeAllController.deleteExchangeAll)


export default router
