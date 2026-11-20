import mongoose from 'mongoose';
import { MEMORY_STATUS } from '../config/constants.js';

const memorySchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wedding',
      required: [true, 'Associated wedding ID is required'],
      index: true
    },
    guestName: {
      type: String,
      trim: true,
      maxlength: [100, 'Guest name cannot exceed 100 characters'],
      default: 'Royal Guest'
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [1000, 'Caption cannot exceed 1000 characters'],
      default: ''
    },
    fileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    fileKey: {
      type: String,
      required: [true, 'Storage object key is required'],
      unique: true,
      trim: true
    },
    fileUrl: {
      type: String,
      default: '',
      trim: true
    },
    fileType: {
      type: String,
      enum: ['photo', 'video'],
      required: [true, 'File type (photo/video) is required']
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required']
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [1, 'File size must be greater than 0']
    },
    uploadStatus: {
      type: String,
      enum: Object.values(MEMORY_STATUS),
      default: MEMORY_STATUS.PENDING,
      index: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

memorySchema.index({ weddingId: 1, uploadStatus: 1, fileType: 1, uploadedAt: -1 });

export const Memory = mongoose.model('Memory', memorySchema);
