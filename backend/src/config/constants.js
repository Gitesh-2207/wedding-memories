/**
 * Storage & Application Constants
 * Royal Wedding Memories
 */

export const STORAGE_LIMITS = {
  // Exactly 5 GiB in bytes: 5 * 1024 * 1024 * 1024
  TOTAL_QUOTA_BYTES: 5368709120,
  
  // Default Minimum individual photo size: 10 KiB (10,240 bytes)
  MIN_PHOTO_BYTES: 10 * 1024,

  // Default Maximum individual photo size: 15 MiB (15,728,640 bytes)
  MAX_PHOTO_BYTES: 15 * 1024 * 1024,
  
  // Default Minimum individual video size: 50 KiB (51,200 bytes)
  MIN_VIDEO_BYTES: 50 * 1024,

  // Default Maximum individual video size: 30 MiB (31,457,280 bytes)
  MAX_VIDEO_BYTES: 30 * 1024 * 1024,

  // Hard safety ceiling across storage providers: 100 MiB
  HARD_MAX_FILE_BYTES: 100 * 1024 * 1024,
  
  // Reservation lock expiration window: 15 minutes
  RESERVATION_TTL_SECONDS: 15 * 60,
  RESERVATION_TTL_MS: 15 * 60 * 1000
};

export const ALLOWED_FILE_TYPES = {
  PHOTO: {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  VIDEO: {
    extensions: ['.mp4', '.webm'],
    mimeTypes: ['video/mp4', 'video/webm']
  }
};

export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_FILE_TYPES.PHOTO.mimeTypes,
  ...ALLOWED_FILE_TYPES.VIDEO.mimeTypes
];

export const RESERVATION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED'
};

export const MEMORY_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};
