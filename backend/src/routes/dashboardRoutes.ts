import express from 'express'
import dashboardController from '../controllers/dashboardController'


const router = express.Router()

// router.get('/dashboard/data', dashboardController.getDashboardSums)
router.get('/dashboard/chart', dashboardController.getMonthlyChartData)
// router.put('/update/order/:voucherNo', customerOrderController.updateOrder)
// router.get('/order/:voucherNo', customerOrderController.getOrderByVoucherNo)
// router.get('/allOrders', customerOrderController.getAllOrders)
// router.delete('/orders/:voucherNo', customerOrderController.deleteOrderByVoucherNo);

export default router
