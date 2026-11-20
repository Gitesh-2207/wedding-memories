import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wedding',
      required: [true, 'Associated wedding ID is required']
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin'
    }
  },
  {
    timestamps: true
  }
);

adminSchema.index({ weddingId: 1 });

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const Admin = mongoose.model('Admin', adminSchema);
