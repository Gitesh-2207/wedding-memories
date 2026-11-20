import { Wedding } from '../models/Wedding.js';
import { Memory } from '../models/Memory.js';
import { UploadReservation } from '../models/UploadReservation.js';
import { STORAGE_LIMITS, RESERVATION_STATUS, MEMORY_STATUS } from '../config/constants.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage Quota Service
 * Enforces exact 5 GiB quota, atomic reservations, and real-time reconciliation.
 */
export const storageQuotaService = {
  /**
   * Calculate current storage breakdown for a wedding
   */
  async getStorageUsage(weddingId) {
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      throw new Error('Wedding not found');
    }

    const now = new Date();

    // 1. Calculate used storage from completed memories
    const usedStorageAgg = await Memory.aggregate([
      {
        $match: {
          weddingId: wedding._id,
          uploadStatus: MEMORY_STATUS.COMPLETED
        }
      },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$fileSize' },
          totalCount: { $sum: 1 },
          photoCount: {
            $sum: { $cond: [{ $eq: ['$fileType', 'photo'] }, 1, 0] }
          },
          videoCount: {
            $sum: { $cond: [{ $eq: ['$fileType', 'video'] }, 1, 0] }
          }
        }
      }
    ]);

    const usedBytes = usedStorageAgg[0]?.totalBytes || 0;
    const totalCount = usedStorageAgg[0]?.totalCount || 0;
    const photoCount = usedStorageAgg[0]?.photoCount || 0;
    const videoCount = usedStorageAgg[0]?.videoCount || 0;

    // 2. Calculate reserved storage from active unexpired reservations
    const reservedStorageAgg = await UploadReservation.aggregate([
      {
        $match: {
          weddingId: wedding._id,
          status: RESERVATION_STATUS.PENDING,
          expiresAt: { $gt: now }
        }
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: '$reservedBytes' }
        }
      }
    ]);

    const reservedBytes = reservedStorageAgg[0]?.totalReserved || 0;
    const totalQuotaBytes = wedding.storageLimit || STORAGE_LIMITS.TOTAL_QUOTA_BYTES;
    const availableBytes = Math.max(0, totalQuotaBytes - usedBytes - reservedBytes);
    const percentageUsed = Math.min(100, Number(((usedBytes / totalQuotaBytes) * 100).toFixed(2)));

    // Unique guests count
    const uniqueGuestsAgg = await Memory.aggregate([
      {
        $match: {
          weddingId: wedding._id,
          uploadStatus: MEMORY_STATUS.COMPLETED
        }
      },
      {
        $group: {
          _id: { $toLower: '$guestName' }
        }
      },
      {
        $count: 'uniqueGuests'
      }
    ]);

    const uniqueGuests = uniqueGuestsAgg[0]?.uniqueGuests || 0;

    return {
      totalQuotaBytes,
      usedBytes,
      reservedBytes,
      availableBytes,
      percentageUsed,
      totalCount,
      photoCount,
      videoCount,
      uniqueGuests
    };
  },

  /**
   * Atomically reserve storage for incoming upload batch
   */
  async reserveStorage({ weddingId, files }) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('At least one file must be specified for upload reservation');
    }

    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      throw new Error('Wedding not found');
    }

    if (!wedding.uploadEnabled) {
      throw new Error('Guest uploads are currently paused for this wedding celebration');
    }

    // Validate each file individual size limit (against wedding custom limits or defaults)
    let totalRequestedBytes = 0;
    for (const file of files) {
      const isVideo = file.mimeType.startsWith('video/') || file.fileType === 'video';
      const minLimit = isVideo
        ? (wedding.minVideoBytes ?? STORAGE_LIMITS.MIN_VIDEO_BYTES)
        : (wedding.minPhotoBytes ?? STORAGE_LIMITS.MIN_PHOTO_BYTES);
      const maxLimit = isVideo
        ? (wedding.maxVideoBytes ?? STORAGE_LIMITS.MAX_VIDEO_BYTES)
        : (wedding.maxPhotoBytes ?? STORAGE_LIMITS.MAX_PHOTO_BYTES);

      const maxMiB = Math.round(maxLimit / (1024 * 1024));
      const typeLabel = isVideo ? `Video (max ${maxMiB} MiB)` : `Photo (max ${maxMiB} MiB)`;

      if (file.size < minLimit) {
        const minFormatted = minLimit >= 1024 * 1024
          ? `${(minLimit / (1024 * 1024)).toFixed(1)} MiB`
          : `${Math.round(minLimit / 1024)} KiB`;
        throw new Error(
          `File "${file.originalName || 'upload'}" is smaller than minimum required size of ${minFormatted} for ${isVideo ? 'Video' : 'Photo'}`
        );
      }

      if (file.size > maxLimit) {
        throw new Error(
          `File "${file.originalName || 'upload'}" of size ${(file.size / 1024 / 1024).toFixed(2)} MiB exceeds the allowed limit for ${typeLabel}`
        );
      }
      totalRequestedBytes += file.size;
    }

    // Atomic storage check
    const currentUsage = await this.getStorageUsage(weddingId);
    if (totalRequestedBytes > currentUsage.availableBytes) {
      throw new Error(
        `Insufficient storage quota. Required: ${(totalRequestedBytes / 1024 / 1024).toFixed(2)} MiB, Available: ${(currentUsage.availableBytes / 1024 / 1024).toFixed(2)} MiB`
      );
    }

    const expiresAt = new Date(Date.now() + STORAGE_LIMITS.RESERVATION_TTL_MS);
    const createdReservations = [];

    // Create reservation for each file
    for (const file of files) {
      const isVideo = file.mimeType.startsWith('video/') || file.fileType === 'video';
      const fileType = isVideo ? 'video' : 'photo';
      const randomUuid = uuidv4();
      const sanitizedExt = file.originalName ? file.originalName.split('.').pop().toLowerCase() : (isVideo ? 'mp4' : 'jpg');
      const objectKey = `wedding-${wedding._id}/${fileType}s/${randomUuid}.${sanitizedExt}`;

      const reservation = await UploadReservation.create({
        weddingId: wedding._id,
        objectKey,
        reservedBytes: file.size,
        status: RESERVATION_STATUS.PENDING,
        expiresAt
      });

      createdReservations.push({
        reservationId: reservation._id.toString(),
        objectKey: reservation.objectKey,
        reservedBytes: reservation.reservedBytes,
        expiresAt: reservation.expiresAt,
        originalName: file.originalName,
        fileType,
        mimeType: file.mimeType
      });
    }

    return {
      weddingId: wedding._id,
      reservations: createdReservations,
      expiresAt
    };
  },

  /**
   * Finalize reservation upon successful file verification & storage
   */
  async finalizeReservation(reservationId) {
    const reservation = await UploadReservation.findById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    reservation.status = RESERVATION_STATUS.COMPLETED;
    await reservation.save();
    return reservation;
  },

  /**
   * Release reservation if upload fails or is canceled
   */
  async releaseReservation(reservationId) {
    const reservation = await UploadReservation.findById(reservationId);
    if (reservation && reservation.status === RESERVATION_STATUS.PENDING) {
      reservation.status = RESERVATION_STATUS.FAILED;
      await reservation.save();
    }
  },

  /**
   * Clean up expired reservations
   */
  async reconcileExpiredReservations() {
    const now = new Date();
    await UploadReservation.updateMany(
      {
        status: RESERVATION_STATUS.PENDING,
        expiresAt: { $lte: now }
      },
      {
        $set: { status: RESERVATION_STATUS.EXPIRED }
      }
    );
  }
};
