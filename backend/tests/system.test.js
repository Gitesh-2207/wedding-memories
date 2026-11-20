import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Wedding } from '../src/models/Wedding.js';
import { Admin } from '../src/models/Admin.js';
import { Memory } from '../src/models/Memory.js';
import { UploadReservation } from '../src/models/UploadReservation.js';
import { storageQuotaService } from '../src/services/storageQuotaService.js';
import { validateFileSignature } from '../src/utils/fileSignatureValidator.js';
import { STORAGE_LIMITS, RESERVATION_STATUS, MEMORY_STATUS } from '../src/config/constants.js';

let mongoServer;
let testWedding;
let testAdmin;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test wedding
  testWedding = await Wedding.create({
    brideName: 'Aadhya',
    groomName: 'Kabir',
    weddingDate: new Date('2026-12-18'),
    uploadSlug: 'aadhya-kabir-test',
    uploadEnabled: true,
    storageLimit: STORAGE_LIMITS.TOTAL_QUOTA_BYTES // 5 GiB
  });

  // Create test admin
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('RoyalPassword2026!', salt);

  testAdmin = await Admin.create({
    email: 'admin@royaltest.com',
    passwordHash,
    weddingId: testWedding._id,
    role: 'admin'
  });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('1. Admin Authentication & Password Hashing Verification', async () => {
  const admin = await Admin.findOne({ email: 'admin@royaltest.com' });
  assert.ok(admin, 'Admin should exist');

  const validMatch = await admin.comparePassword('RoyalPassword2026!');
  assert.equal(validMatch, true, 'Valid password must match');

  const invalidMatch = await admin.comparePassword('WrongPassword');
  assert.equal(invalidMatch, false, 'Invalid password must be rejected');
});

test('2. File Signature Verification (Spoofed Extension & MIME Detection)', async () => {
  // A. Genuine JPEG Buffer
  const genuineJpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
  ]);
  const jpegResult = await validateFileSignature(genuineJpeg, 'photo.jpg', 'image/jpeg');
  assert.equal(jpegResult.isValid, true);
  assert.equal(jpegResult.fileType, 'photo');
  assert.equal(jpegResult.detectedMime, 'image/jpeg');

  // B. Genuine PNG Buffer
  const genuinePng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  const pngResult = await validateFileSignature(genuinePng, 'memory.png', 'image/png');
  assert.equal(pngResult.isValid, true);
  assert.equal(pngResult.fileType, 'photo');
  assert.equal(pngResult.detectedMime, 'image/png');

  // C. Spoofed Text file disguised as JPG (Should Fail)
  const spoofedBuffer = Buffer.from('console.log("malicious code disguised as image");');
  const spoofResult = await validateFileSignature(spoofedBuffer, 'malicious.jpg', 'image/jpeg');
  assert.equal(spoofResult.isValid, false, 'Spoofed file signature must be rejected');
});

test('3. Atomic Storage Quota Reservation & Enforced Limits', async () => {
  const initialUsage = await storageQuotaService.getStorageUsage(testWedding._id);
  assert.equal(initialUsage.totalQuotaBytes, 5368709120, 'Total quota must be exactly 5 GiB');
  assert.equal(initialUsage.usedBytes, 0);

  // A. Reject individual photo exceeding 15 MiB
  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'huge.jpg', mimeType: 'image/jpeg', size: 16 * 1024 * 1024 }]
      });
    },
    /exceeds the allowed limit for Photo \(max 15 MiB\)/
  );

  // B. Reject individual video exceeding 30 MiB
  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'huge.mp4', mimeType: 'video/mp4', size: 32 * 1024 * 1024 }]
      });
    },
    /exceeds the allowed limit for Video \(max 30 MiB\)/
  );

  // C. Successful atomic reservation of 10 MiB photo
  const photoSize = 10 * 1024 * 1024;
  const reserveResult = await storageQuotaService.reserveStorage({
    weddingId: testWedding._id,
    files: [{ originalName: 'blessings.jpg', mimeType: 'image/jpeg', size: photoSize }]
  });

  assert.equal(reserveResult.reservations.length, 1);
  const resId = reserveResult.reservations[0].reservationId;

  // Verify reserved bytes are deducted from available bytes immediately
  const reservedUsage = await storageQuotaService.getStorageUsage(testWedding._id);
  assert.equal(reservedUsage.reservedBytes, photoSize);
  assert.equal(reservedUsage.availableBytes, 5368709120 - photoSize);

  // D. Finalize reservation when upload completes
  await storageQuotaService.finalizeReservation(resId);
  await Memory.create({
    weddingId: testWedding._id,
    guestName: 'Grandma Sita',
    caption: 'God bless the newly weds!',
    fileName: 'blessings.jpg',
    fileKey: reserveResult.reservations[0].objectKey,
    fileType: 'photo',
    mimeType: 'image/jpeg',
    fileSize: photoSize,
    uploadStatus: MEMORY_STATUS.COMPLETED
  });

  const completedUsage = await storageQuotaService.getStorageUsage(testWedding._id);
  assert.equal(completedUsage.usedBytes, photoSize);
  assert.equal(completedUsage.reservedBytes, 0);
  assert.equal(completedUsage.totalCount, 1);
  assert.equal(completedUsage.uniqueGuests, 1);
});

