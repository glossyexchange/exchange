import express from 'express'
import QaidController from '../controllers/qaidController'


const router = express.Router()

router.post('/create/qaid-transfer', QaidController.createQaid)
// router.put('/update/send-transfer/:voucherNo', QaidController.updateSendTransfer)
// router.get('/send-transfer', QaidController.getSendTransfer)
// router.get('/send-transfers', QaidController.getSendTransfers)
// router.get('/cancelled-send-transfers', QaidController.getCancelledSendTransfers)

// router.delete(
//   '/send-transfer',
//   QaidController.deleteSendTransfer
// )

// router.delete(
//   '/cancelled-send-transfer',
//   QaidController.deleteCancelledSendTransfer
// );

export default router
