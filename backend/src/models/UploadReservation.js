import mongoose from 'mongoose';
import { RESERVATION_STATUS } from '../config/constants.js';

const uploadReservationSchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wedding',
      required: [true, 'Wedding ID is required'],
      index: true
    },
    objectKey: {
      type: String,
      required: [true, 'Object key is required'],
      unique: true,
      trim: true
    },
    reservedBytes: {
      type: Number,
      required: [true, 'Reserved bytes count is required'],
      min: [1, 'Reserved bytes must be greater than 0']
    },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.PENDING,
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
      index: { expires: 0 } // MongoDB TTL index to auto-cleanup expired reservations
    }
  },
  {
    timestamps: true
  }
);

uploadReservationSchema.index({ weddingId: 1, status: 1, expiresAt: 1 });

export const UploadReservation = mongoose.model('UploadReservation', uploadReservationSchema);
