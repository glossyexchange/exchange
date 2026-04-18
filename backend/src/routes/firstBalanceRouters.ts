import express from 'express'
import firstBalanceController from '../controllers/firstBalanceController'



const router = express.Router()

router.post('/create/balance', firstBalanceController.createFirstBalance)
router.put('/update/balance', firstBalanceController.updateFirstBalance)
// router.get('/payment/:voucherNo', firstBalanceController.getPaymentByVoucherNo)
router.get('/allFirstBalances', firstBalanceController.getFirstBalances)
router.delete(
  '/delete/firstBalance/:fiscalYear/:voucherNo/:typeId',
  firstBalanceController.deleteFirstBalance
);

export default router
