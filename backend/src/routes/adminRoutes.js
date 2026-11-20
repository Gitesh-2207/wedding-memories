import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Authentication endpoints
router.post('/login', adminLoginLimiter, adminController.login);
router.post('/logout', adminController.logout);

// Protected Admin Endpoints
router.use(requireAdminAuth);

router.get('/me', adminController.getMe);
router.get('/dashboard', adminController.getDashboard);
router.get('/memories', adminController.getMemories);
router.get('/memories/:id', adminController.getMemoryById);
router.get('/memories/:id/download', adminController.downloadMemory);
router.get('/memories/:id/stream', adminController.streamMemory);
router.delete('/memories/:id', adminController.deleteMemory);
router.patch('/wedding/settings', adminController.updateSettings);
router.patch('/change-password', adminController.changePassword);
router.get('/storage', adminController.getStorage);
router.get('/qr-code', adminController.getQrCode);

export default router;
