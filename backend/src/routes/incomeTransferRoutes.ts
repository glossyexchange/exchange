import express from 'express'
import IncomeTransferController from '../controllers/incomeTransferController'




const router = express.Router()

router.post('/create/income-transfer', IncomeTransferController.createIncomeTransfer)
router.put('/update/income-transfer/:voucherNo', IncomeTransferController.updateIncomeTransfer)
router.get('/income-transfer', IncomeTransferController.getIncomeTransfer)
router.get('/income-transfers', IncomeTransferController.getIncomeTransfers)
router.post('/create/paid-income-transfer', IncomeTransferController.createPaidTransfer)
router.get('/paid-income-transfers', IncomeTransferController.getPaidIncomeTransfers)
router.delete(
  '/income-transfer',
  IncomeTransferController.deleteIncomeTransfer
)
router.get('/cancelled-income-transfers', IncomeTransferController.getCancelledIncomeTransfers)

router.delete(
  '/cancelled-income-transfer',
  IncomeTransferController.deleteCancelledIncomeTransfer
);

router.delete(
  '/delete-paid-income-transfer',
  IncomeTransferController.deletePaidIncomeTransferByVoucherNo
)




export default router
