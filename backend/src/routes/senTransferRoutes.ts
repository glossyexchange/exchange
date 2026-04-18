import express from 'express'
import SenTransferController from '../controllers/senTransferController'

const router = express.Router()

router.post('/create/send-transfer', SenTransferController.createTransfer)
router.put('/update/send-transfer/:voucherNo', SenTransferController.updateSendTransfer)
router.get('/send-transfer', SenTransferController.getSendTransfer)
router.get('/send-transfers', SenTransferController.getSendTransfers)
router.get('/cancelled-send-transfers', SenTransferController.getCancelledSendTransfers)

router.delete(
  '/send-transfer',
  SenTransferController.deleteSendTransfer
)

router.delete(
  '/cancelled-send-transfer',
  SenTransferController.deleteCancelledSendTransfer
);

export default router