test('4. Safe Quota Recovery on Failed Upload or Memory Deletion', async () => {
  // A. Reserve storage for a temporary upload
  const tempSize = 5 * 1024 * 1024;
  const tempReservation = await storageQuotaService.reserveStorage({
    weddingId: testWedding._id,
    files: [{ originalName: 'temp.jpg', mimeType: 'image/jpeg', size: tempSize }]
  });
  const tempId = tempReservation.reservations[0].reservationId;

  // Release reservation (simulating interrupted/failed upload)
  await storageQuotaService.releaseReservation(tempId);

  const recoveredUsage = await storageQuotaService.getStorageUsage(testWedding._id);
  assert.equal(recoveredUsage.reservedBytes, 0, 'Reserved storage must be freed on failure');

  // B. Delete existing memory and verify used quota recovery
  const existingMemory = await Memory.findOne({ weddingId: testWedding._id });
  assert.ok(existingMemory);

  const memorySize = existingMemory.fileSize;
  await Memory.findByIdAndDelete(existingMemory._id);

  const afterDeleteUsage = await storageQuotaService.getStorageUsage(testWedding._id);
  assert.equal(afterDeleteUsage.usedBytes, 0, 'Used storage must return to 0 after memory deletion');
  assert.equal(afterDeleteUsage.availableBytes, 5368709120, 'Full 5 GiB quota must be restored');
});

test('5. Protection against Wedding Uploads Disabled Flag', async () => {
  testWedding.uploadEnabled = false;
  await testWedding.save();

  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'blocked.jpg', mimeType: 'image/jpeg', size: 1024 }]
      });
    },
    /Guest uploads are currently paused for this wedding celebration/
  );

  // Restore for subsequent runs
  testWedding.uploadEnabled = true;
  await testWedding.save();
});

test('6. Admin Configurable Min and Max Upload Size Limits for Photos & Videos', async () => {
  // Set custom limits on wedding:
  // Photos: Min 50 KiB (51,200 bytes), Max 8 MiB (8,388,608 bytes)
  // Videos: Min 100 KiB (102,400 bytes), Max 20 MiB (20,971,520 bytes)
  testWedding.minPhotoBytes = 50 * 1024;
  testWedding.maxPhotoBytes = 8 * 1024 * 1024;
  testWedding.minVideoBytes = 100 * 1024;
  testWedding.maxVideoBytes = 20 * 1024 * 1024;
  await testWedding.save();

  // A. Reject photo below custom minimum (20 KiB < 50 KiB)
  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'tiny.jpg', mimeType: 'image/jpeg', size: 20 * 1024 }]
      });
    },
    /smaller than minimum required size/
  );

  // B. Reject photo above custom maximum (9 MiB > 8 MiB)
  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'too_large.jpg', mimeType: 'image/jpeg', size: 9 * 1024 * 1024 }]
      });
    },
    /exceeds the allowed limit for Photo \(max 8 MiB\)/
  );

  // C. Reject video below custom minimum (50 KiB < 100 KiB)
  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'tiny.mp4', mimeType: 'video/mp4', size: 50 * 1024 }]
      });
    },
    /smaller than minimum required size/
  );

  // D. Reject video above custom maximum (25 MiB > 20 MiB)
  await assert.rejects(
    async () => {
      await storageQuotaService.reserveStorage({
        weddingId: testWedding._id,
        files: [{ originalName: 'too_large.mp4', mimeType: 'video/mp4', size: 25 * 1024 * 1024 }]
      });
    },
    /exceeds the allowed limit for Video \(max 20 MiB\)/
  );

  // E. Accept valid photo within custom range (2 MiB)
  const validPhotoRes = await storageQuotaService.reserveStorage({
    weddingId: testWedding._id,
    files: [{ originalName: 'valid.jpg', mimeType: 'image/jpeg', size: 2 * 1024 * 1024 }]
  });
  assert.equal(validPhotoRes.reservations.length, 1);
  await storageQuotaService.releaseReservation(validPhotoRes.reservations[0].reservationId);

  // Restore defaults
  testWedding.minPhotoBytes = STORAGE_LIMITS.MIN_PHOTO_BYTES;
  testWedding.maxPhotoBytes = STORAGE_LIMITS.MAX_PHOTO_BYTES;
  testWedding.minVideoBytes = STORAGE_LIMITS.MIN_VIDEO_BYTES;
  testWedding.maxVideoBytes = STORAGE_LIMITS.MAX_VIDEO_BYTES;
  await testWedding.save();
});
