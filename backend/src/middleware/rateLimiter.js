import rateLimit from 'express-rate-limit';

export const uploadSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many upload sessions initiated from this IP. Please wait a few moments before trying again.'
  }
});

export const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload rate limit reached. Please wait a moment before uploading more memories.'
  }
});

export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. For security reasons, please try again in 15 minutes.'
  }
});
