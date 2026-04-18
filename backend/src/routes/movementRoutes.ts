import express from 'express';
import movementController from '../controllers/movementController';


const router = express.Router()

// router.post('/create/movement', movementController.createMovement)
// router.put('/movements/:voucherNo', movementController.updateMovement)
router.get('/movements', movementController.getMovementsByAccount)
// router.get('/accounts/balances', movementController.getAccountBalance);
router.get('/general-balance', movementController.getGeneralBalance);
// router.delete('/movements/:voucherNo', movementController.deleteMovement)


export default router
