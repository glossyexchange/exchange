import express from 'express'
import userControllers from '../controllers/userControllers'
import { authMiddleware } from '../middlewares/authMiddleware'
import { closeYearDoubleEntry } from '../services/year-end.service'
import { uploadAdminImage } from '../utils/multer'

const router = express.Router()

router.post(
  '/admin/create',
  uploadAdminImage.single('image'),
  userControllers.createAdmin
)
router.post('/admin-login', userControllers.admin_login)
router.put(
  '/update-admin/:id',
  authMiddleware,
  uploadAdminImage.single('image'),
  userControllers.updateAdmin
)
router.get('/admins', authMiddleware, userControllers.getAllAdmins)
router.get('/admin/:id',  authMiddleware,userControllers.getAdminById)
router.get('/get-user',  authMiddleware,userControllers.get_user_info)

router.put('/update-password/:userId', userControllers.updateAdminPassword)
router.delete(
  '/delete/admin/:userId',
  authMiddleware,
  userControllers.deleteAdmin
)

router.post('/test/close-year', async (req, res) => {
  try {
    const { oldYear, newYear } = req.body; 
    const SYSTEM_USER_ID = 1; 
    await closeYearDoubleEntry(oldYear, newYear, SYSTEM_USER_ID);
    res.json({ success: true, message: `Year ${oldYear} closed, opening entries for ${newYear} created.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router
