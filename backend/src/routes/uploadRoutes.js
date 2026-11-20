import express from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/uploadController.js';
import { uploadSessionLimiter, fileUploadLimiter } from '../middleware/rateLimiter.js';
import { verifyTurnstileToken } from '../middleware/turnstileMiddleware.js';
import { STORAGE_LIMITS } from '../config/constants.js';

const router = express.Router();

// Configure Multer for in-memory processing with safe ceiling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: STORAGE_LIMITS.HARD_MAX_FILE_BYTES || 100 * 1024 * 1024 // 100 MiB upper safety ceiling
  }
});

// Public: Get wedding info for guest upload page
router.get('/wedding/:slug', uploadController.getWeddingBySlug);

// Public: Initiate upload session and reserve quota
router.post(
  '/session',
  uploadSessionLimiter,
  verifyTurnstileToken,
  uploadController.createUploadSession
);

// Public: Upload file with reservation verification
router.post(
  '/',
  fileUploadLimiter,
  upload.single('file'),
  uploadController.uploadFile
);

// Public: Query upload status
router.get('/status/:id', uploadController.getUploadStatus);

export default router;
