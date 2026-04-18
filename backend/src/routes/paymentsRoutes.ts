import express from 'express'
import paymentControllers from '../controllers/paymentsController'



const router = express.Router()

router.post('/create/payment', paymentControllers.createPayment)
router.put('/update/payment/:voucherNo', paymentControllers.updatePayment)
router.get('/payment', paymentControllers.getPayment);
router.get('/allPayments', paymentControllers.getAllPayments)
router.delete('/delete/payment', paymentControllers.deletePayment);

export default router
