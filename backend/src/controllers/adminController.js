import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { Admin } from '../models/Admin.js';
import { Wedding } from '../models/Wedding.js';
import { Memory } from '../models/Memory.js';
import { AuditLog } from '../models/AuditLog.js';
import { storageQuotaService } from '../services/storageQuotaService.js';
import { deleteObject, getObjectStream, generatePresignedDownloadUrl, isR2Configured } from '../config/r2.js';
import { adminLoginSchema, updateWeddingSettingsSchema } from '../validators/uploadValidators.js';
import { MEMORY_STATUS } from '../config/constants.js';

export const adminController = {
  /**
   * POST /api/admin/login
   */
  async login(req, res) {
    try {
      const validation = adminLoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid login credentials'
        });
      }

      const { email, password } = validation.data;
      const admin = await Admin.findOne({ email }).populate('weddingId');

      if (!admin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      const jwtSecret = process.env.JWT_SECRET || 'royal_wedding_memories_secure_jwt_secret_dev_2026';
      const token = jwt.sign(
        {
          adminId: admin._id,
          weddingId: admin.weddingId._id,
          role: admin.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Set secure HTTP-only cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Audit log
      await AuditLog.create({
        weddingId: admin.weddingId._id,
        adminId: admin._id,
        action: 'ADMIN_LOGIN',
        ip: req.ip || '',
        details: { email: admin.email }
      });

      return res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        },
        wedding: {
          id: admin.weddingId._id,
          brideName: admin.weddingId.brideName,
          groomName: admin.weddingId.groomName,
          weddingDate: admin.weddingId.weddingDate,
          uploadSlug: admin.weddingId.uploadSlug,
          uploadEnabled: admin.weddingId.uploadEnabled,
          welcomeMessage: admin.weddingId.welcomeMessage
        }
      });
    } catch (error) {
      console.error('Error during admin login:', error);
      return res.status(500).json({
        success: false,
        error: 'Login failed due to an internal server error'
      });
    }
  },

  /**
   * POST /api/admin/logout
   */
  async logout(req, res) {
    res.clearCookie('admin_token');
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  },

  /**
   * GET /api/admin/me
   */
  async getMe(req, res) {
    try {
      const admin = await Admin.findById(req.admin._id).populate('weddingId');
      return res.json({
        success: true,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        },
        wedding: admin.weddingId
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve admin details'
      });
    }
  },

  /**
   * GET /api/admin/dashboard
   */
  async getDashboard(req, res) {
    try {
      const weddingId = req.weddingId;
      const storageStats = await storageQuotaService.getStorageUsage(weddingId);

      const recentMemories = await Memory.find({
        weddingId,
        uploadStatus: MEMORY_STATUS.COMPLETED
      })
        .sort({ uploadedAt: -1 })
        .limit(6)
        .select('guestName caption fileName fileType fileSize uploadedAt fileKey fileUrl');

      const wedding = await Wedding.findById(weddingId);

      return res.json({
        success: true,
        wedding: {
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          weddingDate: wedding.weddingDate,
          uploadSlug: wedding.uploadSlug,
          uploadEnabled: wedding.uploadEnabled,
          welcomeMessage: wedding.welcomeMessage,
          minPhotoBytes: wedding.minPhotoBytes ?? 10240,
          maxPhotoBytes: wedding.maxPhotoBytes ?? (15 * 1024 * 1024),
          minVideoBytes: wedding.minVideoBytes ?? 51200,
          maxVideoBytes: wedding.maxVideoBytes ?? (30 * 1024 * 1024)
        },
        statistics: {
          totalMemories: storageStats.totalCount,
          totalPhotos: storageStats.photoCount,
          totalVideos: storageStats.videoCount,
          usedBytes: storageStats.usedBytes,
          reservedBytes: storageStats.reservedBytes,
          availableBytes: storageStats.availableBytes,
          totalQuotaBytes: storageStats.totalQuotaBytes,
          percentageUsed: storageStats.percentageUsed,
          uniqueGuests: storageStats.uniqueGuests
        },
        recentMemories
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load dashboard data'
      });
    }
  },

  /**
   * GET /api/admin/memories
   * Paginated with filtering by type, date, search
   */
  async getMemories(req, res) {
    try {
      const weddingId = req.weddingId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const { type, search, startDate, endDate, sort } = req.query;

      const query = {
        weddingId,
        uploadStatus: MEMORY_STATUS.COMPLETED
      };

      if (type && ['photo', 'video'].includes(type)) {
        query.fileType = type;
      }

      if (search) {
        query.$or = [
          { guestName: { $regex: search, $options: 'i' } },
          { caption: { $regex: search, $options: 'i' } },
          { fileName: { $regex: search, $options: 'i' } }
        ];
      }

      if (startDate || endDate) {
        query.uploadedAt = {};
        if (startDate) query.uploadedAt.$gte = new Date(startDate);
        if (endDate) query.uploadedAt.$lte = new Date(endDate);
      }

      const sortOption = sort === 'oldest' ? { uploadedAt: 1 } : { uploadedAt: -1 };

      const totalItems = await Memory.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      const memories = await Memory.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('guestName caption fileName fileKey fileType mimeType fileSize uploadedAt fileUrl');

      return res.json({
        success: true,
        memories,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching memories:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch gallery memories'
      });
    }
  },

  /**
   * GET /api/admin/memories/:id
   */
  async getMemoryById(req, res) {
    try {
      const memory = await Memory.findOne({
        _id: req.params.id,
        weddingId: req.weddingId
      });

      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found'
        });
      }

      return res.json({
        success: true,
        memory
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error loading memory details'
      });
    }
  },

  /**
   * GET /api/admin/memories/:id/stream
   * Authorized secure file streaming for inline playback / preview
   * Guarantees R2 bucket remains 100% private.
   */
  async streamMemory(req, res) {
    try {
      const memory = await Memory.findOne({
        _id: req.params.id,
        weddingId: req.weddingId
      });

      if (!memory) {
        return res.status(404).json({ success: false, error: 'Memory not found' });
      }

      if (memory.fileUrl) {
        return res.redirect(memory.fileUrl);
      }

      const media = await getObjectStream(memory.fileKey);

      if (media.redirectUrl) {
        return res.redirect(media.redirectUrl);
      }

      res.setHeader('Content-Type', media.contentType || memory.mimeType);
      if (media.contentLength) {
        res.setHeader('Content-Length', media.contentLength);
      }
      res.setHeader('Cache-Control', 'private, max-age=3600');

      media.stream.pipe(res);
    } catch (error) {
      console.error('Error streaming memory:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to stream memory media'
      });
    }
  },

  /**
   * GET /api/admin/memories/:id/download
   * Authorized download with Content-Disposition
   */
  async downloadMemory(req, res) {
    try {
      const memory = await Memory.findOne({
        _id: req.params.id,
        weddingId: req.weddingId
      });

      if (!memory) {
        return res.status(404).json({ success: false, error: 'Memory not found' });
      }

      const presignedUrl = await generatePresignedDownloadUrl(memory.fileKey, 300);
      if (presignedUrl) {
        return res.redirect(presignedUrl);
      }

      // Stream directly as download attachment
      const media = await getObjectStream(memory.fileKey);
      if (media.redirectUrl) {
        return res.redirect(media.redirectUrl);
      }

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(memory.fileName)}"`);
      res.setHeader('Content-Type', media.contentType || memory.mimeType);
      media.stream.pipe(res);
    } catch (error) {
      console.error('Error downloading memory:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to download memory'
      });
    }
  },

  /**
   * DELETE /api/admin/memories/:id
   * Removes from DB, deletes R2 object, recovers quota atomically
   */
  async deleteMemory(req, res) {
    try {
      const memory = await Memory.findOne({
        _id: req.params.id,
        weddingId: req.weddingId
      });

      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found or does not belong to this wedding'
        });
      }

      // 1. Delete object from storage (R2)
      await deleteObject(memory.fileKey);

      // 2. Delete database record
      await Memory.findByIdAndDelete(memory._id);

      // 3. Log audit action
      await AuditLog.create({
        weddingId: req.weddingId,
        adminId: req.admin._id,
        action: 'MEMORY_DELETED',
        ip: req.ip || '',
        details: {
          memoryId: memory._id,
          fileName: memory.fileName,
          fileKey: memory.fileKey,
          freedBytes: memory.fileSize
        }
      });

      // 4. Fetch updated storage stats
      const updatedStats = await storageQuotaService.getStorageUsage(req.weddingId);

      return res.json({
        success: true,
        message: 'Memory successfully deleted and storage quota recovered.',
        freedBytes: memory.fileSize,
        storageStats: updatedStats
      });
    } catch (error) {
      console.error('Error deleting memory:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete memory'
      });
    }
  },

  /**
   * PATCH /api/admin/wedding/settings
   */
  async updateSettings(req, res) {
    try {
      const validation = updateWeddingSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid settings data'
        });
      }

      const wedding = await Wedding.findById(req.weddingId);
      if (!wedding) {
        return res.status(404).json({
          success: false,
          error: 'Wedding not found'
        });
      }

      const updates = validation.data;
      if (updates.brideName) wedding.brideName = updates.brideName;
      if (updates.groomName) wedding.groomName = updates.groomName;
      if (updates.weddingDate) wedding.weddingDate = new Date(updates.weddingDate);
      if (updates.welcomeMessage !== undefined) wedding.welcomeMessage = updates.welcomeMessage;
      if (updates.uploadEnabled !== undefined) wedding.uploadEnabled = updates.uploadEnabled;
      if (updates.minPhotoBytes !== undefined) wedding.minPhotoBytes = updates.minPhotoBytes;
      if (updates.maxPhotoBytes !== undefined) wedding.maxPhotoBytes = updates.maxPhotoBytes;
      if (updates.minVideoBytes !== undefined) wedding.minVideoBytes = updates.minVideoBytes;
      if (updates.maxVideoBytes !== undefined) wedding.maxVideoBytes = updates.maxVideoBytes;

      await wedding.save();

      await AuditLog.create({
        weddingId: wedding._id,
        adminId: req.admin._id,
        action: 'SETTINGS_UPDATED',
        ip: req.ip || '',
        details: updates
      });

      return res.json({
        success: true,
        message: 'Wedding settings updated successfully',
        wedding
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update wedding settings'
      });
    }
  },

  /**
   * GET /api/admin/storage
   */
  async getStorage(req, res) {
    try {
      const stats = await storageQuotaService.getStorageUsage(req.weddingId);
      return res.json({
        success: true,
        storage: stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve storage statistics'
      });
    }
  },

  /**
   * PATCH /api/admin/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      const admin = await Admin.findById(req.admin._id);
      if (!admin) {
        return res.status(404).json({ success: false, error: 'Admin account not found' });
      }

      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      const salt = await bcrypt.genSalt(12);
      admin.passwordHash = await bcrypt.hash(newPassword, salt);
      await admin.save();

      await AuditLog.create({
        weddingId: req.weddingId,
        adminId: admin._id,
        action: 'ADMIN_PASSWORD_CHANGED',
        ip: req.ip || '',
        details: { email: admin.email }
      });

      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  },

  /**
   * GET /api/admin/qr-code
   * Generates downloadable PNG QR code for guest upload page
   */
  async getQrCode(req, res) {
    try {
      const wedding = await Wedding.findById(req.weddingId);
      if (!wedding) {
        return res.status(404).json({ success: false, error: 'Wedding not found' });
      }

      const domain = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      const uploadUrl = `${domain}/upload/${wedding.uploadSlug}`;

      // Generate Data URL and PNG buffer
      const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#45372E', // Dark Brown from palette
          light: '#F8F3E9' // Ivory from palette
        },
        width: 600
      });

      return res.json({
        success: true,
        uploadUrl,
        uploadSlug: wedding.uploadSlug,
        qrCodeDataUrl: qrDataUrl
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate QR code'
      });
    }
  }
};
