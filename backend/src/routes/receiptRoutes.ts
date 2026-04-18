import express from 'express';
import ReceiptControllers from '../controllers/receiptController';

// import { authMiddleware } from '../middlewares/authMiddleware'


const router = express.Router()

router.post('/create/receipt',  ReceiptControllers.createReceipt)
router.get('/receipt', ReceiptControllers.getReceipt);              
router.get('/receipts', ReceiptControllers.getAllReceipts);        
// router.post('/create/receipt', ReceiptControllers.createReceipt);   
router.put('/update/receipt/:voucherNo', ReceiptControllers.updateReceipt); 
router.delete('/delete/receipt', ReceiptControllers.deleteReceipt);


export default router
