/**
 * Migration 001: Initial Schema Setup
 * Ensures required indexes exist on MongoDB Atlas
 */

export async function up(db) {
  console.log('Ensuring MongoDB indexes for Royal Wedding Memories...');
  
  // Weddings
  await db.collection('weddings').createIndex({ uploadSlug: 1 }, { unique: true });
  
  // Admins
  await db.collection('admins').createIndex({ email: 1 }, { unique: true });
  await db.collection('admins').createIndex({ weddingId: 1 });
  
  // Memories
  await db.collection('memories').createIndex({ fileKey: 1 }, { unique: true });
  await db.collection('memories').createIndex({ weddingId: 1, uploadStatus: 1, fileType: 1, uploadedAt: -1 });
  
  // UploadReservations (with TTL index)
  await db.collection('uploadreservations').createIndex({ objectKey: 1 }, { unique: true });
  await db.collection('uploadreservations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('uploadreservations').createIndex({ weddingId: 1, status: 1, expiresAt: 1 });
  
  // Audit Logs
  await db.collection('auditlogs').createIndex({ weddingId: 1, timestamp: -1 });
  
  console.log('Migration 001 completed successfully.');
}

export async function down(db) {
  console.log('Rolling back Migration 001...');
}
