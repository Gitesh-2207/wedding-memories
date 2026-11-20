import { Wedding } from '../models/Wedding.js';
import { Memory } from '../models/Memory.js';
import { UploadReservation } from '../models/UploadReservation.js';
import { AuditLog } from '../models/AuditLog.js';
import { storageQuotaService } from '../services/storageQuotaService.js';
import { uploadObject, deleteObject } from '../config/r2.js';
import { validateFileSignature } from '../utils/fileSignatureValidator.js';
import { uploadSessionSchema } from '../validators/uploadValidators.js';
import { MEMORY_STATUS, RESERVATION_STATUS } from '../config/constants.js';

export const uploadController = {
  /**
   * Public: Get wedding info for guest upload page
   */
  async getWeddingBySlug(req, res) {
    try {
      const { slug } = req.params;
      const wedding = await Wedding.findOne({ uploadSlug: slug.toLowerCase() }).select(
        'brideName groomName weddingDate uploadSlug uploadEnabled welcomeMessage minPhotoBytes maxPhotoBytes minVideoBytes maxVideoBytes'
      );

      if (!wedding) {
        return res.status(404).json({
          success: false,
          error: 'Wedding celebration not found. Please verify the URL or QR code.'
        });
      }

      return res.json({
        success: true,
        wedding
      });
    } catch (error) {
      console.error('Error fetching wedding details:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve wedding details'
      });
    }
  },

  /**
   * Public: Create upload session with atomic storage quota reservation
   * POST /api/upload/session
   */
  async createUploadSession(req, res) {
    try {
      const validation = uploadSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid session request payload'
        });
      }

      const { slug, files } = validation.data;

      const wedding = await Wedding.findOne({ uploadSlug: slug });
      if (!wedding) {
        return res.status(404).json({
          success: false,
          error: 'Wedding celebration not found'
        });
      }

      if (!wedding.uploadEnabled) {
        return res.status(403).json({
          success: false,
          error: 'The couple has temporarily disabled new photo and video uploads.'
        });
      }

      // Atomically reserve quota
      const reservationData = await storageQuotaService.reserveStorage({
        weddingId: wedding._id,
        files
      });

      return res.status(201).json({
        success: true,
        wedding: {
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          weddingDate: wedding.weddingDate,
          uploadSlug: wedding.uploadSlug
        },
        reservations: reservationData.reservations,
        expiresAt: reservationData.expiresAt
      });
    } catch (error) {
      console.error('Error creating upload session:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message || 'Unable to reserve upload capacity'
      });
    }
  },

  /**
   * Public: Upload a verified file with atomic reservation finalization
   * POST /api/upload
   */
  async uploadFile(req, res) {
    const { reservationId, guestName, caption } = req.body;
    const file = req.file;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing upload reservation ID'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    let reservation = null;

    try {
      // 1. Fetch and validate reservation
      reservation = await UploadReservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Upload reservation not found or has expired'
        });
      }

      if (reservation.status !== RESERVATION_STATUS.PENDING) {
        return res.status(409).json({
          success: false,
          error: `Reservation already ${reservation.status.toLowerCase()}. Cannot reuse reservation.`
        });
      }

      if (new Date() > new Date(reservation.expiresAt)) {
        await storageQuotaService.releaseReservation(reservation._id);
        return res.status(410).json({
          success: false,
          error: 'Upload session reservation has expired. Please initiate a new upload.'
        });
      }

      // 2. Validate file size does not exceed reserved bytes
      if (file.size > reservation.reservedBytes) {
        await storageQuotaService.releaseReservation(reservation._id);
        return res.status(400).json({
          success: false,
          error: `Uploaded file size (${file.size} bytes) exceeds initial reserved allocation (${reservation.reservedBytes} bytes).`
        });
      }

      // 3. Inspect binary magic numbers / file signatures (never trust client headers)
      const sigCheck = await validateFileSignature(file.buffer, file.originalname, file.mimetype);
      if (!sigCheck.isValid) {
        await storageQuotaService.releaseReservation(reservation._id);
        return res.status(415).json({
          success: false,
          error: sigCheck.error
        });
      }

      // Check file size against current wedding thresholds
      const wedding = await Wedding.findById(reservation.weddingId);
      if (wedding) {
        const isVideo = sigCheck.fileType === 'video';
        const minLimit = isVideo
          ? (wedding.minVideoBytes ?? STORAGE_LIMITS.MIN_VIDEO_BYTES)
          : (wedding.minPhotoBytes ?? STORAGE_LIMITS.MIN_PHOTO_BYTES);
        const maxLimit = isVideo
          ? (wedding.maxVideoBytes ?? STORAGE_LIMITS.MAX_VIDEO_BYTES)
          : (wedding.maxPhotoBytes ?? STORAGE_LIMITS.MAX_PHOTO_BYTES);

        if (file.size < minLimit || file.size > maxLimit) {
          await storageQuotaService.releaseReservation(reservation._id);
          return res.status(400).json({
            success: false,
            error: `File size does not satisfy current wedding thresholds (${minLimit} to ${maxLimit} bytes).`
          });
        }
      }

      // 4. Stream/store into Cloudflare R2 / secure private storage
      const uploadResult = await uploadObject({
        key: reservation.objectKey,
        buffer: file.buffer,
        contentType: sigCheck.detectedMime,
        metadata: {
          weddingId: reservation.weddingId.toString(),
          reservationId: reservation._id.toString(),
          originalName: encodeURIComponent(file.originalname || 'memory')
        }
      });

      // 5. Create Memory record in MongoDB
      const memory = await Memory.create({
        weddingId: reservation.weddingId,
        guestName: (guestName || 'Royal Guest').trim().substring(0, 100),
        caption: (caption || '').trim().substring(0, 1000),
        fileName: file.originalname || `${reservation.objectKey.split('/').pop()}`,
        fileKey: reservation.objectKey,
        fileUrl: uploadResult?.url || '',
        fileType: sigCheck.fileType,
        mimeType: sigCheck.detectedMime,
        fileSize: file.size,
        uploadStatus: MEMORY_STATUS.COMPLETED,
        uploadedAt: new Date()
      });

      // 6. Finalize reservation
      await storageQuotaService.finalizeReservation(reservation._id);

      // 7. Audit Log
      await AuditLog.create({
        weddingId: reservation.weddingId,
        action: 'GUEST_UPLOAD_COMPLETED',
        memoryId: memory._id,
        ip: req.ip || '',
        details: {
          guestName: memory.guestName,
          fileType: memory.fileType,
          fileSize: memory.fileSize,
          fileKey: memory.fileKey
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Your memory has been safely shared with the couple!',
        memory: {
          id: memory._id,
          guestName: memory.guestName,
          caption: memory.caption,
          fileName: memory.fileName,
          fileType: memory.fileType,
          fileSize: memory.fileSize,
          uploadedAt: memory.uploadedAt
        }
      });
    } catch (error) {
      console.error('Error handling file upload:', error);

      // Clean up on failure: release reservation and remove any partial object
      if (reservation) {
        await storageQuotaService.releaseReservation(reservation._id).catch(() => {});
        await deleteObject(reservation.objectKey).catch(() => {});
      }

      return res.status(500).json({
        success: false,
        error: error.message || 'An unexpected error occurred while processing your upload. Please try again.'
      });
    }
  },

  /**
   * Public: Check status of an upload
   * GET /api/upload/status/:id
   */
  async getUploadStatus(req, res) {
    try {
      const { id } = req.params;

      const memory = await Memory.findById(id).select('guestName caption fileName fileType fileSize uploadStatus uploadedAt');
      if (memory) {
        return res.json({
          success: true,
          status: memory.uploadStatus,
          memory
        });
      }

      const reservation = await UploadReservation.findById(id);
      if (reservation) {
        return res.json({
          success: true,
          status: reservation.status,
          expiresAt: reservation.expiresAt
        });
      }

      return res.status(404).json({
        success: false,
        error: 'Upload record not found'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve upload status'
      });
    }
  }
};
