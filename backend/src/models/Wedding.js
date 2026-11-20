import mongoose from 'mongoose';
import { STORAGE_LIMITS } from '../config/constants.js';

const weddingSchema = new mongoose.Schema(
  {
    brideName: {
      type: String,
      required: [true, "Bride's name is required"],
      trim: true,
      maxlength: [100, "Bride's name cannot exceed 100 characters"]
    },
    groomName: {
      type: String,
      required: [true, "Groom's name is required"],
      trim: true,
      maxlength: [100, "Groom's name cannot exceed 100 characters"]
    },
    weddingDate: {
      type: Date,
      required: [true, 'Wedding date is required']
    },
    uploadSlug: {
      type: String,
      required: [true, 'Upload slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens']
    },
    uploadEnabled: {
      type: Boolean,
      default: true
    },
    storageLimit: {
      type: Number,
      default: STORAGE_LIMITS.TOTAL_QUOTA_BYTES, // Exactly 5,368,709,120 bytes
      min: [0, 'Storage limit cannot be negative']
    },
    minPhotoBytes: {
      type: Number,
      default: STORAGE_LIMITS.MIN_PHOTO_BYTES || 10240,
      min: [0, 'Minimum photo size cannot be negative']
    },
    maxPhotoBytes: {
      type: Number,
      default: STORAGE_LIMITS.MAX_PHOTO_BYTES,
      min: [1024, 'Maximum photo size must be at least 1 KB']
    },
    minVideoBytes: {
      type: Number,
      default: STORAGE_LIMITS.MIN_VIDEO_BYTES || 51200,
      min: [0, 'Minimum video size cannot be negative']
    },
    maxVideoBytes: {
      type: Number,
      default: STORAGE_LIMITS.MAX_VIDEO_BYTES,
      min: [1024, 'Maximum video size must be at least 1 KB']
    },
    welcomeMessage: {
      type: String,
      default: 'Welcome to our royal wedding celebration! Please share your favorite moments with us.'
    }
  },
  {
    timestamps: true
  }
);

weddingSchema.index({ createdAt: -1 });

export const Wedding = mongoose.model('Wedding', weddingSchema);
