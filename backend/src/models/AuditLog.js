import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wedding',
      required: [true, 'Associated wedding ID is required'],
      index: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true
    },
    memoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memory',
      default: null
    },
    ip: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ weddingId: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
