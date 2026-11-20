import { z } from 'zod';
import { STORAGE_LIMITS, ALL_ALLOWED_MIME_TYPES } from '../config/constants.js';

export const uploadSessionSchema = z.object({
  slug: z.string().min(1, 'Wedding slug is required').trim().toLowerCase(),
  turnstileToken: z.string().optional(),
  files: z
    .array(
      z.object({
        originalName: z.string().min(1, 'File name is required'),
        mimeType: z
          .string()
          .refine((val) => ALL_ALLOWED_MIME_TYPES.includes(val), {
            message: 'Unsupported MIME type. Allowed: JPEG, PNG, WebP, MP4, WebM'
          }),
        size: z
          .number()
          .positive('File size must be positive')
          .max(STORAGE_LIMITS.HARD_MAX_FILE_BYTES || 100 * 1024 * 1024, 'Individual file size exceeds maximum ceiling')
      })
    )
    .min(1, 'At least one file must be specified in the session')
});

export const updateWeddingSettingsSchema = z.object({
  brideName: z.string().min(1, "Bride's name is required").max(100).optional(),
  groomName: z.string().min(1, "Groom's name is required").max(100).optional(),
  weddingDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid wedding date'
  }).optional(),
  welcomeMessage: z.string().max(1000).optional(),
  uploadEnabled: z.boolean().optional(),
  minPhotoBytes: z.number().min(0).max(STORAGE_LIMITS.HARD_MAX_FILE_BYTES).optional(),
  maxPhotoBytes: z.number().min(1024).max(STORAGE_LIMITS.HARD_MAX_FILE_BYTES).optional(),
  minVideoBytes: z.number().min(0).max(STORAGE_LIMITS.HARD_MAX_FILE_BYTES).optional(),
  maxVideoBytes: z.number().min(1024).max(STORAGE_LIMITS.HARD_MAX_FILE_BYTES).optional()
}).refine(
  (data) => {
    if (data.minPhotoBytes !== undefined && data.maxPhotoBytes !== undefined) {
      return data.minPhotoBytes <= data.maxPhotoBytes;
    }
    return true;
  },
  {
    message: 'Minimum photo size cannot exceed maximum photo size',
    path: ['minPhotoBytes']
  }
).refine(
  (data) => {
    if (data.minVideoBytes !== undefined && data.maxVideoBytes !== undefined) {
      return data.minVideoBytes <= data.maxVideoBytes;
    }
    return true;
  },
  {
    message: 'Minimum video size cannot exceed maximum video size',
    path: ['minVideoBytes']
  }
);

export const adminLoginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
